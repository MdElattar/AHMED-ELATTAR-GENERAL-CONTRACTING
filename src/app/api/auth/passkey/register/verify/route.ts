import { NextResponse, type NextRequest } from "next/server";
import {
  verifyRegistrationResponse,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { activeSession } from "@/lib/auth/guard";
import { authUnavailable, isAuthConfigError } from "@/lib/auth/response";
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
} from "@/lib/db";
import {
  NO_STORE_HEADERS,
  clientIp,
  isSameOrigin,
  readJsonBody,
} from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";
import { isPlainObject } from "@/lib/security/validation";

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

    const challenge = readWebAuthnChallenge(request, "registration");
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
      requireUserVerification: false,
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

    const passkey = await createPasskey({
      userId: user.id,
      email: user.email,
      credentialId: info.credential.id,
      publicKey: isoBase64URL.fromBuffer(info.credential.publicKey),
      counter: info.credential.counter,
      transports,
      deviceType: info.credentialDeviceType,
      backedUp: info.credentialBackedUp,
    });

    await recordAudit({
      actor: user.email,
      action: "auth.passkey_registered",
      entity: "user",
      entityId: user.id,
      meta: {
        credentialId: passkey.credentialId,
        deviceType: passkey.deviceType ?? "unknown",
      },
      ip,
    });

    const response = NextResponse.json(
      {
        passkey: {
          credentialId: passkey.credentialId,
          createdAt: passkey.createdAt,
          ...(passkey.deviceType ? { deviceType: passkey.deviceType } : {}),
        },
      },
      { status: 201, headers: NO_STORE_HEADERS },
    );
    clearWebAuthnChallenge(response);
    return response;
  } catch (error) {
    if (isAuthConfigError(error)) return authUnavailable();
    console.error("[passkey] registration verification failed", error);
    return NextResponse.json(
      { error: "verification_failed" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }
}
