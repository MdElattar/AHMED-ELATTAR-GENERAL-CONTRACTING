"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  Check,
  CheckCircle2,
  FileSignature,
  Loader2,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import type { WorkspaceProject } from "@/components/providers/WorkspaceProvider";

type Signoff = {
  id: string;
  projectSlug: string;
  email: string;
  signerName: string;
  contractHash: string;
  signedAt: string;
  milestones: { titleEn: string; verifiedAt: string; verifiedBy: string }[];
};

const copy = {
  ar: {
    title: "العقد والتوقيع الرقمي",
    text: "راجع بنود العقد ووقّع رقمياً. بعد التوقيع يمكنك توثيق كل مرحلة مكتملة.",
    signer: "الاسم كما سيظهر في التوقيع",
    consent: "أقر بأنني راجعت نطاق العمل وقيمة العقد والبرنامج الزمني وأوافق على التوقيع الرقمي.",
    sign: "توقيع العقد رقمياً",
    resign: "إعادة توقيع النسخة المحدّثة",
    signing: "جارٍ التوقيع…",
    signed: "العقد موقّع",
    outdated:
      "تغيّرت بنود العقد أو نطاقه بعد توقيعك السابق. يرجى مراجعة النسخة الحالية وإعادة التوقيع لتفعيل توثيق المراحل.",
    signedBy: "وقّع بواسطة",
    signedAt: "تاريخ التوقيع",
    digest: "بصمة العقد",
    verify: "توثيق المرحلة",
    verified: "موثقة",
    complete: "مكتملة",
    verifying: "جارٍ التوثيق…",
    locked: "بانتظار إكمال المرحلة",
    signFirst: "وقّع العقد أولاً لتوثيق المراحل.",
    noMilestones: "لا توجد مراحل مكتملة لتوثيقها بعد.",
    value: "قيمة العقد",
    milestones: "المراحل",
    error: {
      invalid_input: "تحقق من الاسم والموافقة.",
      project_not_found: "المشروع غير متاح.",
      contract_required: "وقّع العقد أولاً.",
      contract_outdated: "العقد محدّث. أعد التوقيع ثم وثّق المرحلة.",
      milestone_not_found: "المرحلة غير موجودة.",
      milestone_not_complete: "لا يمكن توثيق مرحلة غير مكتملة.",
      rate_limited: "طلبات كثيرة. حاول بعد قليل.",
      generic: "تعذّر إتمام العملية. حاول مرة أخرى.",
    },
    noticeSigned: "تم توقيع العقد وتوثيق البصمة.",
    noticeVerified: "تم توثيق المرحلة.",
  },
  en: {
    title: "Contract & digital sign-off",
    text: "Review the commercial terms and sign digitally. Once signed, you can verify each completed milestone.",
    signer: "Name as it will appear on the signature",
    consent: "I confirm that I reviewed the scope, contract value, and programme, and agree to sign digitally.",
    sign: "Sign contract digitally",
    resign: "Re-sign updated contract",
    signing: "Signing…",
    signed: "Contract signed",
    outdated:
      "The commercial terms or scope changed after your previous signature. Please review the current version and re-sign to re-enable milestone verification.",
    signedBy: "Signed by",
    signedAt: "Signed at",
    digest: "Contract digest",
    verify: "Verify milestone",
    verified: "Verified",
    complete: "Complete",
    verifying: "Verifying…",
    locked: "Awaiting completion",
    signFirst: "Sign the contract to unlock milestone verification.",
    noMilestones: "No completed milestones to verify yet.",
    value: "Contract value",
    milestones: "Milestones",
    error: {
      invalid_input: "Check the name and consent.",
      project_not_found: "This project is not available.",
      contract_required: "Sign the contract first.",
      contract_outdated: "The contract changed. Re-sign before verifying milestones.",
      milestone_not_found: "The milestone was not found.",
      milestone_not_complete: "Only completed milestones can be verified.",
      rate_limited: "Too many requests. Try again shortly.",
      generic: "The action could not be completed. Try again.",
    },
    noticeSigned: "Contract signed and digest recorded.",
    noticeVerified: "Milestone verified.",
  },
};

