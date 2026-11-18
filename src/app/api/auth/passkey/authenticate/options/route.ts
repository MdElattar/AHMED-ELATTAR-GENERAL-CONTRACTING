import { NextResponse, type NextRequest } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { activeSession } from "@/lib/auth/guard";
import { authUnavailable, isAuthConfigError } from "@/lib/auth/response";
import { createWebAuthnChallenge, relyingParty } from "@/lib/auth/webauthn";
import { getUserByEmail, listPasskeys } from "@/lib/db";
import {
  NO_STORE_HEADERS,
  clientIp,
  isSameOrigin,
  readJsonBody,
  safeLogError,
} from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";
import { passkeyOptionsSchema } from "@/lib/security/schemas";

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
    const parsed = passkeyOptionsSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid_request" },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    const { purpose } = parsed.data;
    const session = purpose === "step-up" ? await activeSession() : null;
    if (purpose === "step-up" && !session) {
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 401, headers: NO_STORE_HEADERS },
      );
    }

    // Step-up always re-authenticates the signed-in account; sign-in may omit
    // the email to allow discoverable (usernameless) credentials.
    const email = session?.email ?? parsed.data.email ?? "";
    const user = email ? await getUserByEmail(email) : null;
    const credentials = user ? await listPasskeys(user.email) : [];
    const { rpID } = relyingParty(request);

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: credentials.map((passkey) => ({
        id: passkey.credentialId,
        transports: passkey.transports,
      })),
      userVerification: purpose === "step-up" ? "required" : "preferred",
      timeout: 90_000,
    });

    const response = NextResponse.json({ options }, { headers: NO_STORE_HEADERS });
    await createWebAuthnChallenge(
      response,
      purpose === "step-up" ? "step-up" : "authentication",
      email || undefined,
    );
    return response;
  } catch (error) {
    if (isAuthConfigError(error)) return authUnavailable();
    safeLogError("[passkey] authentication options failed", error);
    return NextResponse.json(
      { error: "passkey_unavailable" },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }
}
