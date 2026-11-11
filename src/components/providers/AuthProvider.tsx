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
import { isEmail } from "@/lib/security/validation";

export type PortalUser = {
  name: string;
  email: string;
  company: string;
  accountId: string;
  phone?: string;
  role: "client" | "admin";
  sessionVerified: boolean;
};

type ProfilePatch = Partial<Pick<PortalUser, "name" | "company" | "phone">>;

type AuthContextValue = {
  user: PortalUser | null;
  ready: boolean;
  signIn: (email: string, password: string, remember?: boolean) => Promise<PortalUser>;
  signUp: (input: {
    name: string;
    email: string;
    company: string;
    phone: string;
    password: string;
  }) => Promise<PortalUser>;
  signOut: () => Promise<void>;
  updateProfile: (patch: ProfilePatch) => Promise<void>;
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

    return () => {
      cancelled = true;
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

  const value = useMemo<AuthContextValue>(
    () => ({ user, ready, signIn, signUp, signOut, updateProfile }),
    [user, ready, signIn, signUp, signOut, updateProfile],
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
