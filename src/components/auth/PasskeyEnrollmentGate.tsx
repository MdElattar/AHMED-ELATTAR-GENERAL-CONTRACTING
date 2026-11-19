"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Fingerprint, KeyRound, ShieldCheck, X } from "lucide-react";

import {
  AuthRequestError,
  resolveRedirectTarget,
  safeNextParam,
  useAuth,
} from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { Field, TextInput } from "@/components/ui/Field";
import { BackupCodesPanel } from "./BackupCodesPanel";

type EnrollmentFormProps = {
  onDismiss?: () => void;
  onEnrolled?: () => void;
  onContinue?: () => void;
};

/** Full enrollment form, used only by Account Settings and the dedicated route. */
export function PasskeyEnrollmentForm({
  onDismiss,
  onEnrolled,
  onContinue,
}: EnrollmentFormProps) {
  const { user, registerPasskey, webAuthnSupported, webAuthnChecked } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = useMemo(() => safeNextParam(searchParams?.get("next")), [searchParams]);

  const [deviceName, setDeviceName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [codes, setCodes] = useState<string[] | undefined>();
  const [redirectTo, setRedirectTo] = useState<string | undefined>();

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

  const leave = () => {
    onContinue?.();
    router.replace(resolveRedirectTarget(redirectTo ?? next, user));
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
            onClick={leave}
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
          <p className="guard-copy">{t.security.enrollBenefitTwo}</p>
        </div>
        {onDismiss ? (
          <button
            type="button"
            className="guard-close"
            onClick={onDismiss}
            aria-label={t.common.close}
            title={t.common.close}
            data-testid="passkey-enroll-close"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
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
        <button
          type="button"
          className="guard-button-quiet"
          onClick={onDismiss ?? leave}
          disabled={busy}
          data-testid="passkey-enroll-remind"
        >
          {t.security.enrollRemind}
        </button>
      </div>

      <p className="guard-hint">
        <Link href="/portal/settings#security" className="guard-link">
          {t.nav.settings}
        </Link>
      </p>
    </div>
  );
}

/**
 * A dismissible nudge shown once on the initial sign-in and then at most once
 * every four sign-ins. It never overlays the page with a blocking dialog; the
 * complete setup and management experience lives in Account Settings › Security.
 */
export default function PasskeyEnrollmentGate() {
  const pathname = usePathname();
  const { user, ready } = useAuth();
  const { t } = useI18n();
  const [hidden, setHidden] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const inSettings = pathname === "/portal/settings" || pathname === "/passkey-enroll";
  const shouldShow =
    ready &&
    !hidden &&
    !inSettings &&
    user?.sessionVerified === true &&
    user.passkeyPrompt &&
    !user.passkeyEnrolled;

  useEffect(() => {
    queueMicrotask(() => setHidden(false));
  }, [user?.email]);

  if (!shouldShow) return null;

  return (
    <div className="guard-prompt-backdrop">
      <section
        ref={sectionRef}
        className="guard-prompt-card"
        role="status"
        aria-labelledby="passkey-prompt-title"
        data-testid="passkey-enroll-gate"
      >
        <button
          type="button"
          className="guard-close"
          onClick={() => setHidden(true)}
          aria-label={t.common.close}
          title={t.common.close}
          data-testid="passkey-prompt-close"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
        <span className="guard-icon" aria-hidden="true">
          <Fingerprint className="h-5 w-5" />
        </span>
        <h2 className="guard-title" id="passkey-prompt-title">
          {t.security.enrollTitle}
        </h2>
        <p className="guard-copy">{t.security.enrollBenefitTwo}</p>
        <div className="guard-actions">
          <Link
            href="/portal/settings#security"
            className="guard-button-primary"
            data-testid="passkey-prompt-settings"
            onClick={() => setHidden(true)}
          >
            {t.security.enrollCreate}
          </Link>
          <button
            type="button"
            className="guard-button-quiet"
            onClick={() => setHidden(true)}
            data-testid="passkey-prompt-later"
          >
            {t.security.enrollRemind}
          </button>
        </div>
      </section>
    </div>
  );
}
