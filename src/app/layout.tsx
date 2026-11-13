import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope, Tajawal } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/components/providers/I18nProvider";
import { AtmosphereProvider } from "@/components/providers/AtmosphereProvider";
import { RouteScrollReset } from "@/components/providers/RouteScrollReset";
import { SmoothScrollProvider } from "@/components/providers/SmoothScroll";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { WorkspaceProvider } from "@/components/providers/WorkspaceProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ScrollProgress } from "@/components/layout/ScrollProgress";
import { ToastProvider } from "@/components/ui/Toast";

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

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://alattar.sa"),
  title: {
    default: "شركة أحمد العطار للمقاولات العامة | نبني ما يبقى",
    template: "%s | أحمد العطار",
  },
  description:
    "شركة أحمد العطار للمقاولات العامة — أربعة عقود من الهندسة الدقيقة والمشاريع الضخمة في المملكة العربية السعودية. من الرؤية الأولى إلى آخر مسمار.",
  keywords: [
    "مقاولات",
    "إنشاءات",
    "الرياض",
    "السعودية",
    "مشاريع",
    "هندسة مدنية",
    "تصميم معماري",
    "تأجير معدات",
    "Ahmed Elattar",
    "construction",
    "Saudi Arabia",
    "contracting",
  ],
  authors: [{ name: "Ahmed Elattar General Contracting Co." }],
  creator: "Ahmed Elattar General Contracting Co.",
  openGraph: {
    type: "website",
    locale: "ar_SA",
    alternateLocale: ["en_US"],
    siteName: "Ahmed Elattar General Contracting Co.",
    title: "شركة أحمد العطار للمقاولات العامة | نبني ما يبقى",
    description:
      "أربعة عقود من الهندسة الدقيقة والمشاريع الضخمة في المملكة العربية السعودية.",
    url: "https://alattar.sa",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ahmed Elattar General Contracting Co.",
    description: "We build what endures. Four decades of precision construction in Saudi Arabia.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0b0e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${arabic.variable} ${body.variable} ${display.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var k='alattar-locale';var l=null;var q=new URLSearchParams(location.search).get('lang');if(q==='ar'||q==='en'){l=q;}else{try{l=localStorage.getItem(k);}catch(e){}if(l!=='ar'&&l!=='en'){var m=document.cookie.match(/(?:^|; )alattar-locale=(ar|en)/);l=m?m[1]:null;}}if(l!=='en'){l='ar';}try{localStorage.setItem(k,l);}catch(e){}try{document.cookie=k+'='+l+'; path=/; max-age=31536000; SameSite=Lax';}catch(e){}var r=document.documentElement;r.lang=l;r.dir=l==='en'?'ltr':'rtl';r.dataset.locale=l;}catch(e){document.documentElement.dataset.locale='ar';}})();",
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var k='alattar-atmosphere';var v=localStorage.getItem(k);if(v!=='golden'&&v!=='blue'&&v!=='studio'){v='golden';}document.documentElement.dataset.vibe=v;}catch(e){document.documentElement.dataset.vibe='golden';}})();",
          }}
        />
      </head>
      <body className="min-h-full bg-obsidian font-sans text-ivory">
        <WorkspaceProvider>
          <I18nProvider>
            <AtmosphereProvider>
              <SmoothScrollProvider>
                <AuthProvider>
                  <ToastProvider>
                    <RouteScrollReset />
                    <ScrollProgress />
                    <a
                      href="#main"
                      className="sr-only z-[300] bg-gold px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-obsidian focus:not-sr-only focus:fixed focus:start-4 focus:top-4"
                    >
                      تجاوز إلى المحتوى / Skip to content
                    </a>
                    <Navbar />
                    <main id="main" className="min-h-screen">
                      {children}
                    </main>
                    <Footer />
                  </ToastProvider>
                </AuthProvider>
              </SmoothScrollProvider>
            </AtmosphereProvider>
          </I18nProvider>
        </WorkspaceProvider>
      </body>
    </html>
  );
}
