import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offline",
  robots: { index: false, follow: false },
};

/** Pre-cached by the service worker; never depends on an API or session. */
export default function OfflinePage() {
  return (
    <main id="main" tabIndex={-1} className="guard-page">
      <section className="guard-page-card" aria-labelledby="offline-title">
        <p className="text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-accent">
          <span className="i18n-ar">اتصال غير متاح</span>
          <span className="i18n-en">Connection unavailable</span>
        </p>
        <h1 id="offline-title" className="mt-4 text-2xl font-semibold text-fg">
          <span className="i18n-ar">أنت غير متصل بالإنترنت</span>
          <span className="i18n-en">You are offline</span>
        </h1>
        <p className="guard-copy mt-3">
          <span className="i18n-ar">
            تعذّر الوصول إلى البيانات المباشرة. يمكنك إعادة المحاولة عند عودة الاتصال.
          </span>
          <span className="i18n-en">
            Live data is unavailable right now. Try again when your connection returns.
          </span>
        </p>
        <Link
          href="/"
          className="guard-button-primary mt-6 no-underline"
        >
          <span className="i18n-ar">العودة إلى الرئيسية</span>
          <span className="i18n-en">Return home</span>
        </Link>
      </section>
    </main>
  );
}
