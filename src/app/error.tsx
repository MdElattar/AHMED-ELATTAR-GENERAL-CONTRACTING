"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-obsidian pt-24">
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="container-lux relative">
        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          <span className="eyebrow">{t.errors.code}</span>
          <h1 className="display-title mt-7 text-[clamp(2.6rem,5.4vw,5rem)] text-ivory">
            {t.errors.generic}
          </h1>
          <button
            type="button"
            onClick={reset}
            className="mt-9 inline-flex h-12 items-center gap-2.5 bg-gold px-7 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-obsidian transition-colors hover:bg-gold-light"
          >
            <RotateCcw className="h-4 w-4" />
            {t.errors.retry}
          </button>
        </div>
      </div>
    </section>
  );
}