export function PortalContract({ project }: { project: WorkspaceProject }) {
  const { locale, l } = useI18n();
  const c = copy[locale];
  const [state, setState] = useState<{
    slug: string;
    signoff: Signoff | null;
    outdated: boolean;
    error: boolean;
  } | null>(null);
  const [signature, setSignature] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/portal/contract?projectSlug=${encodeURIComponent(project.slug)}`, {
      cache: "no-store",
      credentials: "same-origin",
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { signoff?: Signoff | null; outdated?: boolean } | null) => {
        if (cancelled) return;
        setState({
          slug: project.slug,
          signoff: payload?.signoff ?? null,
          outdated: payload?.outdated === true,
          error: !payload,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setState({ slug: project.slug, signoff: null, outdated: false, error: true });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [project.slug]);

  const loaded = state?.slug === project.slug;
  const signoff = loaded ? state.signoff : null;
  const outdated = loaded ? state.outdated : false;
  const signed = Boolean(signoff) && !outdated;
  const dateFormat = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const sign = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/portal/contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          projectSlug: project.slug,
          signatureName: signature,
          accepted: true,
        }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        const code = payload?.error ?? "generic";
        setError(c.error[code as keyof typeof c.error] ?? c.error.generic);
        return;
      }
      const payload = (await response.json()) as { signoff: Signoff; outdated?: boolean };
      setState({
        slug: project.slug,
        signoff: payload.signoff,
        outdated: payload.outdated === true,
        error: false,
      });
      setNotice(c.noticeSigned);
      setConsent(false);
    } catch {
      setError(c.error.generic);
    } finally {
      setBusy(false);
    }
  };

  const verify = async (titleEn: string) => {
    if (!signoff || verifying) return;
    setVerifying(titleEn);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/portal/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ projectSlug: project.slug, titleEn }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        const code = payload?.error ?? "generic";
        setError(c.error[code as keyof typeof c.error] ?? c.error.generic);
        return;
      }
      const payload = (await response.json()) as { signoff: Signoff | null };
      setState({
        slug: project.slug,
        signoff: payload.signoff,
        outdated: false,
        error: false,
      });
      setNotice(c.noticeVerified);
    } catch {
      setError(c.error.generic);
    } finally {
      setVerifying("");
    }
  };

  const completed = project.milestones.filter((milestone) => milestone.status === "complete");

  return (
    <div className="border border-white/10 bg-coal">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
        <span className="flex items-center gap-2 text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-gold">
          <FileSignature className="h-4 w-4" />
          {c.title}
        </span>
        {signed ? (
          <span className="flex items-center gap-1.5 text-[0.5rem] uppercase tracking-[0.12em] text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {c.signed}
          </span>
        ) : outdated ? (
          <span className="flex items-center gap-1.5 text-[0.5rem] uppercase tracking-[0.12em] text-gold">
            <FileSignature className="h-3.5 w-3.5" />
            {c.resign}
          </span>
        ) : null}
      </div>

      <div className="p-6">
        <p className="text-[0.68rem] leading-relaxed text-ivory/50">{c.text}</p>

        <dl className="mt-4 grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2">
          <div className="bg-obsidian p-3">
            <dt className="text-[0.46rem] uppercase tracking-[0.12em] text-ivory/40">{c.value}</dt>
            <dd className="mt-1 text-[0.68rem] text-ivory/70">{l(project.value)}</dd>
          </div>
          <div className="bg-obsidian p-3">
            <dt className="text-[0.46rem] uppercase tracking-[0.12em] text-ivory/40">
              {c.milestones}
            </dt>
            <dd className="mt-1 text-[0.68rem] text-ivory/70">
              {signed && signoff
                ? `${signoff.milestones.length} / ${completed.length}`
                : `${completed.length}`}
            </dd>
          </div>
        </dl>

        {!loaded ? (
          <div className="mt-5 flex items-center gap-2 text-[0.6rem] text-ivory/40">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {locale === "ar" ? "جارٍ التحقق…" : "Checking…"}
          </div>
        ) : signed && signoff ? (
          <div className="mt-5 space-y-4">
            <div className="border border-emerald-400/20 bg-emerald-400/[0.04] p-4">
              <p className="flex items-center gap-2 text-[0.62rem] text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                {c.signedBy}: {signoff.signerName}
              </p>
              <p className="mt-1 text-[0.52rem] text-ivory/45">
                {c.signedAt}: {dateFormat.format(new Date(signoff.signedAt))}
              </p>
              <p className="mt-1 truncate font-mono text-[0.48rem] text-ivory/35">
                {c.digest}: {signoff.contractHash}
              </p>
            </div>

            <ul className="space-y-2">
              {project.milestones.map((milestone) => {
                const verified = signoff.milestones.find(
                  (item) => item.titleEn.toLowerCase() === milestone.title.en.toLowerCase(),
                );
                const canVerify = milestone.status === "complete" && !verified;
                return (
                  <li
                    key={milestone.title.en}
                    className="flex items-center justify-between gap-3 border border-white/8 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[0.66rem] text-ivory/70">{l(milestone.title)}</p>
                      <p className="text-[0.5rem] text-ivory/40">
                        {l(milestone.date)} ·{" "}
                        {milestone.status === "complete" ? c.complete : c.locked}
                      </p>
                    </div>
                    {verified ? (
                      <span className="flex shrink-0 items-center gap-1 text-[0.48rem] uppercase tracking-[0.1em] text-emerald-300">
                        <Check className="h-3 w-3" />
                        {c.verified}
                      </span>
                    ) : canVerify ? (
                      <button
                        type="button"
                        disabled={Boolean(verifying)}
                        onClick={() => void verify(milestone.title.en)}
                        className="inline-flex h-7 shrink-0 items-center gap-1 border border-gold/30 px-2 text-[0.46rem] font-semibold uppercase tracking-[0.1em] text-gold transition-colors hover:bg-gold/10 disabled:opacity-50"
                      >
                        {verifying === milestone.title.en ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                        {verifying === milestone.title.en ? c.verifying : c.verify}
                      </button>
                    ) : (
                      <span className="flex shrink-0 items-center gap-1 text-[0.46rem] uppercase tracking-[0.1em] text-ivory/35">
                        <Lock className="h-3 w-3" />
                        {c.locked}
                      </span>
                    )}
                  </li>
                );
              })}
              {completed.length === 0 ? (
                <li className="px-3 py-4 text-center text-[0.6rem] text-ivory/40">
                  {c.noMilestones}
                </li>
              ) : null}
            </ul>
          </div>
        ) : (
          <form onSubmit={sign} className="mt-5 space-y-4">
            {outdated ? (
              <p className="border border-gold/25 bg-gold/5 px-3 py-2 text-[0.6rem] leading-relaxed text-gold">
                {c.outdated}
              </p>
            ) : null}
            <label className="flex items-start gap-2.5 text-[0.6rem] leading-relaxed text-ivory/55">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 accent-[#d4af37]"
                required
              />
              {c.consent}
            </label>
            <div>
              <label
                htmlFor="contract-signature"
                className="mb-2 block text-[0.52rem] uppercase tracking-[0.14em] text-ivory/50"
              >
                {c.signer}
              </label>
              <input
                id="contract-signature"
                value={signature}
                onChange={(event) => setSignature(event.target.value)}
                required
                minLength={2}
                maxLength={120}
                autoComplete="name"
                className="h-10 w-full border border-white/12 bg-transparent px-3 text-[0.7rem] text-ivory outline-none placeholder:text-ivory/40 focus:border-gold/60"
              />
            </div>
            <button
              type="submit"
              disabled={busy || !consent || signature.trim().length < 2}
              className="inline-flex h-10 w-full items-center justify-center gap-2 bg-gold px-4 text-[0.54rem] font-semibold uppercase tracking-[0.14em] text-obsidian transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSignature className="h-3.5 w-3.5" />}
              {busy ? c.signing : outdated ? c.resign : c.sign}
            </button>
            {completed.length ? (
              <p className="flex items-center gap-1.5 text-[0.5rem] text-ivory/40">
                <Lock className="h-3 w-3" />
                {c.signFirst}
              </p>
            ) : null}
          </form>
        )}

        {error ? (
          <p className="mt-4 border border-[#d98572]/30 bg-[#d98572]/10 px-3 py-2 text-[0.58rem] text-[#e6a99a]">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="mt-4 border border-gold/25 bg-gold/5 px-3 py-2 text-[0.58rem] text-gold">
            {notice}
          </p>
        ) : null}
      </div>
    </div>
  );
}
