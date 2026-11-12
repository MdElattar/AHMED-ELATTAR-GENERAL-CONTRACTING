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
} from "@/lib/auth/token";
import { setSessionCookie } from "@/lib/auth/cookie";
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
  readJsonBody,
} from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";
import { isPlainObject } from "@/lib/security/validation";

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

  try {
    const body = await readJsonBody(request, 96_000);
    if (!isPlainObject(body) || !isPlainObject(body.response)) {
      return NextResponse.json(
        { error: "invalid_response" },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    const challenge = readWebAuthnChallenge(request, "authentication");
    if (!challenge) {
      return NextResponse.json(
        { error: "expired_challenge" },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    const assertion = body.response as unknown as AuthenticationResponseJSON;
    const credentialId =
      typeof assertion.id === "string" ? assertion.id : "";
    const passkey = credentialId
      ? await getPasskeyByCredentialId(credentialId)
      : null;

    if (!passkey) {
      return NextResponse.json(
        { error: "invalid_credentials" },
        { status: 401, headers: NO_STORE_HEADERS },
      );
    }
    if (challenge.email && challenge.email !== passkey.email) {
      return NextResponse.json(
        { error: "invalid_credentials" },
        { status: 401, headers: NO_STORE_HEADERS },
      );
    }

    const user = await getUserByEmail(passkey.email);
    if (!user) {
      return NextResponse.json(
        { error: "invalid_credentials" },
        { status: 401, headers: NO_STORE_HEADERS },
      );
    }

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
      requireUserVerification: false,
    });

    if (!verification.verified) {
      await recordAudit({
        actor: passkey.email,
        action: "auth.passkey_failed",
        entity: "user",
        entityId: user.id,
        ip,
      });
      return NextResponse.json(
        { error: "invalid_credentials" },
        { status: 401, headers: NO_STORE_HEADERS },
      );
    }

    await touchPasskey(credentialId, verification.authenticationInfo.newCounter);

    const remember =
      typeof body.remember === "boolean" ? body.remember : true;
    const ttl = remember ? REMEMBERED_SESSION_TTL_SECONDS : SESSION_TTL_SECONDS;
    const { token, session } = await createSession(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
        accountId: user.accountId,
        ...(user.phone ? { phone: user.phone } : {}),
        role: user.role,
        sessionVersion: user.sessionVersion ?? 0,
      },
      ttl,
    );

    await updateUser(user.email, { lastLoginAt: new Date().toISOString() });
    await recordAudit({
      actor: user.email,
      action: "auth.passkey_sign_in",
      entity: "user",
      entityId: user.id,
      meta: { credentialId },
      ip,
    });

    const response = NextResponse.json(
      { user: publicSessionUser(session) },
      { headers: NO_STORE_HEADERS },
    );
    setSessionCookie(response, token, remember ? ttl : undefined);
    clearWebAuthnChallenge(response);
    return response;
  } catch (error) {
    if (isAuthConfigError(error)) return authUnavailable();
    console.error("[passkey] authentication verification failed", error);
    return NextResponse.json(
      { error: "invalid_credentials" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }
}
