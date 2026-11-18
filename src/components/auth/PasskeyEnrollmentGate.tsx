"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Fingerprint, KeyRound, ShieldCheck } from "lucide-react";

import {
  AuthRequestError,
  isPrivilegedRole,
  resolveRedirectTarget,
  safeNextParam,
  useAuth,
} from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { Field, TextInput } from "@/components/ui/Field";
import { BackupCodesPanel } from "./BackupCodesPanel";

const REMINDER_KEY = "alattar-passkey-reminder-count";
const MAX_REMINDERS = 3;

type EnrollmentFormProps = {
  variant?: "page" | "modal";
  onDismiss?: () => void;
  onEnrolled?: () => void;
  onContinue?: () => void;
};

/** Shared enrollment UI used by the dedicated route and the global gate. */
export function PasskeyEnrollmentForm({
  variant = "page",
  onDismiss,
  onEnrolled,
  onContinue,
}: EnrollmentFormProps) {
  const {
    user,
    registerPasskey,
    signOut,
    webAuthnSupported,
    webAuthnChecked,
  } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = useMemo(() => safeNextParam(searchParams?.get("next")), [searchParams]);

  const [deviceName, setDeviceName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [codes, setCodes] = useState<string[] | undefined>();
  const [redirectTo, setRedirectTo] = useState<string | undefined>();
  const [remindersUsed, setRemindersUsed] = useState(MAX_REMINDERS);

  const privileged = isPrivilegedRole(user?.role);
  const canRemind = !privileged && remindersUsed < MAX_REMINDERS;

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = window.localStorage.getItem(REMINDER_KEY);
        setRemindersUsed(
          raw ? Math.min(Math.max(Number.parseInt(raw, 10) || 0, 0), MAX_REMINDERS) : 0,
        );
      } catch {
        setRemindersUsed(0);
      }
    });
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      setError("");
      setBusy(false);
      setCodes(undefined);
      setRedirectTo(undefined);
    });
  }, [user?.email]);

  const enroll = async () => {
    setError("");
    setBusy(true);
    try {
      const result = await registerPasskey(
        deviceName.trim() || t.security.passkeyDevice,
        next,
      );
      if (result.backupCodes?.length) setCodes(result.backupCodes);
      setRedirectTo(result.redirectTo);
      onEnrolled?.();
    } catch (error) {
      if (error instanceof AuthRequestError && error.code === "unavailable") {
        setError(t.security.enrollUnsupported);
      } else if (error instanceof AuthRequestError && error.code === "cancelled") {
        setError(t.auth.passkeyCancelled);
      } else {
        setError(t.security.enrollError);
      }
    } finally {
      setBusy(false);
    }
  };

  const continueToDestination = () => {
    const target = resolveRedirectTarget(redirectTo ?? next, user);
    onContinue?.();
    router.replace(target);
  };

  const remindLater = () => {
    if (privileged || remindersUsed >= MAX_REMINDERS) return;
    const used = remindersUsed + 1;
    setRemindersUsed(used);
    try {
      window.localStorage.setItem(REMINDER_KEY, String(used));
    } catch {
      // Storage may be unavailable; the in-memory count still applies.
    }
    onDismiss?.();
    if (variant === "page") continueToDestination();
  };

  if (!user?.sessionVerified) return null;
  const completedHere = Boolean(codes?.length || redirectTo);
  if (user.passkeyEnrolled && !completedHere) return null;

  if (completedHere) {
    return (
      <div className="guard-form" data-testid="passkey-enroll-success">
        <p className="guard-success" role="status">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          {t.security.enrollSuccess}
        </p>
        <BackupCodesPanel
          codes={codes}
          hasBackupCodes={Boolean(codes?.length)}
          showRegenerate={false}
        />
        <div className="guard-actions">
          <button
            type="button"
            className="guard-button-primary"
            onClick={continueToDestination}
            data-testid="passkey-enroll-continue"
          >
            {t.security.enrollContinue}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="guard-form" data-testid="passkey-enroll-form">
      <div className="guard-heading">
        <span className="guard-icon" aria-hidden="true">
          <Fingerprint className="h-5 w-5" />
        </span>
        <div>
          <h2 className="guard-title" id="passkey-enroll-title">
            {t.security.enrollTitle}
          </h2>
          <p className="guard-copy">
            {privileged ? t.security.enrollRequired : t.security.enrollBenefitTwo}
          </p>
        </div>
      </div>

      <ul className="guard-benefits">
        <li>{t.security.enrollBenefitOne}</li>
        <li>{t.security.enrollBenefitTwo}</li>
      </ul>

      {webAuthnChecked && !webAuthnSupported ? (
        <p className="guard-notice" role="status" data-testid="webauthn-unsupported">
          {t.security.enrollUnsupported}
        </p>
      ) : (
        <p className="guard-hint">{t.security.enrollWebAuthnHint}</p>
      )}

      <Field label={t.security.enrollDeviceLabel} htmlFor="passkey-device-name">
        <TextInput
          id="passkey-device-name"
          data-testid="passkey-device-name"
          value={deviceName}
          onChange={(event) => setDeviceName(event.target.value)}
          placeholder={t.security.enrollDevicePlaceholder}
          maxLength={80}
          disabled={busy || (webAuthnChecked && !webAuthnSupported)}
        />
      </Field>

      {error ? (
        <p className="guard-error" role="alert" data-testid="passkey-enroll-error">
          {error}
        </p>
      ) : null}

      <div className="guard-actions">
        <button
          type="button"
          className="guard-button-primary"
          onClick={() => void enroll()}
          disabled={busy || (webAuthnChecked && !webAuthnSupported)}
          aria-busy={busy}
          data-testid="passkey-enroll-create"
        >
          <KeyRound className="h-4 w-4" aria-hidden="true" />
          {busy ? t.security.enrollCreating : t.security.enrollCreate}
        </button>
        {canRemind ? (
          <button
            type="button"
            className="guard-button-quiet"
            onClick={remindLater}
            disabled={busy}
            data-testid="passkey-enroll-remind"
          >
            {t.security.enrollRemind}
          </button>
        ) : null}
        {!canRemind ? (
          <button
            type="button"
            className="guard-button-quiet"
            onClick={() => void signOut()}
            data-testid="passkey-enroll-sign-out"
          >
            {t.security.enrollSignOut}
          </button>
        ) : null}
      </div>

      {canRemind ? (
        <p className="guard-hint">
          {t.security.enrollRemindersLeft}
          {MAX_REMINDERS - remindersUsed}
        </p>
      ) : null}

      <p className="guard-hint">
        <Link href="/portal/settings" className="guard-link">
          {t.nav.settings}
        </Link>
      </p>
    </div>
  );
}

/** Global, non-skippable-for-staff prompt shown after sign-in. */
export default function PasskeyEnrollmentGate() {
  const pathname = usePathname();
  const { user, ready } = useAuth();
  const [hidden, setHidden] = useState(false);
  const [completedHere, setCompletedHere] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const shouldShow =
    ready &&
    !hidden &&
    pathname !== "/passkey-enroll" &&
    Boolean(user?.sessionVerified) &&
    (!user?.passkeyEnrolled || completedHere);

  useEffect(() => {
    queueMicrotask(() => {
      setHidden(false);
      setCompletedHere(false);
    });
  }, [user?.email]);

  useEffect(() => {
    if (shouldShow) sectionRef.current?.focus();
  }, [shouldShow]);

  if (!shouldShow) return null;

  return (
    <div className="guard-backdrop">
      <section
        ref={sectionRef}
        className="guard-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="passkey-enroll-title"
        tabIndex={-1}
        data-testid="passkey-enroll-gate"
      >
        <PasskeyEnrollmentForm
          variant="modal"
          onDismiss={() => setHidden(true)}
          onEnrolled={() => setCompletedHere(true)}
          onContinue={() => {
            setCompletedHere(false);
            setHidden(true);
          }}
        />
      </section>
    </div>
  );
}
