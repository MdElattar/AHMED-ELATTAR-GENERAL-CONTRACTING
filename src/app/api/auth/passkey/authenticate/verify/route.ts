import { NextResponse, type NextRequest } from "next/server";
import {
  verifyAuthenticationResponse,
  type AuthenticationResponseJSON,
} from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import {
  REMEMBERED_SESSION_TTL_SECONDS,
  SESSION_TTL_SECONDS,
  createSession,
  publicSessionUser,
  sessionInputFromUser,
} from "@/lib/auth/token";
import { setSessionCookie } from "@/lib/auth/cookie";
import { resolvePostLoginPath } from "@/lib/auth/redirect";
import { activeSession } from "@/lib/auth/guard";
import { authUnavailable, isAuthConfigError } from "@/lib/auth/response";
import {
  clearWebAuthnChallenge,
  readWebAuthnChallenge,
  relyingParty,
} from "@/lib/auth/webauthn";
import {
  getPasskeyByCredentialId,
  getUserByEmail,
  recordAudit,
  touchPasskey,
  updateUser,
} from "@/lib/db";
import {
  NO_STORE_HEADERS,
  clientIp,
  isSameOrigin,
  readValidatedJson,
  safeLogError,
} from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";
import { passkeyAuthVerifySchema } from "@/lib/security/schemas";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const ip = clientIp(request);
  const limited = rateLimit(`passkey-auth-verify:${ip}`, 12, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: { ...NO_STORE_HEADERS, "Retry-After": String(limited.retryAfter) },
      },
    );
  }

  const fail = async (email: string, entityId?: string) => {
    await recordAudit({
      actor: email || "unknown",
      action: "login_failed",
      entity: "user",
      ...(entityId ? { entityId } : {}),
      meta: { method: "passkey" },
      ip,
    });
    return NextResponse.json(
      { error: "invalid_credentials" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  };

  try {
    const parsed = await readValidatedJson(request, passkeyAuthVerifySchema, 96_000);
    if (!parsed.data) {
      return NextResponse.json(
        { error: "invalid_response" },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    const { purpose, remember, next } = parsed.data;
    const challengeKind = purpose === "step-up" ? "step-up" : "authentication";
    const challenge = await readWebAuthnChallenge(request, challengeKind);
    if (!challenge) {
      return NextResponse.json(
        { error: "expired_challenge" },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    const assertion = parsed.data.response as unknown as AuthenticationResponseJSON;
    const credentialId = typeof assertion.id === "string" ? assertion.id : "";
    const passkey = credentialId
      ? await getPasskeyByCredentialId(credentialId)
      : null;

    if (!passkey) return await fail(challenge.email ?? "", undefined);
    if (challenge.email && challenge.email !== passkey.email) {
      return await fail(passkey.email, passkey.userId);
    }

    const stepUpSession = purpose === "step-up" ? await activeSession() : null;
    if (purpose === "step-up" && (!stepUpSession || stepUpSession.email !== passkey.email)) {
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 401, headers: NO_STORE_HEADERS },
      );
    }

    const user = await getUserByEmail(passkey.email);
    if (!user) return await fail(passkey.email, passkey.userId);

    const { rpID, origin } = relyingParty(request);
    const verification = await verifyAuthenticationResponse({
      response: assertion,
      expectedChallenge: challenge.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: passkey.credentialId,
        publicKey: isoBase64URL.toBuffer(passkey.publicKey),
        counter: passkey.counter,
        transports: passkey.transports,
      },
      requireUserVerification: purpose === "step-up",
    });

    if (!verification.verified) return await fail(passkey.email, user.id);

    await touchPasskey(credentialId, verification.authenticationInfo.newCounter);

    const now = Math.floor(Date.now() / 1000);
    await updateUser(user.email, { lastLoginAt: new Date().toISOString() });

    // Current sessionVersion is used as-is: it is already persisted, so the
    // token survives activeSession()'s reconciliation check.
    const ttl =
      purpose === "step-up"
        ? SESSION_TTL_SECONDS
        : remember
          ? REMEMBERED_SESSION_TTL_SECONDS
          : SESSION_TTL_SECONDS;
    const { token, session } = await createSession(
      sessionInputFromUser(user, {
        passkeyEnrolled: true,
        stepUpAt: purpose === "step-up" ? now : 0,
      }),
      ttl,
    );

    if (purpose === "step-up") {
      await recordAudit({
        actor: user.email,
        action: "step_up_verified",
        entity: "user",
        entityId: user.id,
        meta: { method: "passkey", credentialId },
        ip,
      });
    } else {
      await recordAudit({
        actor: user.email,
        action: "login_success",
        entity: "user",
        entityId: user.id,
        meta: { method: "passkey", credentialId },
        ip,
      });
    }

    const body = purpose === "step-up"
      ? { user: publicSessionUser(session), stepUpAt: session.stepUpAt, ok: true }
      : {
          user: publicSessionUser(session),
          redirectTo: resolvePostLoginPath(user.role, next, true),
        };
    const response = NextResponse.json(body, { headers: NO_STORE_HEADERS });
    setSessionCookie(response, token, ttl);
    clearWebAuthnChallenge(response);
    return response;
  } catch (error) {
    if (isAuthConfigError(error)) return authUnavailable();
    safeLogError("[passkey] authentication verification failed", error);
    return NextResponse.json(
      { error: "invalid_credentials" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }
}
