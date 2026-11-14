"use client";

import { useState } from "react";
import { AlertCircle, Check, ImageIcon, Loader2, Play, ShieldCheck } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { Button, Card, PageHeader } from "@/components/ui/admin";

type MaintenanceReport = {
  dryRun: boolean;
  count: number;
  candidates?: { slug: string; needsThumb: boolean; needsBlur: boolean }[];
  generated?: string[];
  failed?: { slug: string; reason: string }[];
};

export function AdminMaintenance() {
  const { locale } = useI18n();
  const isAr = locale === "ar";
  const [busy, setBusy] = useState<"dry" | "run" | null>(null);
  const [report, setReport] = useState<MaintenanceReport | null>(null);
  const [error, setError] = useState("");

  const run = async (dryRun: boolean) => {
    setBusy(dryRun ? "dry" : "run");
    setError("");
    try {
      const response = await fetch("/api/admin/maintenance/project-images", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun }),
      });
      const body = (await response.json().catch(() => ({}))) as MaintenanceReport & {
        error?: string;
      };
      if (!response.ok) throw new Error(body.error || `http_${response.status}`);
      setReport(body);
    } catch (cause) {
      setError(
        isAr
          ? "تعذر تشغيل أداة الصيانة. تحقق من الاتصال ثم أعد المحاولة."
          : cause instanceof Error && cause.message === "rate_limited"
            ? "Too many maintenance runs. Try again in a few minutes."
            : "The maintenance tool could not run. Check the connection and retry.",
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={isAr ? "الصيانة" : "Maintenance"}
        description={
          isAr
            ? "أدوات لمرة واحدة لاستكمال بيانات الصور القديمة دون إعادة رفعها."
            : "One-time tools that backfill image metadata for existing projects without re-uploading."
        }
      />

      <Card className="space-y-4 p-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-[rgba(226,176,74,0.25)] bg-[rgba(226,176,74,0.1)] text-[#E2B04A]">
            <ImageIcon className="h-5 w-5" strokeWidth={1.7} />
          </span>
          <div className="min-w-0">
            <h2 className="text-[16px] font-semibold text-[var(--admin-text)]">
              {isAr ? "توليد الصور المصغرة الناقصة" : "Generate missing thumbnails"}
            </h2>
            <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-[var(--admin-muted)]">
              {isAr
                ? "يفحص كل مشروع، يعيد استخدام صورة الغلاف الحالية، ويولّد نسخة WebP بعرض 400 بكسل مع بلور صغير. شغّل المعاينة أولاً لمعرفة ما سيتم تغييره. تظهر فقط المشاريع التي ينقصها thumbUrl أو blurDataURL."
                : "Scans every project, reuses the existing cover, and generates a 400px WebP thumbnail plus a tiny blur placeholder. Run the dry run first to preview changes. Only projects missing thumbUrl or blurDataURL are touched."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={busy !== null}
            onClick={() => void run(true)}
          >
            {busy === "dry" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            {isAr ? "معاينة فقط (Dry run)" : "Dry run"}
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={busy !== null}
            onClick={() => void run(false)}
          >
            {busy === "run" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {isAr ? "توليد الصور الناقصة" : "Generate missing thumbnails"}
          </Button>
        </div>

        {error ? (
          <p
            role="alert"
            className="flex items-center gap-2 rounded-[12px] border border-red-400/25 bg-red-400/[0.08] px-3 py-2.5 text-[13px] text-red-200"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </p>
        ) : null}

        {report ? (
          <div className="space-y-3 border-t border-[var(--admin-card-border)] pt-4">
            <p className="flex items-center gap-2 text-[14px] font-semibold text-[var(--admin-text)]">
              <Check className="h-4 w-4 text-[#4CCB96]" />
              {report.dryRun
                ? isAr
                  ? `المعاينة: ${report.count} مشروعاً يحتاج تحديثاً.`
                  : `Dry run: ${report.count} project${report.count === 1 ? "" : "s"} need attention.`
                : isAr
                  ? `تم تحديث ${report.count} مشروعاً.`
                  : `Updated ${report.count} project${report.count === 1 ? "" : "s"}.`}
            </p>

            {report.candidates?.length ? (
              <ul className="grid list-none gap-1.5 p-0 sm:grid-cols-2">
                {report.candidates.map((candidate) => (
                  <li
                    key={candidate.slug}
                    className="flex items-center justify-between gap-2 rounded-[10px] bg-[var(--admin-pill-surface)] px-3 py-2 text-[12px]"
                  >
                    <span className="truncate text-[var(--admin-text)]">{candidate.slug}</span>
                    <span className="shrink-0 text-[var(--admin-muted)]">
                      {[candidate.needsThumb ? "thumb" : "", candidate.needsBlur ? "blur" : ""]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}

            {report.failed?.length ? (
              <ul className="list-none space-y-1 p-0 text-[12px] text-[#FF9A8F]">
                {report.failed.map((failure) => (
                  <li key={failure.slug}>
                    {failure.slug}: {failure.reason}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
