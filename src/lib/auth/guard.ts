import { cookies } from "next/headers";
import { getUserByEmail } from "@/lib/db";
import {
  SESSION_COOKIE,
  isPrimaryAdminEmail,
  verifySession,
  type SessionPayload,
} from "./token";

/**
 * Reads and verifies the signed session cookie for server-side route handlers.
 * Returns null for anonymous visitors or tampered/expired tokens.
 */
export async function currentSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? verifySession(token) : null;
}

/**
 * Reconciles the signed token with the live user record. This is what makes
 * co-admin revocation immediate: changing the role increments sessionVersion,
 * so every token issued before the change stops working.
 */
export async function activeSession(
  session?: SessionPayload | null,
): Promise<SessionPayload | null> {
  const candidate = session ?? (await currentSession());
  if (!candidate) return null;

  const user = await getUserByEmail(candidate.email);
  if (!user) return null;
  if ((user.sessionVersion ?? 0) !== candidate.sessionVersion) return null;

  return { ...candidate, role: user.role };
}

export async function requireAdmin(): Promise<SessionPayload | null> {
  const session = await activeSession();
  return session?.role === "admin" ? session : null;
}

/** Only the environment-configured super-admin can grant or revoke admins. */
export async function requirePrimaryAdmin(): Promise<SessionPayload | null> {
  const session = await requireAdmin();
  if (!session) return null;
  return isPrimaryAdminEmail(session.email) ? session : null;
}
