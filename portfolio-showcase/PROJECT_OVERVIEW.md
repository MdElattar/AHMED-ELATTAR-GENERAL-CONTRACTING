# Ahmed Elattar General Contracting — Digital Platform

## نظرة عامة تنفيذية / Executive Portfolio Overview

> **Arabic-first. Security-led. Built for enterprise construction operations.**

This document is the portfolio companion for the Ahmed Elattar General Contracting Co. web platform. It combines the public luxury experience, the client transparency portal, and the independent administrative control center into one production-grade application. The screenshots in this folder are generated automatically from the running product — not mocked designs — using the Playwright suite in `tests/portfolio-showcase.spec.ts`.

> ملاحظة تسمية المجلد: تم استخدام `portfolio-showcase/` كاسم ASCII آمن للتنقل عبر أنظمة CI وWindows، وهو الاسم التقني المكافئ لمجلد **«احترافي»**.

---

## ١. الملخص التنفيذي (العربية)

منصة رقمية متكاملة لشركة أحمد العطار للمقاولات العامة، مصممة لتحويل المشاريع الضخمة من ملفات ورسائل متفرقة إلى تجربة شفافة ومركزية تخدم الإدارة والعميل والزائر في آن واحد.

**القيمة التجارية:**
- **ثقة العميل:** بوابة خاصة تعرض المراحل والمستندات والفواتير والتقدم المالي لحظة بلحظة، مع توقيع عقد رقمي موثّق ببصمة تشفيرية.
- **سرعة القرار:** لوحة إدارة مستقلة تجمع مؤشرات الأداء وصحة الميزانيات والاستفسارات والعقود والمشاريع في واجهة واحدة داكنة فاخرة.
- **تحويل أعلى:** موقع عام سينمائي متعدد اللغات يُبرز المشاريع بأسلوب تحريري راقٍ ويشجع على طلب الاستشارة.
- **جاهزية إنتاجية:** حماية أمنية صارمة تشمل CSRF، وتحديد معدل الطلبات، وتحقق Zod، ومنع IDOR، وحماية NoSQL، وتشفير كلمات المرور بـ bcrypt.

**النهج المعماري:** تم فصل واجهة الجمهور عن «شلّ الإدارة» تماماً؛ فالإدارة لا تظهر في تنقل الموقع العام، وتحمّل جلساتها ومساراتها الخاصة. البوابة والإدارة كلاهما محميان على مستوى الـ proxy وعلى مستوى الـ route، مع تحقق حي من إصدار الجلسة حتى تُسحب الصلاحيات فوراً.

---

## 2. Executive summary (English)

A unified digital platform for Ahmed Elattar General Contracting Co. that turns complex mega-project delivery into a transparent, secure, and premium experience for three audiences: the public, assigned clients, and internal administrators.

**Business value:**
- **Client confidence:** a private portal with live milestones, documents, invoices, financial tracking, and cryptographically digested contract sign-off.
- **Faster decisions:** a dedicated admin control center with KPIs, budget health, inquiries, signed-contract metrics, and a responsive project management table in a dark luxury theme.
- **Higher conversion:** a cinematic bilingual public site with an interactive project catalog and editorial-grade presentation.
- **Production readiness:** CSRF defence, IP + identifier rate limiting, strict Zod validation, IDOR prevention, NoSQL injection guards, bcrypt password hashing, hardened headers, and fail-closed production configuration.

**Architectural stance:** the public site and the admin shell are deliberately decoupled. Admin navigation is never mixed into public chrome; admin and portal routes are guarded both by the proxy layer and by route-level checks, with live session-version reconciliation for immediate revocation.

---

## 3. معرض اللقطات / Visual showcase

All images are captured at a retina-equivalent device scale factor of 2. Desktop captures are **3200 × 2000 px**; responsive mobile captures are **780 × 1688 px**.

