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
 * Managers and admins who have no passkey are sent to enrollment first; the
 * already-authorised destination is carried in `next` so it survives the
 * ceremony. Clients are never forced to enroll.
 */
export function resolvePostLoginPath(
  role: "client" | "manager" | "admin",
  next?: string | null,
  passkeyEnrolled?: boolean,
): string {
  const fallback = role === "client" ? "/portal" : "/admin";
  let destination = fallback;

  if (typeof next === "string" && isSafeInternalPath(next)) {
    const pathname = pathnameOf(next);
    const allowedForRole = role !== "client" || !isAdminPath(pathname);
    if (!isAuthPath(pathname) && allowedForRole) destination = next;
  }

  if (role !== "client" && passkeyEnrolled === false) {
    return `/passkey-enroll?next=${encodeURIComponent(destination)}`;
  }

  return destination;
}
