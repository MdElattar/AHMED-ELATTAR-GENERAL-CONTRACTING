import { NextResponse, type NextRequest } from "next/server";
import { activeSession } from "@/lib/auth/guard";
import { hasRecentStepUp, stepUpRequiredResponse } from "@/lib/auth/step-up";
import { generateBackupCodes } from "@/lib/auth/backup-codes";
import { authUnavailable, isAuthConfigError } from "@/lib/auth/response";
import { recordAudit, setBackupCodes } from "@/lib/db";
import {
  NO_STORE_HEADERS,
  clientIp,
  isSameOrigin,
} from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";

/**
 * Regenerates the one-time recovery codes. The plaintext is returned exactly
 * once; only hashes are persisted. A fresh step-up is required so a stolen long
 * lived session cannot mint new recovery material.
 */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const ip = clientIp(request);
  const limited = rateLimit(`backup-codes-regenerate:${ip}`, 5, 15 * 60 * 1000);
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
  if (!hasRecentStepUp(session)) return stepUpRequiredResponse();

  const codes = generateBackupCodes();
  try {
    await setBackupCodes(session.email, codes);
  } catch (error) {
    if (isAuthConfigError(error)) return authUnavailable();
    throw error;
  }

  await recordAudit({
    actor: session.email,
    action: "backup_codes_regenerated",
    entity: "user",
    entityId: session.sub,
    ip,
  });

  return NextResponse.json(
    { backupCodes: codes },
    { headers: NO_STORE_HEADERS },
  );
}
