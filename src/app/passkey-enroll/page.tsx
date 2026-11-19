"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { PasskeyEnrollmentForm } from "@/components/auth/PasskeyEnrollmentGate";
import {
  resolveRedirectTarget,
  safeNextParam,
  useAuth,
} from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";

function EnrollContent() {
  const auth = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = useMemo(() => safeNextParam(searchParams?.get("next")), [searchParams]);
  const [enrolledHere, setEnrolledHere] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setEnrolledHere(false));
  }, [auth.user?.email]);

  useEffect(() => {
    if (enrolledHere) return;
    if (!auth.ready || !auth.user?.sessionVerified || !auth.user.passkeyEnrolled) return;
    router.replace(resolveRedirectTarget(next, auth.user));
  }, [auth.ready, auth.user, enrolledHere, next, router]);

  if (!auth.ready) {
    return (
      <main className="guard-page" id="main" tabIndex={-1}>
        <p className="guard-hint" role="status">
          {t.auth.loadingEnrollment}
        </p>
      </main>
    );
  }

  if (!auth.user?.sessionVerified) {
    return (
      <main className="guard-page" id="main" tabIndex={-1}>
        <section className="guard-page-card">
          <p className="guard-copy" role="alert">
            {t.portal.noAccessText}
          </p>
          <div className="guard-actions">
            <Link className="guard-button-primary" href="/sign-in">
              {t.auth.signInLink}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="guard-page" id="main" tabIndex={-1}>
      <section className="guard-page-card" aria-labelledby="passkey-enroll-title">
        <PasskeyEnrollmentForm
          onEnrolled={() => setEnrolledHere(true)}
          onDismiss={() => router.replace(resolveRedirectTarget(next, auth.user))}
        />
      </section>
    </main>
  );
}

export default function PasskeyEnrollPage() {
  const { t } = useI18n();
  return (
    <Suspense
      fallback={
        <main className="guard-page" id="main" tabIndex={-1}>
          <p className="guard-hint" role="status">
            {t.auth.loadingEnrollment}
          </p>
        </main>
      }
    >
      <EnrollContent />
    </Suspense>
  );
}
