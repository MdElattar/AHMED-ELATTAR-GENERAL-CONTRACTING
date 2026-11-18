import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { NO_STORE_HEADERS } from "@/lib/security/http";
import { SESSION_COOKIE, verifySession, type SessionPayload } from "./token";

/** A successful step-up is valid for five minutes by default. */
export const STEP_UP_MAX_AGE_SECONDS = 5 * 60;

/**
 * `stepUpAt` comes from the signed session token, never from the request body.
 * A negative age (clock skew or a future timestamp) is rejected as well.
 */
export function hasRecentStepUp(
  session: Pick<SessionPayload, "stepUpAt"> | null | undefined,
  maxAgeSeconds = STEP_UP_MAX_AGE_SECONDS,
): boolean {
  if (!session) return false;
  const stepUpAt = Number(session.stepUpAt) || 0;
  if (stepUpAt <= 0) return false;

  const age = Math.floor(Date.now() / 1000) - stepUpAt;
  return age >= 0 && age <= maxAgeSeconds;
}

/** Uniform 428 response for every sensitive operation that needs a step-up. */
export function stepUpRequiredResponse() {
  return NextResponse.json(
    { error: "step_up_required" },
    { status: 428, headers: NO_STORE_HEADERS },
  );
}

/**
 * Convenience guard for route handlers. Accepts an already-verified session
 * (preferred, because it has been reconciled with the live account), a
 * `NextRequest` whose signed cookie should be read, or nothing to read the
 * current request cookies. Returns the session only when the step-up is fresh.
 */
export async function requireStepUp(
  source?: SessionPayload | NextRequest | null,
  maxAgeSeconds = STEP_UP_MAX_AGE_SECONDS,
): Promise<SessionPayload | null> {
  let session: SessionPayload | null = null;

  if (!source) {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    session = token ? await verifySession(token) : null;
  } else if ("cookies" in source) {
    const token = source.cookies.get(SESSION_COOKIE)?.value;
    session = token ? await verifySession(token) : null;
  } else {
    session = source;
  }

  return hasRecentStepUp(session, maxAgeSeconds) ? session : null;
}