| # | View | Arabic description | Capture |
| --- | --- | --- | --- |
| 01 | Public homepage — hero | الواجهة الرئيسية مع لمسة WebGL ثلاثية الأبعاد ومقدمة سينمائية | [AR](01-home-hero-ar.png) · [EN](01-home-hero-en.png) |
| 02 | Interactive catalog | كتالوج المشاريع التفاعلي مع الفلاتر والبحث | [Full page](02-projects-catalog.png) |
| 02b | Project preview modal | نافذة معاينة المشروع التفاعلية | [Modal](02-projects-preview-modal.png) |
| 03 | Client portal | لوحة العميل مع المراحل والمتتبع المالي | [Dashboard](03-client-portal-dashboard.png) |
| 04 | Admin overview | لوحة الإدارة الداكنة مع مؤشرات الأداء | [Overview](04-admin-dashboard.png) |
| 05 | Projects management | جدول المشاريع وشريط العمليات الجماعية | [Desktop](05-admin-projects-bulk-desktop.png) · [Tablet](05-admin-projects-bulk-tablet.png) · [Mobile](05-admin-projects-bulk-mobile.png) · [Full](05-admin-projects-table-full.png) |
| 06 | Contract signing | توقيع العقد الآمن مع موافقة وبصمة تشفيرية | [Signing](06-client-contract-signing.png) · [Full](06-client-contract-signing-full.png) |

### لقطة مميزة / Featured capture

![Homepage hero — Arabic RTL](01-home-hero-ar.png)

---

## 4. Tech stack / التقنيات

| Layer | Technology | Why it matters |
| --- | --- | --- |
| Framework | **Next.js 16 (App Router)** | Server components, streaming, proxy-level guards, and file-based route isolation. |
| UI | **React 19 + TypeScript (strict)** | Typed contracts from database payloads through API responses to UI state. |
| Styling | **Tailwind CSS 4.3** | Utility-first luxury design system with gold accents, glass surfaces, and responsive micro-layouts. |
| Motion | **Framer Motion** | Cinematic reveals, modal choreography, and admin shell transitions. |
| 3D | **Three.js + React Three Fiber** | Client-only procedural WebGL accent in the hero; decorative, pointer-transparent, and lazy-loaded so it never blocks LCP. |
| Data | **MongoDB + Mongoose 9** | Canonical project/content records, strict schemas, `select: false` secret fields, ownership indexes. |
| Validation | **Zod 4** | Strict request contracts, unknown-field rejection, sanitization, and recursive NoSQL-operator rejection. |
| Auth | **Signed JWT cookies + bcryptjs (cost 12)** | `HttpOnly`, `Secure`, `SameSite=Strict`, session rotation, live `sessionVersion` checks. |
| Notifications | **Resend + WhatsApp API/webhook** | Instant admin alerts for inquiries, consultations, contracts, and portal activity. |
| Testing | **Playwright** | Security regressions, responsive admin tables, and automated portfolio capture. |
| Tooling | **ESLint, TS Compiler, npm audit** | Repeatable quality gates with a dedicated `security:scan` secret scanner. |

---

## 5. Enterprise features / الميزات المؤسسية

### 5.1 Admin Shell مستقل — شلّ إدارة مستقل تماماً
- مسار `/admin/*` منفصل عن تنقل الجمهور ولا يشارك أي عناصر هيكلية مع الموقع العام.
- جلسة إدارة مشددة: تحقق من الدور + إصدار الجلسة في الـ proxy وفي كل route إداري.
- لوحة داكنة بتبويبات متعددة: نظرة عامة، مشاريع، محتوى، وسائط، استفسارات، عقود، تنبيهات، وصول.
- جدول المشاريع يتكيف عبر `ResizeObserver` من الجدول الكامل إلى الجدول المضغوط إلى بطاقات الجوال، مع شريط عمليات جماعية ثابت.

**English:** a fully decoupled `/admin/*` shell with its own guarded session, dark luxury theme, KPI cards, budget-health bars, and a container-width-driven project table that degrades gracefully from full table to compact table to mobile cards without horizontal overflow.

### 5.2 Client transparency portal — بوابة شفافية العميل
- كل عميل يرى **المشاريع المُسندة إليه فقط** عبر `clientEmails` + `ownedProject()`.
- المراحل، نسبة الإنجاز، المستندات، الفواتير، والملخص المالي في تدفق واحد.
- توقيع العقد يتطلب موافقة صريحة واسم موقّع، ويُنتج بصمة `contractHash` موثّقة.
- تحقق المراحل المكتملة لا يتاح إلا بعد توقيع العقد.
- تنبيهات فورية للإدارة عبر Resend والواتساب عند الأنشطة الحساسة.

