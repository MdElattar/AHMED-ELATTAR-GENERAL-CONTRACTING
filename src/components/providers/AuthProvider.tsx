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

export type PortalUser = {
  name: string;
  email: string;
  company: string;
  accountId: string;
  phone?: string;
  role?: "client" | "admin";
};

type AuthContextValue = {
  user: PortalUser | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<PortalUser>;
  signUp: (input: {
    name: string;
    email: string;
    company: string;
    phone: string;
    password: string;
  }) => Promise<PortalUser>;
  signOut: () => void;
  updateProfile: (patch: Partial<Pick<PortalUser, "name" | "email" | "company" | "phone">>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "alattar-portal-user";

const DEMO_USER: PortalUser = {
  name: "Mohammed Alabdullah",
  email: "demo@alattar.sa",
  company: "Riyadh Development Holding",
  accountId: "ALT-2048",
  phone: "+966 55 214 8890",
  role: "admin",
};

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function titleFromEmail(email: string) {
  const handle = email.split("@")[0] ?? "Client";
  return handle
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PortalUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        // Hydration-safe: localStorage is only readable after mount.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(JSON.parse(stored) as PortalUser);
      }
    } catch {
      // Ignore malformed or unavailable storage.
    } finally {
      setReady(true);
    }
  }, []);

  const persist = useCallback((next: PortalUser | null) => {
    setUser(next);
    try {
      if (next) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore storage failures.
    }
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      await wait(850);
      const normalized = email.trim().toLowerCase();
      const demoEmail =
        normalized === DEMO_USER.email || normalized === "demo@ahmedelattar.sa";
      if (demoEmail && password === "demo1234") {
        persist(DEMO_USER);
        return DEMO_USER;
      }
      if (password.length < 8) {
        throw new Error("invalid");
      }
      const next: PortalUser = {
        name: titleFromEmail(normalized),
        email: normalized,
        company: "Ahmed Elattar Client",
        accountId: `ALT-${Math.floor(1000 + Math.random() * 8999)}`,
        role: "client",
      };
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
      await wait(1000);
      const next: PortalUser = {
        name: input.name,
        email: input.email.trim().toLowerCase(),
        company: input.company,
        accountId: `ALT-${Math.floor(1000 + Math.random() * 8999)}`,
        phone: input.phone,
        role: "client",
      };
      persist(next);
      return next;
    },
    [persist],
  );

  const signOut = useCallback(() => persist(null), [persist]);

  const updateProfile = useCallback(
    (patch: Partial<Pick<PortalUser, "name" | "email" | "company" | "phone">>) => {
      setUser((current) => {
        if (!current) return current;
        const next = { ...current, ...patch };
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Ignore storage failures.
        }
        return next;
      });
    },
    [],
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
