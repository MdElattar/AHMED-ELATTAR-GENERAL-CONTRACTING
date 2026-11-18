/**
 * Canonical, shared permission matrix.
 *
 * This module is deliberately free of server-only imports so the proxy,
 * route handlers and client chrome all resolve access from one definition.
 */
export type Role = "client" | "manager" | "admin";

export type Permission =
  | "portal:access"
  | "admin:access"
  | "admin:projects:write"
  | "admin:content:write"
  | "admin:access:manage";

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  client: ["portal:access"],
  manager: [
    "portal:access",
    "admin:access",
    "admin:projects:write",
    "admin:content:write",
  ],
  admin: [
    "portal:access",
    "admin:access",
    "admin:projects:write",
    "admin:content:write",
    "admin:access:manage",
  ],
};

export function isRole(value: unknown): value is Role {
  return value === "client" || value === "manager" || value === "admin";
}

export function hasPermission(role: Role | undefined | null, permission: Permission) {
  return role ? ROLE_PERMISSIONS[role].includes(permission) : false;
}

/** Managers and admins share the executive workspace. */
export function canAccessAdmin(role: Role | undefined | null) {
  return hasPermission(role, "admin:access");
}

/** Only the environment-configured super-admin may delegate access. */
export function canManageAccess(role: Role | undefined | null) {
  return hasPermission(role, "admin:access:manage");
}