**English:** clients receive only their assigned projects. Milestones, documents, invoices, and financial summaries are presented in one no-store live feed. Contract signing is consent-gated and hashed; milestone verification unlocks only after a valid sign-off. Sensitive actions trigger instant email and WhatsApp alerts.

### 5.3 Production-grade security — أمان جاهز للإنتاج
- **CSRF:** `SameSite=Strict` + strict `Origin` / `Sec-Fetch-Site` checks on every mutating API.
- **Rate limiting:** shared IP bucket + identifier bucket; repeated failures return `429` with `Retry-After`.
- **Validation:** strict Zod schemas reject unknown fields and strip HTML/script/event-handler payloads.
- **NoSQL:** recursive rejection of `$gt`, `$ne`, `$where`, `$regex`, `__proto__`, `constructor`, `prototype`; Mongoose `sanitizeFilter` enabled.
- **IDOR:** ownership derived from the signed session and persisted project ownership, never from a client-supplied project ID alone.
- **Passwords:** bcrypt cost 12 with SHA-256 pre-hash; all hash fields are `select: false` and never returned or logged.
- **Headers:** HSTS, `X-Frame-Options: DENY`, `nosniff`, strict referrer policy, permissions policy, and a shared CSP used by both `next.config.ts` and the proxy.
- **Fail-closed:** production refuses to start on the in-memory development repository; no stack traces or raw database errors reach clients.

Full control-by-control evidence is in [`../SECURITY_AUDIT_REPORT.md`](../SECURITY_AUDIT_REPORT.md).

### 5.4 Arab-first bilingual architecture — بنية عربية المركز ثنائية اللغة
- العربية هي اللغة الافتراضية مع تخطيط RTL كامل وتبديل فوري إلى الإنجليزية.
- خط **Tajawal** للعربية، مع Cormorant Garamond وManrope للعناوين والجسم اللاتيني.
- أرقام `lining-nums tabular-nums` لضمان محاذاة الأرقام في الجداول المالية ولوحات المؤشرات.
- micro-layouts متجاوبة مبنية على `useContainerWidth()` بدلاً من تخمين قياسات الشاشة.
- نسخ المحتوى قابل للتحرير من الإدارة، مع ترجمة متوازية لكل عنصر.

**English:** Arabic is the default with full RTL layout, Tajawal typography, lining/tabular numerals for financial alignment, and container-query-style behavior through a custom `useContainerWidth()` hook. Content is editable from the CMS with parallel Arabic/English fields.

---

## 6. Reproducing the showcase / إعادة توليد اللقطات

The captures are produced by a dedicated Playwright project. It provisions a deterministic client identity, assigns ownership through the real admin API, authenticates both admin and portal sessions, then navigates the live application.

```bash
# 1) Generate every screenshot in this folder
npm run test:portfolio

# 2) Quality gates
npm run typecheck
npm run lint
npm run build
npm run security:scan
npm run test:security
npm run test:projects
npm audit --omit=dev
```

Environment requirements for authenticated captures:
- `ADMIN_EMAIL` and `ADMIN_PASSWORD`
- `MONGODB_URI` with seeded canonical projects (`npm run seed`)
- Optional: `PORTFOLIO_CLIENT_EMAIL` / `PORTFOLIO_CLIENT_PASSWORD` to override the showcase client identity

---

## 7. Delivery notes / ملاحظات التسليم

- Screenshots are **live product evidence**: the portal views use a real signed-in client session, and the admin views use a real admin session.
- No secrets, tokens, or private environment values are embedded in this document or in the images.
- The screenshot generator is idempotent: rerunning it overwrites the same deterministic filenames.
- The ASCII folder alias keeps automation portable while the Arabic identity remains explicit in the title and narrative.
- The repository also includes `SECURITY_AUDIT_REPORT.md`, `tests/security-hardening.spec.ts`, and `scripts/security-scan.mjs` for independent verification.

---

## 8. Closing statement / خاتمة

> **العربية:** المنصة ليست مجرد موقع تعريفي؛ هي نظام تشغيل رقمي للمشاريع يجمع بين التسويق الراقي والشفافية مع العميل والسيطرة الإدارية، مبني على أسس أمنية صلبة وتجربة عربية أصلية.

> **English:** This is not merely a corporate website — it is a digital operating layer for construction delivery, combining premium marketing, client transparency, and administrative control on a hardened, Arabic-first foundation.
