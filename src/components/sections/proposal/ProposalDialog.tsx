"use client";

import { useState, type FormEvent } from "react";
import { Download, Loader2, ShieldCheck } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { Field, Select, TextInput } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { CURRENCIES, CURRENCY_META, type CurrencyCode } from "@/lib/currency";
import type { EstimateInput } from "@/lib/estimate";

export function ProposalDialog({
  open,
  onClose,
  defaults,
  projectSlug,
  projectTitle,
}: {
  open: boolean;
  onClose: () => void;
  defaults: EstimateInput;
  projectSlug?: string;
  projectTitle?: string;
}) {
  const { t, locale } = useI18n();
  const c = t.sections.proposal;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("SAR");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...defaults,
          slug: projectSlug ?? "",
          name,
          email,
          company,
          phone,
          currency,
          locale,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        const code = payload?.error ?? "generic";
        setError(c.errors[code as keyof typeof c.errors] ?? c.errors.generic);
        return;
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const filename =
        disposition.match(/filename="([^"]+)"/)?.[1] ?? `Ahmed-Elattar-Proposal-${Date.now()}.pdf`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setReference(response.headers.get("X-Proposal-Reference") ?? "");
    } catch {
      setError(c.errors.generic);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} labelledBy="proposal-dialog-title" closeLabel={c.title}>
      <form onSubmit={submit} className="p-6 sm:p-10">
        <span className="eyebrow">{c.eyebrow}</span>
        <h2
          id="proposal-dialog-title"
          className="display-title mt-4 text-[clamp(1.9rem,4vw,3rem)] text-ivory"
        >
          {c.title}
        </h2>
        <p className="mt-3 max-w-2xl text-[0.82rem] leading-[1.9] text-ivory/60">{c.description}</p>
        {projectTitle ? (
          <p className="mt-3 text-[0.62rem] uppercase tracking-[0.16em] text-gold/80">
            {projectTitle}
          </p>
        ) : null}

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <Field label={c.name} htmlFor="proposal-name" required>
            <TextInput
              id="proposal-name"
              name="name"
              autoComplete="name"
              required
              minLength={2}
              maxLength={120}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <Field label={c.email} htmlFor="proposal-email" required>
            <TextInput
              id="proposal-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <Field label={c.company} htmlFor="proposal-company">
            <TextInput
              id="proposal-company"
              name="company"
              autoComplete="organization"
              maxLength={160}
              value={company}
              onChange={(event) => setCompany(event.target.value)}
            />
          </Field>
          <Field label={c.phone} htmlFor="proposal-phone">
            <TextInput
              id="proposal-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              maxLength={40}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </Field>
          <Field label={c.currency} htmlFor="proposal-currency" className="sm:col-span-2">
            <Select
              id="proposal-currency"
              value={currency}
              onChange={(event) => setCurrency(event.target.value as CurrencyCode)}
              options={CURRENCIES.map((code) => ({
                value: code,
                label:
                  locale === "ar"
                    ? `${CURRENCY_META[code].ar} · ${CURRENCY_META[code].labelAr}`
                    : `${CURRENCY_META[code].en} · ${CURRENCY_META[code].labelEn}`,
              }))}
            />
          </Field>
        </div>

        {error ? (
          <p className="mt-5 border border-[#d98572]/30 bg-[#d98572]/10 px-4 py-3 text-[0.72rem] text-[#e6a99a]">
            {error}
          </p>
        ) : null}
        {reference ? (
          <p className="mt-5 border border-gold/25 bg-gold/5 px-4 py-3 text-[0.72rem] text-gold">
            {c.success} <span className="font-mono">{reference}</span>
          </p>
        ) : null}

        <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex max-w-sm items-start gap-2 text-[0.62rem] leading-relaxed text-ivory/45">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold/60" />
            {c.note}
          </p>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-12 shrink-0 items-center justify-center gap-3 border border-gold bg-gold px-6 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-obsidian transition-colors hover:bg-gold-light disabled:cursor-wait disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {busy ? c.working : c.submit}
          </button>
        </div>
      </form>
    </Modal>
  );
}
