import { NextResponse, type NextRequest } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { activeSession } from "@/lib/auth/guard";
import { authUnavailable, isAuthConfigError } from "@/lib/auth/response";
import {
  createWebAuthnChallenge,
  relyingParty,
  webauthnUserID,
} from "@/lib/auth/webauthn";
import { getUserByEmail, listPasskeys } from "@/lib/db";
import {
  NO_STORE_HEADERS,
  clientIp,
  isSameOrigin,
} from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const limited = rateLimit(
    `passkey-register-options:${clientIp(request)}`,
    12,
    15 * 60 * 1000,
  );
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

    const user = await getUserByEmail(session.email);
    if (!user) {
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 401, headers: NO_STORE_HEADERS },
      );
    }

    const existing = await listPasskeys(user.email);
    const { rpID, rpName } = relyingParty(request);
    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: webauthnUserID(user.id, user.email),
      userName: user.email,
      userDisplayName: user.name,
      attestationType: "none",
      excludeCredentials: existing.map((passkey) => ({
        id: passkey.credentialId,
        transports: passkey.transports,
      })),
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
      },
      timeout: 90_000,
    });

    const response = NextResponse.json({ options }, { headers: NO_STORE_HEADERS });
    createWebAuthnChallenge(response, "registration", user.email);
    return response;
  } catch (error) {
    if (isAuthConfigError(error)) return authUnavailable();
    console.error("[passkey] registration options failed", error);
    return NextResponse.json(
      { error: "passkey_unavailable" },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }
}
