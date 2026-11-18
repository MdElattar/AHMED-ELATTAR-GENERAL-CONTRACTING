"use client";

import { useState } from "react";
import { Download, KeyRound, Loader2, RefreshCw } from "lucide-react";
import { AuthRequestError, useAuth } from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";

type BackupCodesPanelProps = {
  /** Freshly generated codes, e.g. from the enrollment flow. */
  codes?: string[];
  /** Whether the server currently has an active set of backup codes. */
  hasBackupCodes: boolean;
  /** Show the regenerate action (requires a passkey step-up). */
  showRegenerate?: boolean;
  onCodesGenerated?: (codes: string[]) => void;
};

export function BackupCodesPanel({
  codes,
  hasBackupCodes,
  showRegenerate = true,
  onCodesGenerated,
}: BackupCodesPanelProps) {
  const { t } = useI18n();
  const { stepUp, regenerateBackupCodes } = useAuth();
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const visibleCodes = codes?.length ? codes : generatedCodes;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const download = () => {
    if (!visibleCodes.length) return;
    const contents = `${t.security.backupCodesTitle}\n${visibleCodes.join("\n")}\n`;
    const blob = new Blob([contents], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "alattar-backup-codes.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const regenerate = async () => {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await stepUp();
      const nextCodes = await regenerateBackupCodes();
      setGeneratedCodes(nextCodes);
      onCodesGenerated?.(nextCodes);
      setMessage(t.security.backupCodesGenerated);
    } catch (error) {
      if (
        error instanceof AuthRequestError &&
        (error.code === "step_up_required" || error.code === "cancelled")
      ) {
        setError(t.security.stepUpRequired);
      } else {
        setError(t.security.backupCodesError);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      className="border border-white/10 bg-coal p-6"
      aria-labelledby="backup-codes-title"
      data-testid="backup-codes-panel"
    >
      <div className="flex items-center gap-2 text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-gold">
        <KeyRound className="h-4 w-4" />
        <h3 id="backup-codes-title">{t.security.backupCodesTitle}</h3>
      </div>
      <p className="mt-3 max-w-2xl text-[0.72rem] leading-relaxed text-ivory/55">
        {t.security.backupCodesText}
      </p>

      {visibleCodes.length ? (
        <>
          <ol
            className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3"
            aria-label={t.security.backupCodesTitle}
          >
            {visibleCodes.map((code) => (
              <li
                key={code}
                className="backup-code border border-gold/20 bg-gold/[0.05] px-3 py-2 text-center text-[0.7rem] tracking-[0.08em] text-ivory"
              >
                {code}
              </li>
            ))}
          </ol>
          <p role="status" className="mt-3 text-[0.62rem] leading-relaxed text-gold/80">
            {t.security.backupCodesNotice}
          </p>
          <button
            type="button"
            onClick={download}
            className="mt-4 inline-flex min-h-11 items-center gap-2 border border-gold/35 bg-gold/[0.07] px-4 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-gold transition-colors hover:border-gold/60 hover:bg-gold/[0.12] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            data-testid="backup-codes-download"
          >
            <Download className="h-3.5 w-3.5" />
            {t.security.backupCodesDownload}
          </button>
        </>
      ) : (
        <p className="mt-5 border border-dashed border-white/10 px-4 py-5 text-[0.68rem] text-ivory/45">
          {hasBackupCodes ? t.security.backupCodesNotice : t.security.backupCodesEmpty}
        </p>
      )}

      {showRegenerate ? (
        <button
          type="button"
          onClick={() => void regenerate()}
          disabled={busy}
          className="mt-4 inline-flex min-h-11 items-center gap-2 border border-white/15 px-4 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-ivory/65 transition-colors hover:border-gold/50 hover:text-gold disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          data-testid="backup-codes-regenerate"
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          {busy ? t.security.stepUpVerifying : t.security.backupCodesRegenerate}
        </button>
      ) : null}

      <p
        role={error ? "alert" : "status"}
        aria-live="polite"
        className={`mt-4 min-h-5 text-[0.6rem] ${error ? "text-red-300" : "text-ivory/45"}`}
      >
        {error || message || "\u00A0"}
      </p>
    </section>
  );
}
