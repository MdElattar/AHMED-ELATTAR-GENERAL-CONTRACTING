"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import { isEmail, isSafeInternalPath } from "@/lib/security/validation";

export type PortalRole = "client" | "manager" | "admin";

export type PortalUser = {
  name: string;
  nameAr?: string;
  honorific?: string;
  honorificAr?: string;
  email: string;
  company: string;
  accountId: string;
  phone?: string;
  role: PortalRole;
  primaryAdmin: boolean;
  passkeyEnrolled: boolean;
  sessionVerified: boolean;
};

export type PortalPasskey = {
  credentialId: string;
  createdAt: string;
  deviceName?: string;
  deviceType?: string;
  backedUp?: boolean;
  lastUsedAt?: string;
};

export type AuthResult = {
  user: PortalUser;
  redirectTo: string;
};

export type PasskeyRegistrationResult = {
  passkey: PortalPasskey;
  backupCodes?: string[];
  redirectTo: string;
};

export type PasskeyListResult = {
  passkeys: PortalPasskey[];
  hasBackupCodes: boolean;
};

type ProfilePatch = Partial<
  Pick<PortalUser, "name" | "nameAr" | "honorific" | "honorificAr" | "company" | "phone">
>;

type AuthContextValue = {
  user: PortalUser | null;
  ready: boolean;
  stepUpAt: number | null;
  /** Absolute session expiry (epoch ms) when exposed by the server. */
  sessionExpiresAt: number | null;
  webAuthnSupported: boolean;
  webAuthnChecked: boolean;
  conditionalMediationAvailable: boolean;
  signIn: (email: string, password: string, remember?: boolean, next?: string) => Promise<AuthResult>;
  signInWithPasskey: (
    email?: string,
    remember?: boolean,
    next?: string,
    conditional?: boolean,
  ) => Promise<AuthResult>;
  stepUp: () => Promise<boolean>;
  signUp: (input: {
    name: string;
    email: string;
    company: string;
    phone: string;
    password: string;
  }) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  updateProfile: (patch: ProfilePatch) => Promise<void>;
  registerPasskey: (deviceName: string, next?: string) => Promise<PasskeyRegistrationResult>;
  listPasskeys: () => Promise<PasskeyListResult>;
  renamePasskey: (credentialId: string, deviceName: string) => Promise<void>;
  removePasskey: (credentialId: string) => Promise<void>;
  regenerateBackupCodes: () => Promise<string[]>;
  redeemBackupCode: (email: string, code: string) => Promise<AuthResult>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "alattar-portal-user";
const EXPIRY_KEY = "alattar-session-expires-at";
const ACTIVITY_KEY = "alattar-session-activity";
const WARNING_KEY = "alattar-session-warning";

/** BroadcastChannel name shared by every tab of the portal. */
export const SESSION_CHANNEL = "alattar-session-channel";
/** Storage keys mirrored when BroadcastChannel is unavailable. */
export const SESSION_ACTIVITY_KEY = ACTIVITY_KEY;
export const SESSION_WARNING_KEY = WARNING_KEY;
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export type AuthRequestErrorCode =
  | "invalid"
  | "rate_limited"
  | "unavailable"
  | "step_up_required"
  | "backup_codes_required"
  | "cancelled";

/**
 * Typed auth failure so the UI can distinguish bad credentials from a
 * deployment that cannot sign sessions, a rate limit, or a step-up prompt.
 */
export class AuthRequestError extends Error {
  readonly code: AuthRequestErrorCode;

  constructor(code: AuthRequestErrorCode) {
    super(code);
    this.name = "AuthRequestError";
    this.code = code;
  }
}

function authErrorFrom(response: Response) {
  if (response.status === 503) return new AuthRequestError("unavailable");
  if (response.status === 429) return new AuthRequestError("rate_limited");
  if (response.status === 409) return new AuthRequestError("backup_codes_required");
  if (response.status === 401 || response.status === 428) {
    return new AuthRequestError("step_up_required");
  }
  return new AuthRequestError("invalid");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseUser(value: unknown, verified: boolean): PortalUser | null {
  if (!isRecord(value)) return null;

  const name = typeof value.name === "string" ? value.name.trim().slice(0, 120) : "";
  const nameAr =
    typeof value.nameAr === "string" ? value.nameAr.trim().slice(0, 120) : "";
  const honorific =
    typeof value.honorific === "string" ? value.honorific.trim().slice(0, 30) : "";
  const honorificAr =
    typeof value.honorificAr === "string" ? value.honorificAr.trim().slice(0, 30) : "";
  const email =
    typeof value.email === "string" ? value.email.trim().toLowerCase().slice(0, 254) : "";
  const company =
    typeof value.company === "string" ? value.company.trim().slice(0, 160) : "";
  const accountId =
    typeof value.accountId === "string" ? value.accountId.trim().slice(0, 32) : "";
  const phone = typeof value.phone === "string" ? value.phone.trim().slice(0, 40) : "";

  if (!name || !isEmail(email) || !company || !accountId) return null;

  // A cached object is never allowed to grant elevated access. Only a signed,
  // server-verified session can set the role or enrollment flag.
  const role: PortalRole =
    verified && (value.role === "admin" || value.role === "manager") ? value.role : "client";

  return {
    name,
    ...(nameAr ? { nameAr } : {}),
    ...(honorific ? { honorific } : {}),
    ...(honorificAr ? { honorificAr } : {}),
    email,
    company,
    accountId,
    ...(phone ? { phone } : {}),
    role,
    primaryAdmin: verified && value.primaryAdmin === true,
    passkeyEnrolled: verified && value.passkeyEnrolled === true,
    sessionVerified: verified,
  };
}

function parsePasskey(value: unknown): PortalPasskey | null {
  if (!isRecord(value)) return null;
  const credentialId =
    typeof value.credentialId === "string" ? value.credentialId.slice(0, 2048) : "";
  if (!credentialId) return null;

  return {
    credentialId,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : "",
    ...(typeof value.deviceName === "string" && value.deviceName.trim()
      ? { deviceName: value.deviceName.trim().slice(0, 120) }
      : {}),
    ...(typeof value.deviceType === "string" ? { deviceType: value.deviceType } : {}),
    ...(typeof value.backedUp === "boolean" ? { backedUp: value.backedUp } : {}),
    ...(typeof value.lastUsedAt === "string" ? { lastUsedAt: value.lastUsedAt } : {}),
  };
}

function parseBackupCodes(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const codes = value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim().slice(0, 64));
  return codes.length ? codes : undefined;
}

function sessionExpiryFrom(data: Record<string, unknown> | null, fallback: number) {
  if (data) {
    for (const key of ["expiresAt", "tokenExpiresAt", "sessionExpiresAt"]) {
      const raw = data[key];
      if (typeof raw === "number" && Number.isFinite(raw)) {
        return raw > 0 && raw < 1e12 ? raw * 1000 : raw;
      }
      if (typeof raw === "string") {
        const parsed = Date.parse(raw);
        if (Number.isFinite(parsed)) return parsed;
      }
    }
    const expiresIn = data.expiresIn;
    if (typeof expiresIn === "number" && Number.isFinite(expiresIn) && expiresIn > 0) {
      return Date.now() + expiresIn * 1000;
    }
  }
  return fallback;
}

function readCachedUser() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return parseUser(JSON.parse(raw), false);
  } catch {
    return null;
  }
}

