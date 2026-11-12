"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import { isEmail } from "@/lib/security/validation";

export type PortalUser = {
  name: string;
  email: string;
  company: string;
  accountId: string;
  phone?: string;
  role: "client" | "admin";
  primaryAdmin: boolean;
  sessionVerified: boolean;
};

export type PortalPasskey = {
  credentialId: string;
  createdAt: string;
  lastUsedAt?: string;
  deviceType?: string;
};

type ProfilePatch = Partial<Pick<PortalUser, "name" | "company" | "phone">>;

type AuthContextValue = {
  user: PortalUser | null;
  ready: boolean;
  signIn: (email: string, password: string, remember?: boolean) => Promise<PortalUser>;
  signInWithPasskey: (email?: string, remember?: boolean) => Promise<PortalUser>;
  signUp: (input: {
    name: string;
    email: string;
    company: string;
    phone: string;
    password: string;
  }) => Promise<PortalUser>;
  signOut: () => Promise<void>;
  updateProfile: (patch: ProfilePatch) => Promise<void>;
  registerPasskey: () => Promise<PortalPasskey>;
  listPasskeys: () => Promise<PortalPasskey[]>;
  removePasskey: (credentialId: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "alattar-portal-user";

export type AuthRequestErrorCode = "invalid" | "rate_limited" | "unavailable";

/**
 * Typed auth failure so the UI can distinguish bad credentials from a
 * deployment that cannot sign sessions (missing AUTH_SECRET) or a rate limit.
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
  return new AuthRequestError("invalid");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseUser(value: unknown, verified: boolean): PortalUser | null {
  if (!isRecord(value)) return null;

  const name = typeof value.name === "string" ? value.name.trim().slice(0, 120) : "";
  const email =
    typeof value.email === "string" ? value.email.trim().toLowerCase().slice(0, 254) : "";
  const company =
    typeof value.company === "string" ? value.company.trim().slice(0, 160) : "";
  const accountId =
    typeof value.accountId === "string" ? value.accountId.trim().slice(0, 32) : "";
  const phone = typeof value.phone === "string" ? value.phone.trim().slice(0, 40) : "";

  if (!name || !isEmail(email) || !company || !accountId) return null;

  return {
    name,
    email,
    company,
    accountId,
    ...(phone ? { phone } : {}),
    // A cached object is never allowed to grant admin. Only a signed,
    // server-verified session can set this to true.
    role: verified && value.role === "admin" ? "admin" : "client",
    primaryAdmin: verified && value.primaryAdmin === true,
    sessionVerified: verified,
  };
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

async function responseJson(response: Response) {
  try {
    const value: unknown = await response.json();
    return isRecord(value) ? value : null;
  } catch {
    return null;
  }
}

function parsePasskey(value: unknown): PortalPasskey | null {
  if (!isRecord(value)) return null;
  const credentialId =
    typeof value.credentialId === "string" ? value.credentialId.slice(0, 2048) : "";
  const createdAt = typeof value.createdAt === "string" ? value.createdAt : "";
  if (!credentialId || !createdAt) return null;

  return {
    credentialId,
    createdAt,
    ...(typeof value.lastUsedAt === "string" ? { lastUsedAt: value.lastUsedAt } : {}),
    ...(typeof value.deviceType === "string" ? { deviceType: value.deviceType } : {}),
  };
}

export function isAdminUser(user: PortalUser | null) {
  return Boolean(user?.role === "admin" && user.sessionVerified);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PortalUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const cached = readCachedUser();

    if (cached) {
      // Hydration-safe: localStorage is only read after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(cached);
    }

    const loadSession = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
          credentials: "same-origin",
        });
        const data = await responseJson(response);

        if (cancelled) return;

        const verified = parseUser(data?.user, true);
        if (verified) {
          setUser(verified);
          writeCachedUser(verified);
        } else {
          setUser(null);
          writeCachedUser(null);
        }
      } catch {
        // Keep a cached display-only user when the network is unavailable.
        // The proxy still protects /portal and /admin on the server.
      } finally {
        if (!cancelled) setReady(true);
      }
    };

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
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  const persist = useCallback((next: PortalUser | null) => {
    setUser(next);
    writeCachedUser(next);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string, remember = true) => {
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember }),
      });
      const data = await responseJson(response);
      const next = parseUser(data?.user, true);

      if (!response.ok || !next) throw authErrorFrom(response);

      persist(next);
      return next;
    },
    [persist],
  );

  const signInWithPasskey = useCallback(
    async (email?: string, remember = true) => {
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

      const assertion = await startAuthentication({
        optionsJSON: optionsData.options as unknown as Parameters<
          typeof startAuthentication
        >[0]["optionsJSON"],
      });

      const response = await fetch("/api/auth/passkey/authenticate/verify", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: assertion, remember }),
      });
      const data = await responseJson(response);
      const next = parseUser(data?.user, true);

      if (!response.ok || !next) throw authErrorFrom(response);

      persist(next);
      return next;
    },
    [persist],
  );

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
      const next = parseUser(data?.user, true);

      if (!response.ok || !next) throw authErrorFrom(response);

      persist(next);
      return next;
    },
    [persist],
  );

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "same-origin",
      });
    } catch {
      // Local state is cleared even if the network request fails.
    } finally {
      persist(null);
    }
  }, [persist]);

  const updateProfile = useCallback(
    async (patch: ProfilePatch) => {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await responseJson(response);
      const next = parseUser(data?.user, true);

      if (!response.ok || !next) throw authErrorFrom(response);

      persist(next);
    },
    [persist],
  );

  const registerPasskey = useCallback(async () => {
    const optionsResponse = await fetch("/api/auth/passkey/register/options", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const optionsData = await responseJson(optionsResponse);
    if (!optionsResponse.ok || !isRecord(optionsData?.options)) {
      throw authErrorFrom(optionsResponse);
    }

    const registration = await startRegistration({
      optionsJSON: optionsData.options as unknown as Parameters<
        typeof startRegistration
      >[0]["optionsJSON"],
    });

    const response = await fetch("/api/auth/passkey/register/verify", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response: registration }),
    });
    const data = await responseJson(response);
    const next = parsePasskey(data?.passkey);

    if (!response.ok || !next) throw authErrorFrom(response);
    return next;
  }, []);

  const listPasskeys = useCallback(async () => {
    const response = await fetch("/api/auth/passkey", {
      cache: "no-store",
      credentials: "same-origin",
    });
    const data = await responseJson(response);
    const list = Array.isArray(data?.passkeys) ? data.passkeys : [];
    if (!response.ok) throw authErrorFrom(response);

    return list
      .map((item) => parsePasskey(item))
      .filter((item): item is PortalPasskey => item !== null);
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

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      signIn,
      signInWithPasskey,
      signUp,
      signOut,
      updateProfile,
      registerPasskey,
      listPasskeys,
      removePasskey,
    }),
    [
      user,
      ready,
      signIn,
      signInWithPasskey,
      signUp,
      signOut,
      updateProfile,
      registerPasskey,
      listPasskeys,
      removePasskey,
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
