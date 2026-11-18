import { NextResponse, type NextRequest } from "next/server";
import {
  createSession,
  publicSessionUser,
  sessionInputFromUser,
} from "@/lib/auth/token";
import { setSessionCookie } from "@/lib/auth/cookie";
import { resolvePostLoginPath } from "@/lib/auth/redirect";
import { authUnavailable, isAuthConfigError } from "@/lib/auth/response";
import { normalizeBackupCode } from "@/lib/auth/backup-codes";
import { consumeBackupCode, listPasskeys, recordAudit } from "@/lib/db";
import {
  NO_STORE_HEADERS,
  clientIp,
  isSameOrigin,
  readValidatedJson,
} from "@/lib/security/http";
import { rateLimitIdentity } from "@/lib/security/rate-limit";
import { backupCodeRedeemSchema } from "@/lib/security/schemas";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const ip = clientIp(request);
  const parsed = await readValidatedJson(request, backupCodeRedeemSchema, 4_000);
  const identifier = parsed.data?.email ?? null;
  const limited = rateLimitIdentity("backup-code-redeem", ip, identifier, 6, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: { ...NO_STORE_HEADERS, "Retry-After": String(limited.retryAfter) },
      },
    );
  }

  if (!parsed.data) {
    return NextResponse.json(
      { error: "invalid_code" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const { email, code } = parsed.data;
  // The atomic update in `consumeBackupCode` removes one matching hash. It
  // fails for replayed or unknown codes, and never exposes the stored hashes.
  const user = await consumeBackupCode(email, normalizeBackupCode(code));
  if (!user) {
    await recordAudit({
      actor: email,
      action: "login_failed",
      entity: "user",
      meta: { method: "backup_code" },
      ip,
    });
    return NextResponse.json(
      { error: "invalid_code" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  const passkeyEnrolled = (await listPasskeys(user.email)).length > 0;

  let created: Awaited<ReturnType<typeof createSession>>;
  try {
    created = await createSession(
      sessionInputFromUser(user, { passkeyEnrolled, stepUpAt: 0 }),
    );
  } catch (error) {
    if (isAuthConfigError(error)) return authUnavailable();
    throw error;
  }

  await recordAudit({
    actor: user.email,
    action: "login_success",
    entity: "user",
    entityId: user.id,
    meta: { method: "backup_code" },
    ip,
  });

  const response = NextResponse.json(
    {
      user: publicSessionUser(created.session),
      redirectTo: resolvePostLoginPath(user.role, null, passkeyEnrolled),
    },
    { headers: NO_STORE_HEADERS },
  );
  setSessionCookie(response, created.token);
  return response;
}
