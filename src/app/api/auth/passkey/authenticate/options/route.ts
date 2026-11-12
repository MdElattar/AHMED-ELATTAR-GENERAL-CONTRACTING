import { NextResponse, type NextRequest } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { authUnavailable, isAuthConfigError } from "@/lib/auth/response";
import {
  createWebAuthnChallenge,
  relyingParty,
} from "@/lib/auth/webauthn";
import { getUserByEmail, listPasskeys } from "@/lib/db";
import {
  NO_STORE_HEADERS,
  clientIp,
  isSameOrigin,
  readJsonBody,
} from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";
import { normalizeEmail } from "@/lib/security/validation";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const ip = clientIp(request);
  const limited = rateLimit(`passkey-auth-options:${ip}`, 20, 15 * 60 * 1000);
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
    const body = await readJsonBody(request, 4_000);
    const email =
      body && typeof body.email === "string"
        ? normalizeEmail(body.email)
        : "";

    const user = email ? await getUserByEmail(email) : null;
    const credentials = user ? await listPasskeys(user.email) : [];
    const { rpID } = relyingParty(request);

    // An empty allowCredentials list enables discoverable-credential
    // (usernameless) passkey sign-in. When an email is supplied we narrow the
    // browser prompt to that account's registered authenticators.
    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: credentials.map((passkey) => ({
        id: passkey.credentialId,
        transports: passkey.transports,
      })),
      userVerification: "preferred",
      timeout: 90_000,
    });

    const response = NextResponse.json({ options }, { headers: NO_STORE_HEADERS });
    createWebAuthnChallenge(response, "authentication", email || undefined);
    return response;
  } catch (error) {
    if (isAuthConfigError(error)) return authUnavailable();
    console.error("[passkey] authentication options failed", error);
    return NextResponse.json(
      { error: "passkey_unavailable" },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }
}