function writeCachedUser(user: PortalUser | null) {
  try {
    if (user) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore storage failures.
  }
}

function readCachedExpiry() {
  try {
    const raw = window.localStorage.getItem(EXPIRY_KEY);
    if (!raw) return null;
    const value = Number(raw);
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

function writeCachedExpiry(expiry: number | null) {
  try {
    if (expiry && Number.isFinite(expiry)) {
      window.localStorage.setItem(EXPIRY_KEY, String(expiry));
    } else {
      window.localStorage.removeItem(EXPIRY_KEY);
    }
  } catch {
    // Ignore storage failures.
  }
}

async function responseJson(response: Response) {
  try {
    const value: unknown = await response.json();
    return isRecord(value) ? value : null;
  } catch {
    return null;
  }
}

/** Removes every client-side cache owned by this application. */
export function clearClientAuthCaches() {
  if (typeof window === "undefined") return;
  try {
    const prefixes = ["alattar-", "ahmed-elattar-"];
    const keys: string[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key && prefixes.some((prefix) => key.startsWith(prefix))) keys.push(key);
    }
    keys.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Storage may be unavailable in private mode.
  }
  try {
    window.sessionStorage.clear();
  } catch {
    // Ignore storage failures.
  }
}

export type SessionEventType = "activity" | "warning" | "stay" | "logout";

/** Broadcasts a session signal to every other tab and mirrors it via storage. */
export function broadcastSessionEvent(type: SessionEventType, detail?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const payload = { type, at: Date.now(), ...detail };
  try {
    const channel = new BroadcastChannel(SESSION_CHANNEL);
    channel.postMessage(payload);
    channel.close();
  } catch {
    // BroadcastChannel is not available in every browser.
  }
  try {
    if (type === "activity") {
      window.localStorage.setItem(ACTIVITY_KEY, String(payload.at));
    } else if (type === "warning") {
      window.localStorage.setItem(WARNING_KEY, String(detail?.until ?? payload.at));
    } else if (type === "stay") {
      window.localStorage.setItem(ACTIVITY_KEY, String(payload.at));
      window.localStorage.removeItem(WARNING_KEY);
    } else {
      window.localStorage.removeItem(ACTIVITY_KEY);
      window.localStorage.removeItem(WARNING_KEY);
    }
  } catch {
    // Ignore storage failures.
  }
}

export function isPrivilegedRole(role: PortalRole | undefined) {
  return role === "admin" || role === "manager";
}

/** Backwards-compatible helper used across the portal chrome. */
export function isAdminUser(user: PortalUser | null | undefined) {
  return Boolean(user?.sessionVerified && isPrivilegedRole(user.role));
}

export function defaultPathForRole(role: PortalRole | undefined) {
  return isPrivilegedRole(role) ? "/admin" : "/portal";
}

function roleCanAccess(pathname: string, role: PortalRole | undefined) {
  // The server sends privileged users without a passkey here after sign-in.
  // Allowing the route here keeps the enrollment gate reachable.
  if (pathname === "/passkey-enroll") return true;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return isPrivilegedRole(role);
  if (pathname === "/portal" || pathname.startsWith("/portal/")) return true;
  return false;
}

/**
 * Only same-origin, relative, role-authorized destinations are accepted.
 * Server-provided `redirectTo` values are still validated here so an open
 * redirect cannot survive even if the API is compromised.
 */
export function resolveRedirectTarget(value: unknown, user: PortalUser | null) {
  const fallback = defaultPathForRole(user?.role);
  if (typeof value !== "string" || !isSafeInternalPath(value)) return fallback;
  if (typeof window === "undefined") return fallback;
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return fallback;
    if (!roleCanAccess(url.pathname, user?.role)) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

/** Locally rejects protocol-relative and cross-origin `next` values. */
export function safeNextParam(value: unknown) {
  if (typeof value !== "string" || !isSafeInternalPath(value)) return undefined;
  if (typeof window === "undefined") return value;
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return undefined;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return undefined;
  }
}

function assertionCancelled(error: unknown) {
  return error instanceof Error && /abort|cancel|not allowed|denied/i.test(error.message);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PortalUser | null>(null);
  const [ready, setReady] = useState(false);
  const [stepUpAt, setStepUpAt] = useState<number | null>(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  const [webAuthnSupported, setWebAuthnSupported] = useState(false);
  const [webAuthnChecked, setWebAuthnChecked] = useState(false);
  const [conditionalMediationAvailable, setConditionalMediationAvailable] = useState(false);
  const sessionGeneration = useRef(0);

  /**
   * A local sign-in invalidates any in-flight `/api/auth/session` response.
   * The generation check below prevents a late response from replacing the
   * freshly authenticated user (the old "stuck on sign-in" race).
   */
  const invalidateSessionLoad = useCallback(() => {
    sessionGeneration.current += 1;
    setReady(true);
  }, []);

  const loadSession = useCallback(async () => {
    const generation = sessionGeneration.current;
    try {
      const response = await fetch("/api/auth/session", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const data = await responseJson(response);
      if (sessionGeneration.current !== generation) return null;

      const verified = parseUser(data?.user, true);
      if (verified) {
        setUser(verified);
        writeCachedUser(verified);
        const expiry = sessionExpiryFrom(data, Date.now() + SESSION_TTL_MS);
        setSessionExpiresAt(expiry);
        writeCachedExpiry(expiry);
        return verified;
      }

      setUser(null);
      writeCachedUser(null);
      setSessionExpiresAt(null);
      writeCachedExpiry(null);
      return null;
    } catch {
      // Keep a cached display-only user when the network is unavailable.
      // The proxy still protects /portal and /admin on the server.
      return null;
    } finally {
      if (sessionGeneration.current === generation) setReady(true);
    }
  }, []);

  useEffect(() => {
    const cached = readCachedUser();
    const cachedExpiry = readCachedExpiry();

    if (cached) {
      // Hydration-safe: localStorage is only read after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(cached);
    }
    if (cachedExpiry) {
      setSessionExpiresAt(cachedExpiry);
    }

    void loadSession();

    // Reconcile with the server when the tab regains focus and periodically
    // while open. This makes role revocation visible without waiting for the
    // next navigation or API request.
    const refresh = () => {
      if (document.visibilityState === "visible") void loadSession();
    };
    const timer = window.setInterval(refresh, 60_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [loadSession]);

  useEffect(() => {
    let active = true;
    const publicKey = typeof window === "undefined" ? undefined : window.PublicKeyCredential;
    if (publicKey) {
      queueMicrotask(() => setWebAuthnSupported(true));
      if (typeof publicKey.isConditionalMediationAvailable === "function") {
        void publicKey
          .isConditionalMediationAvailable()
          .then((available) => {
            if (active) setConditionalMediationAvailable(available);
          })
          .catch(() => {
            if (active) setConditionalMediationAvailable(false);
          });
      }
    }
    queueMicrotask(() => setWebAuthnChecked(true));
    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback(
    (next: PortalUser | null, expiry?: number | null) => {
      invalidateSessionLoad();
      setUser(next);
      writeCachedUser(next);
      if (expiry !== undefined) {
        setSessionExpiresAt(expiry);
        writeCachedExpiry(expiry);
      }
      if (!next) {
        setStepUpAt(null);
      }
    },
    [invalidateSessionLoad],
  );

  const signIn = useCallback(
    async (email: string, password: string, remember = true, next?: string) => {
      const nextParam = safeNextParam(next);
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          remember,
          ...(nextParam ? { next: nextParam } : {}),
        }),
      });
      const data = await responseJson(response);
      const signedIn = parseUser(data?.user, true);

      if (!response.ok || !signedIn) throw authErrorFrom(response);

      persist(signedIn, sessionExpiryFrom(data, Date.now() + SESSION_TTL_MS));
      return { user: signedIn, redirectTo: resolveRedirectTarget(data?.redirectTo, signedIn) };
    },
    [persist],
  );

  const signInWithPasskey = useCallback(
    async (email?: string, remember = true, next?: string, conditional = false) => {
      const optionsResponse = await fetch("/api/auth/passkey/authenticate/options", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email?.trim() || undefined }),
      });
      const optionsData = await responseJson(optionsResponse);
      if (!optionsResponse.ok || !isRecord(optionsData?.options)) {
        throw authErrorFrom(optionsResponse);
      }

      let assertion;
      try {
        assertion = await startAuthentication({
          optionsJSON: optionsData.options as unknown as Parameters<typeof startAuthentication>[0]["optionsJSON"],
          useBrowserAutofill: conditional,
          verifyBrowserAutofillInput: conditional,
        });
      } catch (error) {
        throw assertionCancelled(error) ? new AuthRequestError("cancelled") : error;
      }

      const nextParam = safeNextParam(next);
      const response = await fetch("/api/auth/passkey/authenticate/verify", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response: assertion,
          remember,
          ...(nextParam ? { next: nextParam } : {}),
        }),
      });
      const data = await responseJson(response);
      const signedIn = parseUser(data?.user, true);

      if (!response.ok || !signedIn) throw authErrorFrom(response);

      persist(signedIn, sessionExpiryFrom(data, Date.now() + SESSION_TTL_MS));
      return { user: signedIn, redirectTo: resolveRedirectTarget(data?.redirectTo, signedIn) };
    },
    [persist],
  );

  const stepUp = useCallback(async () => {
    const optionsResponse = await fetch("/api/auth/passkey/authenticate/options", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purpose: "step-up" }),
    });
    const optionsData = await responseJson(optionsResponse);
    if (!optionsResponse.ok || !isRecord(optionsData?.options)) {
      throw authErrorFrom(optionsResponse);
    }

    let assertion;
    try {
      assertion = await startAuthentication({
        optionsJSON: optionsData.options as unknown as Parameters<typeof startAuthentication>[0]["optionsJSON"],
      });
    } catch (error) {
      throw assertionCancelled(error) ? new AuthRequestError("cancelled") : error;
    }

    const response = await fetch("/api/auth/passkey/authenticate/verify", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response: assertion, purpose: "step-up" }),
    });
    const data = await responseJson(response);
    if (!response.ok) throw authErrorFrom(response);

    const rawStepUpAt = typeof data?.stepUpAt === "number" ? data.stepUpAt : Date.now() / 1000;
    setStepUpAt(rawStepUpAt > 0 && rawStepUpAt < 1e12 ? rawStepUpAt * 1000 : rawStepUpAt);
    await loadSession();
    return true;
  }, [loadSession]);

  const signUp = useCallback(
    async (input: {
      name: string;
      email: string;
      company: string;
      phone: string;
      password: string;
    }) => {
      const response = await fetch("/api/auth/sign-up", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await responseJson(response);
      const created = parseUser(data?.user, true);

      if (!response.ok || !created) throw authErrorFrom(response);

      // New accounts are always clients, so the portal is the default home.
      persist(created, sessionExpiryFrom(data, Date.now() + SESSION_TTL_MS));
      return { user: created, redirectTo: resolveRedirectTarget(data?.redirectTo ?? "/portal", created) };
    },
    [persist],
  );

  const signOut = useCallback(async () => {
    // Clear caches and notify other tabs before leaving the page.
    broadcastSessionEvent("logout");
    clearClientAuthCaches();
    invalidateSessionLoad();
    setUser(null);
    setStepUpAt(null);
    setSessionExpiresAt(null);
    try {
      await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "same-origin",
      });
    } catch {
      // Local state is cleared even if the network request fails.
    }
  }, [invalidateSessionLoad]);

  const updateProfile = useCallback(
    async (patch: ProfilePatch) => {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await responseJson(response);
      const updated = parseUser(data?.user, true);

      if (!response.ok || !updated) throw authErrorFrom(response);

      persist(updated);
    },
    [persist],
  );

  const registerPasskey = useCallback(
    async (deviceName: string, next?: string) => {
      const optionsResponse = await fetch("/api/auth/passkey/register/options", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceName }),
      });
      const optionsData = await responseJson(optionsResponse);
      if (!optionsResponse.ok || !isRecord(optionsData?.options)) {
        throw authErrorFrom(optionsResponse);
      }

      let registration;
      try {
        registration = await startRegistration({
          optionsJSON: optionsData.options as unknown as Parameters<typeof startRegistration>[0]["optionsJSON"],
        });
      } catch (error) {
        throw assertionCancelled(error) ? new AuthRequestError("cancelled") : error;
      }

      const response = await fetch("/api/auth/passkey/register/verify", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response: registration,
          deviceName,
          ...(safeNextParam(next) ? { next: safeNextParam(next) } : {}),
        }),
      });
      const data = await responseJson(response);
      const passkey = parsePasskey(data?.passkey);

      if (!response.ok || !passkey) throw authErrorFrom(response);

      const updated = parseUser(data?.user, true);
      if (updated) persist(updated, sessionExpiryFrom(data, Date.now() + SESSION_TTL_MS));

      if (typeof data?.stepUpAt === "number") {
        const raw = data.stepUpAt;
        setStepUpAt(raw > 0 && raw < 1e12 ? raw * 1000 : raw);
      }

      const backupCodes = parseBackupCodes(data?.backupCodes);
      return {
        passkey,
        ...(backupCodes ? { backupCodes } : {}),
        redirectTo: resolveRedirectTarget(data?.redirectTo, updated ?? user),
      };
    },
    [persist, user],
  );

  const listPasskeys = useCallback(async (): Promise<PasskeyListResult> => {
    const response = await fetch("/api/auth/passkey", {
      cache: "no-store",
      credentials: "same-origin",
    });
    const data = await responseJson(response);
    if (!response.ok) throw authErrorFrom(response);

    const list = Array.isArray(data?.passkeys) ? data.passkeys : [];
    return {
      passkeys: list
        .map((item) => parsePasskey(item))
        .filter((item): item is PortalPasskey => item !== null),
      hasBackupCodes: data?.hasBackupCodes === true,
    };
  }, []);

  const renamePasskey = useCallback(async (credentialId: string, deviceName: string) => {
    const response = await fetch("/api/auth/passkey", {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credentialId, deviceName }),
    });
    if (!response.ok) throw authErrorFrom(response);
  }, []);

  const removePasskey = useCallback(async (credentialId: string) => {
    const response = await fetch("/api/auth/passkey", {
      method: "DELETE",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credentialId }),
    });
    if (!response.ok) throw authErrorFrom(response);
  }, []);

  const regenerateBackupCodes = useCallback(async () => {
    const response = await fetch("/api/auth/backup-codes", {
      method: "POST",
      credentials: "same-origin",
    });
    const data = await responseJson(response);
    if (!response.ok) throw authErrorFrom(response);

    const codes = parseBackupCodes(data?.backupCodes);
    if (!codes) throw new AuthRequestError("invalid");
    return codes;
  }, []);

  const redeemBackupCode = useCallback(
    async (email: string, code: string) => {
      const response = await fetch("/api/auth/backup-codes/redeem", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: code.trim().toUpperCase() }),
      });
      const data = await responseJson(response);
      const redeemed = parseUser(data?.user, true);
      if (!response.ok || !redeemed) throw authErrorFrom(response);

      persist(redeemed, sessionExpiryFrom(data, Date.now() + SESSION_TTL_MS));
      return { user: redeemed, redirectTo: resolveRedirectTarget(data?.redirectTo, redeemed) };
    },
    [persist],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      stepUpAt,
      webAuthnSupported,
      webAuthnChecked,
      conditionalMediationAvailable,
      signIn,
      signInWithPasskey,
      stepUp,
      signUp,
      signOut,
      updateProfile,
      registerPasskey,
      listPasskeys,
      renamePasskey,
      removePasskey,
      regenerateBackupCodes,
      redeemBackupCode,
      sessionExpiresAt,
    }),
    [
      user,
      ready,
      stepUpAt,
      webAuthnSupported,
      webAuthnChecked,
      conditionalMediationAvailable,
      signIn,
      signInWithPasskey,
      stepUp,
      signUp,
      signOut,
      updateProfile,
      registerPasskey,
      listPasskeys,
      renamePasskey,
      removePasskey,
      regenerateBackupCodes,
      redeemBackupCode,
      sessionExpiresAt,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
