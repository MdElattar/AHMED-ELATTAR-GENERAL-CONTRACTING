import { randomBytes } from "node:crypto";

export const SESSION_COOKIE = "alattar_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
export const REMEMBERED_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

export type SessionRole = "client" | "admin";

export type SessionPayload = {
  sub: string;
  email: string;
  name: string;
  company: string;
  accountId: string;
  phone?: string;
  role: SessionRole;
  /** Incremented when a role changes or an administrator is revoked. */
  sessionVersion: number;
  iat: number;
  exp: number;
};

export type SessionInput = Omit<SessionPayload, "iat" | "exp">;

export type PublicSessionUser = {
  name: string;
  email: string;
  company: string;
  accountId: string;
  phone?: string;
  role: SessionRole;
  /** True only for the configured super-admin identity. */
  primaryAdmin: boolean;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const DEV_FALLBACK_SECRET = "alattar-local-development-session-secret";

/**
 * Thrown when the deployment is missing a valid signing secret. Route handlers
 * translate this into a 503 JSON response instead of an unhandled 500 so the
 * client can show an actionable message.
 */
export class AuthConfigError extends Error {
  constructor() {
    super("AUTH_SECRET must be set to at least 32 characters in production.");
    this.name = "AuthConfigError";
  }
}

let keyPromise: Promise<CryptoKey> | null = null;

function sessionSecret() {
  // AUTH_SECRET is the canonical name; JWT_SECRET is accepted for deployments
  // that already provision the conventional variable.
  const value = (process.env.AUTH_SECRET ?? process.env.JWT_SECRET)?.trim();
  if (value && value.length >= 32) return value;

  // Development keeps a predictable local secret so the app remains runnable
  // without extra setup. Never use this path in production.
  if (process.env.NODE_ENV === "production") {
    throw new AuthConfigError();
  }

  return DEV_FALLBACK_SECRET;
}

function getKey() {
  if (!keyPromise) {
    keyPromise = Promise.resolve()
      .then(() =>
        crypto.subtle.importKey(
          "raw",
          encoder.encode(sessionSecret()),
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign", "verify"],
        ),
      )
      .catch((error: unknown) => {
        // Do not cache a rejected key: a later deploy/restart with the env var
        // present must be able to recover without a new process.
        keyPromise = null;
        throw error;
      });
  }
  return keyPromise;
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  const chunk = 0x8000;

  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "===".slice((normalized.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSessionRole(value: unknown): value is SessionRole {
  return value === "client" || value === "admin";
}

function safeText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/**
 * The super-admin identity is deliberately controlled by environment, not by a
 * mutable database role. Co-admins can manage content and operations, but only
 * this identity can delegate or revoke administrative access.
 */
export function primaryAdminEmail() {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "";
}

export function isPrimaryAdminEmail(email: string) {
  const primary = primaryAdminEmail();
  return Boolean(primary) && email.trim().toLowerCase() === primary;
}

export async function createSession(
  input: SessionInput,
  ttlSeconds = SESSION_TTL_SECONDS,
): Promise<{ token: string; session: SessionPayload }> {
  const now = Math.floor(Date.now() / 1000);
  const session: SessionPayload = {
    ...input,
    iat: now,
    exp: now + ttlSeconds,
  };

  const body = toBase64Url(encoder.encode(JSON.stringify(session)));
  const signature = await crypto.subtle.sign("HMAC", await getKey(), encoder.encode(body));

  return {
    token: `${body}.${toBase64Url(new Uint8Array(signature))}`,
    session,
  };
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const [body, signature] = token.split(".");
    if (!body || !signature) return null;

    const valid = await crypto.subtle.verify(
      "HMAC",
      await getKey(),
      fromBase64Url(signature),
      encoder.encode(body),
    );

    if (!valid) return null;

    const parsed: unknown = JSON.parse(decoder.decode(fromBase64Url(body)));
    if (!isRecord(parsed)) return null;

    const now = Math.floor(Date.now() / 1000);
    const email = safeText(parsed.email, 254).toLowerCase();
    const name = safeText(parsed.name, 120);
    const company = safeText(parsed.company, 160);
    const accountId = safeText(parsed.accountId, 32);
    const phone = safeText(parsed.phone, 40);
    const role = parsed.role;
    const exp = parsed.exp;
    const iat = parsed.iat;
    const sessionVersion =
      typeof parsed.sessionVersion === "number" && parsed.sessionVersion >= 0
        ? Math.floor(parsed.sessionVersion)
        : 0;

    if (!email || !name || !company || !accountId) return null;
    if (!isSessionRole(role)) return null;
    if (typeof exp !== "number" || exp <= now) return null;
    if (typeof iat !== "number" || iat > now + 300) return null;

    return {
      sub: safeText(parsed.sub, 64) || accountId,
      email,
      name,
      company,
      accountId,
      ...(phone ? { phone } : {}),
      role,
      sessionVersion,
      iat,
      exp,
    };
  } catch {
    return null;
  }
}

export function publicSessionUser(session: SessionPayload): PublicSessionUser {
  return {
    name: session.name,
    email: session.email,
    company: session.company,
    accountId: session.accountId,
    ...(session.phone ? { phone: session.phone } : {}),
    role: session.role,
    primaryAdmin: isPrimaryAdminEmail(session.email),
  };
}

export function randomAccountId() {
  const bytes = new Uint8Array(2);
  crypto.getRandomValues(bytes);
  const value = ((bytes[0] << 8) | bytes[1]) % 9000 + 1000;
  return `ALT-${value}`;
}

export function randomReference(prefix = "ALT") {
  const bytes = new Uint8Array(2);
  crypto.getRandomValues(bytes);
  const value = ((bytes[0] << 8) | bytes[1]) % 9000 + 1000;
  return `${prefix}-${new Date().getFullYear()}-${value}`;
}

export const RESET_COOKIE = "alattar_reset";
export const RESET_TTL_SECONDS = 15 * 60;

type ResetPayload = {
  email: string;
  token: string;
  purpose: "password-reset";
  iat: number;
  exp: number;
};

/**
 * Short-lived, HMAC-signed proof that an email address passed OTP
 * verification. The random `token` is also hashed into the user record, so a
 * stolen cookie cannot be replayed after the reset completes. It is stored in
 * an httpOnly cookie and never exposed to JS.
 */
export async function createResetToken(
  email: string,
): Promise<{ cookie: string; token: string }> {
  const now = Math.floor(Date.now() / 1000);
  const token = randomBytes(32).toString("base64url");
  const payload: ResetPayload = {
    email: email.toLowerCase(),
    token,
    purpose: "password-reset",
    iat: now,
    exp: now + RESET_TTL_SECONDS,
  };

  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign("HMAC", await getKey(), encoder.encode(body));

  return {
    cookie: `${body}.${toBase64Url(new Uint8Array(signature))}`,
    token,
  };
}

export async function verifyResetToken(
  cookie: string,
): Promise<{ email: string; token: string } | null> {
  try {
    const [body, signature] = cookie.split(".");
    if (!body || !signature) return null;

    const valid = await crypto.subtle.verify(
      "HMAC",
      await getKey(),
      fromBase64Url(signature),
      encoder.encode(body),
    );
    if (!valid) return null;

    const parsed: unknown = JSON.parse(decoder.decode(fromBase64Url(body)));
    if (!isRecord(parsed)) return null;

    const now = Math.floor(Date.now() / 1000);
    const email = safeText(parsed.email, 254).toLowerCase();
    const token = safeText(parsed.token, 128);
    if (!email || !token) return null;
    if (parsed.purpose !== "password-reset") return null;
    if (typeof parsed.exp !== "number" || parsed.exp <= now) return null;

    return { email, token };
  } catch {
    return null;
  }
}
