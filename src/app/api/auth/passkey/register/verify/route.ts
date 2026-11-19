import { NextResponse, type NextRequest } from "next/server";
import {
  verifyRegistrationResponse,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { activeSession } from "@/lib/auth/guard";
import {
  REMEMBERED_SESSION_TTL_SECONDS,
  createSession,
  publicSessionUser,
  sessionInputFromUser,
} from "@/lib/auth/token";
import { setSessionCookie } from "@/lib/auth/cookie";
import { resolvePostLoginPath } from "@/lib/auth/redirect";
import { authUnavailable, isAuthConfigError } from "@/lib/auth/response";
import { generateBackupCodes } from "@/lib/auth/backup-codes";
import {
  clearWebAuthnChallenge,
  readWebAuthnChallenge,
  relyingParty,
} from "@/lib/auth/webauthn";
import {
  createPasskey,
  getPasskeyByCredentialId,
  getUserByEmail,
  recordAudit,
  setBackupCodes,
} from "@/lib/db";
import {
  NO_STORE_HEADERS,
  clientIp,
  isSameOrigin,
  readJsonBody,
  safeLogError,
} from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";
import { cleanString, isPlainObject } from "@/lib/security/validation";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const ip = clientIp(request);
  const limited = rateLimit(`passkey-register-verify:${ip}`, 12, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: { ...NO_STORE_HEADERS, "Retry-After": String(limited.retryAfter) },
      },
    );
  }

  try {
    const session = await activeSession();
    if (!session) {
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 401, headers: NO_STORE_HEADERS },
      );
    }

    const body = await readJsonBody(request, 96_000);
    if (!isPlainObject(body) || !isPlainObject(body.response)) {
      return NextResponse.json(
        { error: "invalid_response" },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    // Registration is tied to the signed-in account: the challenge was created
    // for this email and is consumed atomically before any verification work.
    const challenge = await readWebAuthnChallenge(request, "registration");
    if (!challenge || challenge.email !== session.email) {
      return NextResponse.json(
        { error: "expired_challenge" },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    const { rpID, origin } = relyingParty(request);
    const verification = await verifyRegistrationResponse({
      response: body.response as unknown as RegistrationResponseJSON,
      expectedChallenge: challenge.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });

    if (!verification.verified) {
      return NextResponse.json(
        { error: "verification_failed" },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    const user = await getUserByEmail(session.email);
    if (!user) {
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 401, headers: NO_STORE_HEADERS },
      );
    }

    const info = verification.registrationInfo;
    const existing = await getPasskeyByCredentialId(info.credential.id);
    if (existing) {
      return NextResponse.json(
        { error: "passkey_exists" },
        { status: 409, headers: NO_STORE_HEADERS },
      );
    }

    const responseRecord = body.response.response;
    const transports =
      isPlainObject(responseRecord) && Array.isArray(responseRecord.transports)
        ? responseRecord.transports.filter(
            (transport): transport is string => typeof transport === "string",
          )
        : [];
    const deviceName = cleanString(body.deviceName, 80) || "This device";

    const passkey = await createPasskey({
      userId: user.id,
      email: user.email,
      credentialId: info.credential.id,
      publicKey: isoBase64URL.fromBuffer(info.credential.publicKey),
      counter: info.credential.counter,
      transports,
      deviceType: info.credentialDeviceType,
      deviceName,
      backedUp: info.credentialBackedUp,
    });

    await recordAudit({
      actor: user.email,
      action: "passkey_registered",
      entity: "user",
      entityId: user.id,
      meta: {
        credentialId: passkey.credentialId,
        deviceName,
        deviceType: passkey.deviceType ?? "unknown",
      },
      ip,
    });

    // Recovery codes are issued exactly once, on first enrollment.
    let backupCodes: string[] | undefined;
    if (!user.backupCodeHashes || user.backupCodeHashes.length === 0) {
      backupCodes = generateBackupCodes();
      await setBackupCodes(user.email, backupCodes);
    }

    // Reissue the cookie so the passkey-enrollment gate sees the new state on
    // the very next request instead of waiting for another sign-in. Enrollment
    // also counts as a fresh step-up for subsequent sensitive operations.
    const stepUpAt = Math.floor(Date.now() / 1000);
    const { token, session: refreshed } = await createSession(
      sessionInputFromUser(user, { passkeyEnrolled: true, stepUpAt }),
      REMEMBERED_SESSION_TTL_SECONDS,
    );

    const next = typeof body.next === "string" ? body.next : undefined;
    const response = NextResponse.json(
      {
        passkey: {
          credentialId: passkey.credentialId,
          createdAt: passkey.createdAt,
          deviceName: passkey.deviceName,
          ...(passkey.deviceType ? { deviceType: passkey.deviceType } : {}),
          ...(typeof passkey.backedUp === "boolean" ? { backedUp: passkey.backedUp } : {}),
        },
        user: publicSessionUser(refreshed),
        stepUpAt,
        redirectTo: resolvePostLoginPath(session.role, next),
        ...(backupCodes ? { backupCodes } : {}),
      },
      { status: 201, headers: NO_STORE_HEADERS },
    );
    setSessionCookie(response, token, REMEMBERED_SESSION_TTL_SECONDS);
    clearWebAuthnChallenge(response);
    return response;
  } catch (error) {
    if (isAuthConfigError(error)) return authUnavailable();
    safeLogError("[passkey] registration verification failed", error);
    return NextResponse.json(
      { error: "verification_failed" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }
}
