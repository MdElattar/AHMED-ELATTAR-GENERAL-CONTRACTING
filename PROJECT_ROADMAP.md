# PROJECT ROADMAP — Ahmed Elattar General Contracting Co.

> Living production tracker for the definitive platform overhaul.
> Legend: `- [x]` shipped & verified · `- [ ]` pending · `- [~]` in progress

**Last updated:** 2026-11-11
**Verification gates:** `npm run build` · `npm run lint` · `npx tsc --noEmit`

---

## 1. Foundation & Governance

- [x] Create root `PROJECT_ROADMAP.md` tracker
- [x] Read the bundled Next.js 16.4 docs before touching framework APIs
- [x] Audit every route, provider, section, and API handler for regressions
- [x] Remove dead scroll/pinning code paths and unused client bundles
- [x] Establish a single source of truth for photography (`src/data/media.ts`)

## 2. Header & Navigation Absolute Overhaul

- [x] Replace conditional white/ivory navbar with one deep-obsidian frosted-glass bar
- [x] Remove the floating "GOLD" atmosphere tag from the header
- [x] Remove duplicated branding and the giant repeated footer wordmark
- [x] Clean primary links: Home · Projects · Services · About · Contact
- [x] Add explicit Portal link and role-gated Admin link
- [x] Rebuild the mobile menu as a native-feeling slide-in drawer
- [x] Lock body scroll, restore focus, support Escape + outside click
- [x] Guarantee zero horizontal overflow and 44px+ touch targets
- [x] Respect `safe-area-inset-*` on notched phones

## 3. Natural Scroll, Photorealism & Performance

- [x] Remove GSAP ScrollTrigger and all forced section pinning
- [x] Remove `usePinnedScroll` from Crane, Craftsmanship, and Fleet experiences
- [x] Keep Lenis smooth scroll as an optional, passive enhancement
- [x] Rebuild Crane sequence as a natural editorial photo grid
- [x] Rebuild Craftsmanship sequence as a natural build-diary timeline
- [x] Rebuild Fleet showcase as a natural photographic catalogue
- [x] Replace abstract SVG wireframe project art with real photography
- [x] Replace abstract SVG fleet art with real photography
- [x] Lazy-load every non-hero image through `next/image`
- [x] Add `content-visibility` and reduced-motion safeguards
- [x] Ensure every animation is transform/opacity only (60fps target)
- [x] Verify no horizontal scroll at 320px → 1920px

## 4. Backend, Database & Authentication

- [x] Add Mongoose models: `User`, `Project`, `Inquiry`, `AuditLog`, `OtpToken`
- [x] Add a resilient repository layer (MongoDB in production, seeded memory in dev)
- [x] Hash passwords with Node `scrypt` + per-user salt
- [x] Persist sign-up users and verify credentials on sign-in
- [x] Rate-limit auth, OTP, contact, and newsletter endpoints
- [x] Implement 6-digit email OTP "Forgot Password" request endpoint
- [x] Implement OTP verification with hashed codes, expiry, and attempt limits
- [x] Implement secure password reset with an httpOnly reset cookie
- [x] Add transactional email delivery (Resend) with dev-safe OTP fallback
- [x] Persist contact inquiries and newsletter subscriptions
- [x] Add admin-only project CRUD API
- [x] Add admin-only inquiry management + audit log APIs
- [x] Add audit logging for auth, admin, and destructive actions
- [x] Validate every auth/contact/newsletter payload with shared Zod schemas
- [x] Wire the admin workspace to the API with optimistic local fallback

## 5. Admin Panel & Client Portal

- [x] Role-gated `/admin` dashboard (proxy + server session check)
- [x] Project create / edit / delete with media cover + gallery selection
- [x] Inquiry inbox with status transitions (new → read → won/lost)
- [x] Milestone tracking per project, reflected live in the client portal
- [x] Add / remove milestones inline from the admin panel
- [x] Treat the database as authoritative when merging portfolio state across browsers
- [x] Live audit trail surface
- [x] Portal project tracking, document vault, and message channel
- [x] Portal financials, invoices, and profile settings

## 6. AI Estimator & Portfolio

- [x] "العطار الذكي" conversational estimation widget
- [x] Parameterised feasibility metrics (type, scale, city, quality, pace)
- [x] Riyadh and Egypt (Cairo) cost baselines in the shared estimate engine
- [x] Real-time portfolio filtering by category + location + search
- [x] High-resolution project modal gallery
- [x] Estimator result hand-off into the contact/bid flow

## 7. Quality Gates

- [x] `npx tsc --noEmit` passes with zero errors
- [x] `npm run lint` passes with zero errors
- [x] `npm run build` completes for all routes
- [x] No hydration warnings on first load
- [x] No `console.error` on primary user journeys
- [x] Lighthouse-oriented image sizing and font strategy documented

---

## Environment Checklist (deployment)

| Variable | Required | Purpose |
| :--- | :---: | :--- |
| `AUTH_SECRET` | ✅ | HMAC signing for sessions + reset tokens (32+ chars) |
| `MONGODB_URI` | recommended | MongoDB Atlas connection string |
| `RESEND_API_KEY` | production | OTP email delivery |
| `OTP_FROM_EMAIL` | production | Verified sender, e.g. `no-reply@alattar.sa` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | production | First admin bootstrap (hashed on seed) |
| `ALLOW_DEMO_ACCOUNTS` | optional | Enables `demo@alattar.sa` in non-production |

> Without `MONGODB_URI`, the platform runs on a seeded in-memory repository so
> local demos and CI builds remain fully functional. Production deployments
> must set `MONGODB_URI` and `RESEND_API_KEY`.
