"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#060708",
          color: "#f3eee4",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "2rem",
        }}
      >
        <main style={{ maxWidth: "36rem", textAlign: "center" }}>
          <p
            style={{
              margin: 0,
              color: "#a67c1a",
              fontSize: "0.7rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            خطأ غير متوقع · Unexpected error
          </p>
          <h1
            style={{
              margin: "1.25rem 0 0",
              fontSize: "clamp(1.8rem, 5vw, 2.8rem)",
              lineHeight: 1.15,
              fontWeight: 500,
            }}
          >
            حدث خطأ في التطبيق. · The application hit an error.
          </h1>
          <p style={{ margin: "1rem 0 0", color: "rgba(243,238,228,0.55)", lineHeight: 1.8 }}>
            أعد تحميل الصفحة للمتابعة. · Reload the page to continue.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.75rem",
              minHeight: "3rem",
              padding: "0 1.75rem",
              border: 0,
              background: "#a67c1a",
              color: "#060708",
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            حاول مرة أخرى · Try again
          </button>
        </main>
      </body>
    </html>
  );
}
