import { canAccessAdmin } from "@/lib/auth/permissions";
import { isSafeInternalPath } from "@/lib/security/validation";

/**
 * Routes that always restart the login ceremony. Sending a signed-in user back
 * to one of them after authentication would create a redirect loop.
 */
const AUTH_PATHS = [
  "/sign-in",
  "/sign-up",
  "/auth",
  "/reset-password",
  "/passkey-enroll",
] as const;

function pathnameOf(value: string) {
  const end = value.search(/[?#]/);
  return end === -1 ? value : value.slice(0, end);
}

function isAuthPath(pathname: string) {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return AUTH_PATHS.some(
    (route) => normalized === route || normalized.startsWith(`${route}/`),
  );
}

function isAdminPath(pathname: string) {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return normalized === "/admin" || normalized.startsWith("/admin/");
}

/**
 * Resolves the post-authentication destination from a caller supplied `next`
 * value. Only same-origin relative paths are accepted, auth routes are always
 * rejected, and clients can never be redirected into the admin area.
 *
 * Enrollment is optional and never blocks the authorised destination; the
 * account settings area owns the full setup flow.
 */
export function resolvePostLoginPath(
  role: "client" | "manager" | "admin",
  next?: string | null,
): string {
  const fallback = canAccessAdmin(role) ? "/admin" : "/portal";
  let destination = fallback;

  if (typeof next === "string" && isSafeInternalPath(next)) {
    const pathname = pathnameOf(next);
    const allowedForRole = canAccessAdmin(role) || !isAdminPath(pathname);
    if (!isAuthPath(pathname) && allowedForRole) destination = next;
  }

  return destination;
}
