import "server-only";
import { cookies } from "next/headers";
import { canAccessAdmin, canManageAccess } from "@/lib/auth/permissions";
import { getProjectBySlug, getUserByEmail, type StoredProject } from "@/lib/db";
import {
  SESSION_COOKIE,
  isPrimaryAdminEmail,
  verifySession,
  type SessionPayload,
} from "./token";
import { hasRecentStepUp } from "./step-up";

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

export async function requirePortalSession(): Promise<SessionPayload | null> {
  return activeSession();
}

/**
 * Active session plus a fresh step-up. Sensitive route handlers should use
 * this (and `stepUpRequiredResponse()` on failure) instead of trusting the
 * client to claim that re-authentication happened.
 */
export async function requireStepUpSession(maxAgeSeconds?: number): Promise<SessionPayload | null> {
  const session = await activeSession();
  return session && hasRecentStepUp(session, maxAgeSeconds) ? session : null;
}

/**
 * IDOR boundary for every portal resource. Administrators may operate on any
 * project; clients only receive a project when their verified email is stored
 * on the project record. Never derive ownership from a request parameter.
 */
export async function ownedProject(
  session: SessionPayload,
  slug: string,
): Promise<StoredProject | null> {
  const project = await getProjectBySlug(slug);
  if (!project) return null;
  if (canAccessAdmin(session.role)) return project;

  const email = session.email.trim().toLowerCase();
  const payloadOwners = Array.isArray(project.payload.clientEmails)
    ? project.payload.clientEmails
    : [];
  const allowed =
    project.clientEmails.includes(email) ||
    payloadOwners.some((value) => typeof value === "string" && value.toLowerCase() === email);
  return allowed ? project : null;
}

export async function requireAdmin(): Promise<SessionPayload | null> {
  const session = await activeSession();
  return session && canAccessAdmin(session.role) ? session : null;
}

/** Only the environment-configured super-admin can grant or revoke admins. */
export async function requirePrimaryAdmin(): Promise<SessionPayload | null> {
  const session = await requireAdmin();
  if (!session || !canManageAccess(session.role)) return null;
  return isPrimaryAdminEmail(session.email) ? session : null;
}
