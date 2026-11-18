import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { hasRecentStepUp, stepUpRequiredResponse } from "@/lib/auth/step-up";
import {
  deleteAllPasskeys,
  getUserByEmail,
  recordAudit,
  updateUser,
} from "@/lib/db";
import {
  NO_STORE_HEADERS,
  clientIp,
  isSameOrigin,
  readValidatedJson,
} from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";
import { passkeyResetSchema } from "@/lib/security/schemas";

/**
 * Administrator-assisted recovery. Deleting the target's passkeys and bumping
 * their sessionVersion invalidates all existing sessions, so they must sign in
 * again with a password (or a backup code) and re-enroll.
 */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const ip = clientIp(request);
  const limited = rateLimit(`admin-passkey-reset:${ip}`, 10, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: { ...NO_STORE_HEADERS, "Retry-After": String(limited.retryAfter) },
      },
    );
  }

  const actor = await requireAdmin();
  if (!actor) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }
  if (!hasRecentStepUp(actor)) return stepUpRequiredResponse();

  const parsed = await readValidatedJson(request, passkeyResetSchema, 4_000);
  if (!parsed.data) {
    return NextResponse.json(
      { error: "invalid_request" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const { email, reason } = parsed.data;
  if (email === actor.email.trim().toLowerCase()) {
    return NextResponse.json(
      { error: "self_reset_forbidden" },
      { status: 409, headers: NO_STORE_HEADERS },
    );
  }

  const target = await getUserByEmail(email);
  if (!target) {
    return NextResponse.json(
      { error: "user_not_found" },
      { status: 404, headers: NO_STORE_HEADERS },
    );
  }

  const removed = await deleteAllPasskeys(target.email);
  await updateUser(target.email, {
    sessionVersion: (target.sessionVersion ?? 0) + 1,
  });

  await recordAudit({
    actor: actor.email,
    action: "admin_passkey_reset",
    entity: "user",
    entityId: target.id,
    meta: {
      reason,
      targetEmail: target.email,
      removedPasskeys: removed,
    },
    ip,
  });

  return NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS });
}
