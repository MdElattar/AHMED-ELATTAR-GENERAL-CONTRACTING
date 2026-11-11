import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession, type SessionPayload } from "./token";

/**
 * Reads and verifies the signed session cookie for server-side route handlers.
 * Returns null for anonymous visitors or tampered/expired tokens.
 */
export async function currentSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? verifySession(token) : null;
}

export async function requireAdmin(): Promise<SessionPayload | null> {
  const session = await currentSession();
  return session?.role === "admin" ? session : null;
}
