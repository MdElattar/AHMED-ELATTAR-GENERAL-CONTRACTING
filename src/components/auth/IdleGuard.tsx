"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Clock3, LogOut } from "lucide-react";

import {
  SESSION_ACTIVITY_KEY,
  SESSION_CHANNEL,
  SESSION_WARNING_KEY,
  broadcastSessionEvent,
  useAuth,
} from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";

const WARNING_AFTER_MS = 14 * 60 * 1000;
const SIGN_OUT_AFTER_MS = 15 * 60 * 1000;
const BROADCAST_THROTTLE_MS = 10_000;

type SessionSignal = {
  type?: "activity" | "warning" | "stay" | "logout";
  at?: number;
  until?: number;
};

function readStoredNumber(key: string) {
  try {
    const value = Number(window.localStorage.getItem(key));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

/** Warns 60 seconds before an idle timeout and signs out across all tabs. */
export default function IdleGuard() {
  const { user, sessionExpiresAt, signOut } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const active = Boolean(user?.sessionVerified);

  const lastActivityRef = useRef(0);
  const warningUntilRef = useRef<number | null>(null);
  const lastBroadcastRef = useRef(0);
  const signingOutRef = useRef(false);
  const stayButtonRef = useRef<HTMLButtonElement>(null);

  const [warning, setWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [expired, setExpired] = useState(false);

  const clearWarning = useCallback(() => {
    warningUntilRef.current = null;
    setWarning(false);
    setSecondsLeft(60);
  }, []);

  const noteActivity = useCallback(() => {
    if (!active || signingOutRef.current) return;
    const now = Date.now();
    lastActivityRef.current = now;
    clearWarning();
    if (now - lastBroadcastRef.current >= BROADCAST_THROTTLE_MS) {
      lastBroadcastRef.current = now;
      broadcastSessionEvent("activity");
    }
  }, [active, clearWarning]);

  const signOutNow = useCallback(async () => {
    if (signingOutRef.current) return;
    signingOutRef.current = true;
    setExpired(true);
    clearWarning();
    await signOut();
    const next = pathname.startsWith("/admin") ? "/admin" : "/portal";
    router.replace(`/sign-in?next=${encodeURIComponent(next)}`);
  }, [clearWarning, pathname, router, signOut]);

  const staySignedIn = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    lastBroadcastRef.current = now;
    clearWarning();
    broadcastSessionEvent("stay");
  }, [clearWarning]);

  useEffect(() => {
    if (!active) return;
    signingOutRef.current = false;
    queueMicrotask(() => setExpired(false));

    const storedActivity = readStoredNumber(SESSION_ACTIVITY_KEY);
    lastActivityRef.current = storedActivity ?? Date.now();
    if (!storedActivity) broadcastSessionEvent("activity");

    const storedWarning = readStoredNumber(SESSION_WARNING_KEY);
    if (storedWarning && storedWarning > Date.now()) {
      warningUntilRef.current = storedWarning;
      queueMicrotask(() => setWarning(true));
    }

    const handleSignal = (signal: SessionSignal) => {
      if (!signal || signingOutRef.current) return;
      const at = typeof signal.at === "number" ? signal.at : Date.now();
      if (signal.type === "activity") {
        lastActivityRef.current = Math.max(lastActivityRef.current, at);
        clearWarning();
      } else if (signal.type === "warning") {
        const until =
          typeof signal.until === "number" ? signal.until : Date.now() + 60_000;
        warningUntilRef.current = until;
        setWarning(true);
      } else if (signal.type === "stay") {
        lastActivityRef.current = Math.max(lastActivityRef.current, at);
        clearWarning();
      } else if (signal.type === "logout") {
        void signOutNow();
      }
    };

    const channel = typeof BroadcastChannel === "undefined"
      ? null
      : new BroadcastChannel(SESSION_CHANNEL);
    if (channel) {
      channel.onmessage = (event: MessageEvent<SessionSignal>) => handleSignal(event.data);
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === SESSION_ACTIVITY_KEY) {
        const value = readStoredNumber(SESSION_ACTIVITY_KEY);
        if (value) handleSignal({ type: "activity", at: value });
      } else if (event.key === SESSION_WARNING_KEY) {
        const value = readStoredNumber(SESSION_WARNING_KEY);
        if (value && value > Date.now()) {
          handleSignal({ type: "warning", until: value });
        } else {
          clearWarning();
        }
      }
    };

    // Keyboard activity is covered by `keydown`; listening for `focus` would
    // treat the warning dialog's own programmatic focus as user activity.
    const events: (keyof WindowEventMap)[] = [
      "pointerdown",
      "keydown",
      "wheel",
      "touchstart",
    ];
    events.forEach((event) => {
      window.addEventListener(event, noteActivity, { passive: true, capture: true });
    });
    window.addEventListener("storage", handleStorage);

    const timer = window.setInterval(() => {
      if (!active || signingOutRef.current) return;
      const now = Date.now();
      const idleDeadline = lastActivityRef.current + SIGN_OUT_AFTER_MS;
      const deadline = sessionExpiresAt
        ? Math.min(idleDeadline, sessionExpiresAt)
        : idleDeadline;

      if (now >= deadline) {
        void signOutNow();
        return;
      }

      const until = warningUntilRef.current;
      if (until && now >= until) {
        void signOutNow();
        return;
      }

      if (!until && now - lastActivityRef.current >= WARNING_AFTER_MS) {
        const warningUntil = Math.min(idleDeadline, deadline);
        warningUntilRef.current = warningUntil;
        setWarning(true);
        broadcastSessionEvent("warning", { until: warningUntil });
      }

      if (warningUntilRef.current) {
        setSecondsLeft(
          Math.max(0, Math.ceil((warningUntilRef.current - Date.now()) / 1000)),
        );
      }
    }, 1000);

    return () => {
      window.clearInterval(timer);
      events.forEach((event) => {
        window.removeEventListener(event, noteActivity, { capture: true });
      });
      window.removeEventListener("storage", handleStorage);
      channel?.close();
    };
  }, [active, clearWarning, noteActivity, sessionExpiresAt, signOutNow]);

  useEffect(() => {
    if (warning) stayButtonRef.current?.focus({ preventScroll: true });
  }, [warning]);

  if (!active) return null;

  return (
    <>
      {expired ? (
        <div className="guard-backdrop">
          <div className="guard-modal" role="status" aria-live="assertive">
            <p className="guard-copy">{t.idle.expired}</p>
            <p className="guard-hint">{t.idle.signingOut}</p>
          </div>
        </div>
      ) : null}

      {warning && !expired ? (
        <div className="guard-backdrop">
          <section
            className="guard-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="idle-warning-title"
            aria-describedby="idle-warning-text"
            data-testid="idle-warning"
          >
            <div className="guard-heading">
              <span className="guard-icon" aria-hidden="true">
                <Clock3 className="h-5 w-5" />
              </span>
              <div>
                <h2 className="guard-title" id="idle-warning-title">
                  {t.idle.warningTitle}
                </h2>
                <p className="guard-copy" id="idle-warning-text">
                  {t.idle.warningText}
                </p>
              </div>
            </div>
            <p
              className="guard-countdown"
              role="timer"
              aria-label={t.idle.secondsLeft}
              data-testid="idle-countdown"
            >
              {secondsLeft}
            </p>
            <div className="guard-actions">
              <button
                ref={stayButtonRef}
                type="button"
                className="guard-button-primary"
                onClick={staySignedIn}
                data-testid="idle-stay-signed-in"
              >
                {t.idle.staySignedIn}
              </button>
              <button
                type="button"
                className="guard-button-quiet"
                onClick={() => void signOutNow()}
                data-testid="idle-sign-out"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                {t.nav.signOut}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
