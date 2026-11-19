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

/** Idle admins get one 60-second warning, then a cross-tab sign-out. */
const WARNING_AFTER_MS = 10 * 60 * 1000;
const SIGN_OUT_AFTER_MS = 11 * 60 * 1000;
const COUNTDOWN_SECONDS = (SIGN_OUT_AFTER_MS - WARNING_AFTER_MS) / 1000;
const BROADCAST_THROTTLE_MS = 10_000;

type SessionSignal = {
  type?: "activity" | "warning" | "stay" | "logout";
  at?: number;
  until?: number;
  /** Identifies the idle cycle that produced a warning signal. */
  activityAt?: number;
};

function readStoredNumber(key: string) {
  try {
    const value = Number(window.localStorage.getItem(key));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

export default function IdleGuard() {
  const { user, sessionExpiresAt, signOut } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const signedIn = Boolean(user?.sessionVerified);
  // Managers can reach the admin shell for content work, but only accounts
  // with the admin role own an idle-protected privileged session.
  const adminIdle = signedIn && user?.role === "admin";

  const lastActivityRef = useRef(0);
  const warnedActivityRef = useRef<number | null>(null);
  const warningUntilRef = useRef<number | null>(null);
  const lastBroadcastRef = useRef(0);
  const signingOutRef = useRef(false);
  const stayButtonRef = useRef<HTMLButtonElement>(null);

  const [warning, setWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [expired, setExpired] = useState(false);

  const clearWarning = useCallback(() => {
    warningUntilRef.current = null;
    setWarning(false);
    setSecondsLeft(COUNTDOWN_SECONDS);
  }, []);

  const resetCycle = useCallback(
    (at = Date.now()) => {
      lastActivityRef.current = at;
      warnedActivityRef.current = null;
      clearWarning();
    },
    [clearWarning],
  );

  const noteActivity = useCallback(() => {
    if (!adminIdle || signingOutRef.current) return;
    const now = Date.now();
    resetCycle(now);
    if (now - lastBroadcastRef.current >= BROADCAST_THROTTLE_MS) {
      lastBroadcastRef.current = now;
      broadcastSessionEvent("activity");
    }
  }, [adminIdle, resetCycle]);

  const signOutNow = useCallback(async () => {
    if (signingOutRef.current) return;
    signingOutRef.current = true;
    // An explicit cross-tab logout still signs clients out, but only admins
    // are ever shown the idle timeout surface.
    if (adminIdle) setExpired(true);
    clearWarning();
    await signOut();
    const next = pathname.startsWith("/admin") ? "/admin" : "/portal";
    router.replace(`/sign-in?next=${encodeURIComponent(next)}`);
  }, [adminIdle, clearWarning, pathname, router, signOut]);

  const staySignedIn = useCallback(() => {
    if (!adminIdle || signingOutRef.current) return;
    const now = Date.now();
    resetCycle(now);
    lastBroadcastRef.current = now;
    broadcastSessionEvent("stay");
  }, [adminIdle, resetCycle]);

  useEffect(() => {
    if (!signedIn) return;
    signingOutRef.current = false;
    queueMicrotask(() => setExpired(false));

    if (adminIdle) {
      const storedActivity = readStoredNumber(SESSION_ACTIVITY_KEY);
      lastActivityRef.current = storedActivity ?? Date.now();
      if (!storedActivity) broadcastSessionEvent("activity");

      const storedWarning = readStoredNumber(SESSION_WARNING_KEY);
      if (storedWarning && storedWarning > Date.now()) {
        warningUntilRef.current = storedWarning;
        warnedActivityRef.current = lastActivityRef.current;
        queueMicrotask(() => setWarning(true));
      } else {
        warningUntilRef.current = null;
        warnedActivityRef.current = null;
      }
    }

    const handleSignal = (signal: SessionSignal) => {
      if (!signal || signingOutRef.current) return;
      const at = typeof signal.at === "number" ? signal.at : Date.now();

      if (signal.type === "logout") {
        void signOutNow();
        return;
      }
      if (!adminIdle) return;

      if (signal.type === "activity" || signal.type === "stay") {
        lastActivityRef.current = Math.max(lastActivityRef.current, at);
        warnedActivityRef.current = null;
        clearWarning();
        return;
      }

      if (signal.type === "warning") {
        const until =
          typeof signal.until === "number" ? signal.until : Date.now() + COUNTDOWN_SECONDS * 1000;
        const activityAt =
          typeof signal.activityAt === "number" ? signal.activityAt : lastActivityRef.current;
        lastActivityRef.current = Math.max(lastActivityRef.current, activityAt);
        // Align this tab with the tab that raised the warning so its own timer
        // cannot open a second dialog for the same idle cycle.
        warnedActivityRef.current = lastActivityRef.current;
        warningUntilRef.current = until;
        setWarning(true);
      }
    };

    const channel =
      typeof BroadcastChannel === "undefined"
        ? null
        : new BroadcastChannel(SESSION_CHANNEL);
    if (channel) {
      channel.onmessage = (event: MessageEvent<SessionSignal>) => handleSignal(event.data);
    }

    const handleStorage = (event: StorageEvent) => {
      if (!adminIdle) return;
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
    if (adminIdle) {
      events.forEach((event) => {
        window.addEventListener(event, noteActivity, { passive: true, capture: true });
      });
    }
    window.addEventListener("storage", handleStorage);

    const timer = window.setInterval(() => {
      if (!adminIdle || signingOutRef.current) return;
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

      if (
        warnedActivityRef.current !== lastActivityRef.current &&
        now - lastActivityRef.current >= WARNING_AFTER_MS
      ) {
        const cycle = lastActivityRef.current;
        warnedActivityRef.current = cycle;
        const warningUntil = Math.min(idleDeadline, deadline, now + COUNTDOWN_SECONDS * 1000);
        warningUntilRef.current = warningUntil;
        setWarning(true);
        broadcastSessionEvent("warning", { until: warningUntil, activityAt: cycle });
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
  }, [adminIdle, clearWarning, noteActivity, sessionExpiresAt, signOutNow, signedIn]);

  useEffect(() => {
    if (warning) stayButtonRef.current?.focus({ preventScroll: true });
  }, [warning]);

  if (!signedIn) return null;

  return (
    <>
      {expired && adminIdle ? (
        <div className="guard-backdrop">
          <div className="guard-modal" role="status" aria-live="assertive">
            <p className="guard-copy">{t.idle.expired}</p>
            <p className="guard-hint">{t.idle.signingOut}</p>
          </div>
        </div>
      ) : null}

      {warning && adminIdle && !expired ? (
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
