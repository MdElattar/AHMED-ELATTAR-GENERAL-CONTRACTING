import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Cormorant_Garamond, Inter, Manrope, Tajawal } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { I18nProvider } from "@/components/providers/I18nProvider";
import { AtmosphereProvider } from "@/components/providers/AtmosphereProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { WorkspaceProvider } from "@/components/providers/WorkspaceProvider";
import { BRAND } from "@/lib/brand";
import { RouteChrome } from "@/components/layout/RouteChrome";
import IdleGuard from "@/components/auth/IdleGuard";
import PasskeyEnrollmentGate from "@/components/auth/PasskeyEnrollmentGate";
import { ToastProvider } from "@/components/ui/Toast";
import { ServiceWorkerRegistrar } from "@/components/providers/ServiceWorkerRegistrar";
import { SpeedInsights } from "@vercel/speed-insights/next";

/**
 * Locale and the admin theme preference are read from request cookies so the
 * first paint is already correct. Cache Components therefore cannot prerender
 * a single static shell for every visitor; see the Next.js `instant` docs.
 */
export const instant = false;

const arabic = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700", "800"],
  variable: "--font-arabic",
  display: "swap",
});

const body = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(BRAND.siteUrl),
  title: {
    default: `${BRAND.nameAr} | ${BRAND.descriptionAr}`,
    template: `%s | ${BRAND.shortAr}`,
  },
  description: `${BRAND.nameAr} — ${BRAND.descriptionAr}`,
  icons: {
    icon: [{ url: "/brand/logo-mark.svg", type: "image/svg+xml" }],
    shortcut: "/brand/logo-mark.svg",
    apple: "/icons/icon-180.png",
  },
  keywords: [
    "مقاولات",
    "إنشاءات",
    "الدمام",
    "السعودية",
    "مشاريع",
    "هندسة مدنية",
    "تصميم معماري",
    "تأجير معدات",
    "Ahmed Alattar",
    "construction",
    "Saudi Arabia",
    "contracting",
  ],
  authors: [{ name: BRAND.nameEn }],
  creator: BRAND.nameEn,
  openGraph: {
    type: "website",
    locale: "ar_SA",
    alternateLocale: ["en_US"],
    siteName: BRAND.nameEn,
    title: `${BRAND.nameAr} | ${BRAND.shortAr}`,
    description: BRAND.descriptionAr,
    url: BRAND.siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND.nameEn,
    description: BRAND.descriptionEn,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: BRAND.themeColor,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // The locale cookie is the SSR source of truth so English visitors never see
  // Arabic copy flash before hydration. The inline scripts only mirror it.
  const cookieStore = await cookies();
  const storedLocale = cookieStore.get("alattar-locale")?.value;
  const initialLocale = storedLocale === "en" ? "en" : "ar";
  const initialDir = initialLocale === "en" ? "ltr" : "rtl";
  const initialTheme = cookieStore.get("alattar-theme")?.value === "light" ? "light" : "dark";

  return (
    <html
      lang={initialLocale}
      dir={initialDir}
      data-locale={initialLocale}
      data-theme="dark"
      suppressHydrationWarning
      className={`${arabic.variable} ${body.variable} ${display.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var k='alattar-locale';var l=null;var m=document.cookie.match(/(?:^|; )alattar-locale=(ar|en)/);if(m){l=m[1];}else{try{l=localStorage.getItem(k);}catch(e){}}if(l!=='en'){l='ar';}var r=document.documentElement;r.lang=l;r.dir=l==='en'?'ltr':'rtl';r.dataset.locale=l;try{localStorage.setItem(k,l);}catch(e){}try{document.cookie=k+'='+l+'; path=/; max-age=31536000; SameSite=Lax';}catch(e){}}catch(e){document.documentElement.dataset.locale='ar';}})();",
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var k='alattar-atmosphere';var v=localStorage.getItem(k);if(v!=='golden'&&v!=='blue'&&v!=='studio'){v='golden';}document.documentElement.dataset.vibe=v;}catch(e){document.documentElement.dataset.vibe='golden';}})();",
          }}
        />
        {/* The public shell is always dark; light is an admin-only preference. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var k='alattar-theme';var v='dark';var m=document.cookie.match(/(?:^|; )alattar-theme=(light|dark)/);if(m){v=m[1];}else{try{var s=localStorage.getItem(k);if(s==='light'||s==='dark'){v=s;}}catch(e){}}var r=document.documentElement;r.dataset.theme='dark';r.dataset.themePreference=v;var admin=location.pathname==='/admin'||location.pathname.indexOf('/admin/')===0;if(admin){r.dataset.adminTheme=v;r.style.colorScheme=v;}else{r.removeAttribute('data-admin-theme');r.style.colorScheme='dark';}}catch(e){var f=document.documentElement;f.dataset.theme='dark';f.dataset.themePreference='dark';f.style.colorScheme='dark';}})();",
          }}
        />
      </head>
      <body className="min-h-full bg-bg font-sans text-fg">
        <WorkspaceProvider>
          <I18nProvider initialLocale={initialLocale}>
            <AtmosphereProvider>
              <ThemeProvider initialTheme={initialTheme}>
                <AuthProvider>
                  <ToastProvider>
                    <a
                      href="#main"
                      className="sr-only z-[300] bg-accent-fill px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-accent-fg focus:not-sr-only focus:fixed focus:start-4 focus:top-4"
                    >
                      تجاوز إلى المحتوى / Skip to content
                    </a>
                    <RouteChrome>{children}</RouteChrome>
                    <Suspense fallback={null}>
                      <PasskeyEnrollmentGate />
                    </Suspense>
                    <Suspense fallback={null}>
                      <IdleGuard />
                    </Suspense>
                    <SpeedInsights />
                    <ServiceWorkerRegistrar />
                  </ToastProvider>
                </AuthProvider>
              </ThemeProvider>
            </AtmosphereProvider>
          </I18nProvider>
        </WorkspaceProvider>
      </body>
    </html>
  );
}
