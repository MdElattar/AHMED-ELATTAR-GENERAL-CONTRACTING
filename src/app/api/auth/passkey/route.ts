import { NextResponse, type NextRequest } from "next/server";
import { activeSession } from "@/lib/auth/guard";
import { hasRecentStepUp, stepUpRequiredResponse } from "@/lib/auth/step-up";
import { createSession, sessionInputFromUser } from "@/lib/auth/token";
import { setSessionCookie } from "@/lib/auth/cookie";
import { authUnavailable, isAuthConfigError } from "@/lib/auth/response";
import {
  deletePasskey,
  getUserByEmail,
  listPasskeys,
  recordAudit,
  renamePasskey,
  type StoredPasskey,
} from "@/lib/db";
import {
  NO_STORE_HEADERS,
  clientIp,
  isSameOrigin,
  readValidatedJson,
} from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";
import { passkeyDeleteSchema, passkeyRenameSchema } from "@/lib/security/schemas";

function summarize(passkey: StoredPasskey) {
  return {
    credentialId: passkey.credentialId,
    createdAt: passkey.createdAt,
    ...(passkey.lastUsedAt ? { lastUsedAt: passkey.lastUsedAt } : {}),
    ...(passkey.deviceName ? { deviceName: passkey.deviceName } : {}),
    ...(passkey.deviceType ? { deviceType: passkey.deviceType } : {}),
    ...(typeof passkey.backedUp === "boolean" ? { backedUp: passkey.backedUp } : {}),
  };
}

function unauthorized() {
  return NextResponse.json(
    { error: "unauthorized" },
    { status: 401, headers: NO_STORE_HEADERS },
  );
}

export async function GET(request: NextRequest) {
  const ip = clientIp(request);
  const limited = rateLimit(`passkey-list:${ip}`, 60, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: { ...NO_STORE_HEADERS, "Retry-After": String(limited.retryAfter) },
      },
    );
  }

  const session = await activeSession();
  if (!session) return unauthorized();

  const [passkeys, user] = await Promise.all([
    listPasskeys(session.email),
    getUserByEmail(session.email),
  ]);

  return NextResponse.json(
    {
      passkeys: passkeys.map(summarize),
      hasBackupCodes: (user?.backupCodeHashes?.length ?? 0) > 0,
    },
    { headers: NO_STORE_HEADERS },
  );
}

export async function PATCH(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const ip = clientIp(request);
  const limited = rateLimit(`passkey-rename:${ip}`, 30, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: { ...NO_STORE_HEADERS, "Retry-After": String(limited.retryAfter) },
      },
    );
  }

  const session = await activeSession();
  if (!session) return unauthorized();

  const parsed = await readValidatedJson(request, passkeyRenameSchema, 8_000);
  if (!parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const renamed = await renamePasskey(
    session.email,
    parsed.data.credentialId,
    parsed.data.deviceName,
  );
  if (!renamed) {
    return NextResponse.json(
      { error: "not_found" },
      { status: 404, headers: NO_STORE_HEADERS },
    );
  }

  await recordAudit({
    actor: session.email,
    action: "passkey_renamed",
    entity: "user",
    entityId: session.sub,
    meta: { credentialId: renamed.credentialId },
    ip,
  });

  return NextResponse.json(
    { ok: true, passkey: summarize(renamed) },
    { headers: NO_STORE_HEADERS },
  );
}

export async function DELETE(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const ip = clientIp(request);
  const limited = rateLimit(`passkey-delete:${ip}`, 20, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: { ...NO_STORE_HEADERS, "Retry-After": String(limited.retryAfter) },
      },
    );
  }

  const session = await activeSession();
  if (!session) return unauthorized();
  if (!hasRecentStepUp(session)) return stepUpRequiredResponse();

  const parsed = await readValidatedJson(request, passkeyDeleteSchema, 8_000);
  if (!parsed.data) {
    return NextResponse.json(
      { error: "invalid_credential" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const [passkeys, user] = await Promise.all([
    listPasskeys(session.email),
    getUserByEmail(session.email),
  ]);
  if (!user) return unauthorized();
  const target = passkeys.find(
    (passkey) => passkey.credentialId === parsed.data.credentialId,
  );
  if (!target) {
    return NextResponse.json(
      { error: "not_found" },
      { status: 404, headers: NO_STORE_HEADERS },
    );
  }

  const hasBackupCodes = (user.backupCodeHashes?.length ?? 0) > 0;
  if (passkeys.length === 1 && !hasBackupCodes) {
    return NextResponse.json(
      { error: "backup_codes_required" },
      { status: 409, headers: NO_STORE_HEADERS },
    );
  }

  const removed = await deletePasskey(session.email, parsed.data.credentialId);
  if (!removed) {
    return NextResponse.json(
      { error: "not_found" },
      { status: 404, headers: NO_STORE_HEADERS },
    );
  }

  await recordAudit({
    actor: session.email,
    action: "passkey_revoked",
    entity: "user",
    entityId: session.sub,
    meta: { credentialId: parsed.data.credentialId },
    ip,
  });

  const remaining = Math.max(0, passkeys.length - 1);
  const response = NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS });
  try {
    const { token } = await createSession(
      sessionInputFromUser(user, {
        passkeyEnrolled: remaining > 0,
        passkeyPrompt: remaining > 0 ? false : session.passkeyPrompt,
        stepUpAt: session.stepUpAt,
      }),
    );
    setSessionCookie(response, token);
  } catch (error) {
    if (isAuthConfigError(error)) return authUnavailable();
    throw error;
  }
  return response;
}
