import { NextResponse, type NextRequest } from "next/server";
import { activeSession } from "@/lib/auth/guard";
import { deletePasskey, listPasskeys, recordAudit } from "@/lib/db";
import {
  NO_STORE_HEADERS,
  clientIp,
  isSameOrigin,
  readJsonBody,
} from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";
import { passkeyDeleteSchema } from "@/lib/security/schemas";

function summarize(
  passkeys: Awaited<ReturnType<typeof listPasskeys>>,
) {
  return passkeys.map((passkey) => ({
    credentialId: passkey.credentialId,
    createdAt: passkey.createdAt,
    ...(passkey.lastUsedAt ? { lastUsedAt: passkey.lastUsedAt } : {}),
    ...(passkey.deviceType ? { deviceType: passkey.deviceType } : {}),
  }));
}

export async function GET() {
  const session = await activeSession();
  if (!session) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  const passkeys = await listPasskeys(session.email);
  return NextResponse.json(
    { passkeys: summarize(passkeys) },
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
  if (!session) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  const parsed = passkeyDeleteSchema.safeParse(await readJsonBody(request, 8_000));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_credential" },
      { status: 400, headers: NO_STORE_HEADERS },
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
    action: "auth.passkey_removed",
    entity: "user",
    entityId: session.sub,
    meta: { credentialId: parsed.data.credentialId },
    ip,
  });

  return NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS });
}
