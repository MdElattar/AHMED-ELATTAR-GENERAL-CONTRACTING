# PROJECT ROADMAP — Ahmed Elattar General Contracting Co.

> Living production tracker for the definitive platform overhaul.
> Legend: `- [x]` shipped & verified · `- [ ]` pending · `- [~]` in progress

**Last updated:** 2026-11-12
**Verification gates:** `npm run build` · `npm run lint` · `npx tsc --noEmit`

---

## 1. Foundation & Governance

- [x] Create root `PROJECT_ROADMAP.md` tracker
- [x] Read the bundled Next.js 16.4 docs before touching framework APIs
- [x] Audit every route, provider, section, and API handler for regressions
- [x] Remove dead scroll/pinning code paths and unused client bundles
- [x] Establish a single source of truth for photography (`src/data/media.ts`)

## 2. Header & Navigation Absolute Overhaul

- [x] Replace conditional white/ivory navbar with one pitch-black frosted-glass bar
  (`bg-black/90 backdrop-blur-md border-b border-white/10`, fixed to viewport top)
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
- [x] Hash passwords with bcrypt (cost 12) + SHA-256 prehash for long passphrases
- [x] Keep legacy scrypt hashes verifiable and rehash them transparently on sign-in
- [x] Persist sign-up users and verify credentials on sign-in against MongoDB
- [x] Remove every demo-account bypass and hardcoded portal credential
- [x] Add `/api/auth/password` with current-password verification and bcrypt update
- [x] Add a bootstrap seed script (`npm run seed`) for the first super-admin
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
- [x] Convert `/sign-in`, `/sign-up`, forgot/reset password, and every portal page to the obsidian luxury system
- [x] Remove all white content blocks, demo badges, and demo-only copy from auth + portal
- [x] Read services, portfolio, project detail, portal projects, financials, and settings from the live database
- [x] Project detail page and sitemap resolve projects at request time instead of static mock imports

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

## 8. Enterprise & Luxury Features

- [x] Interactive Project Cost Visualizer (Breakdown by structural, finishes, & MEP)
  (`ProjectCostVisualizer` on every project detail page, type-aware weights)
- [x] Before / After Interactive Site Slider & 4K Cinema Mode Project Player
  (`ProjectCinema`: drag divider, autoplay, fullscreen, 3,200px master source)
- [x] VIP Executive Consultation Scheduler & Direct Boardroom Booking
  (`/consultation`, availability API, boardroom calendar, admin status board)
- [x] Automated Project Proposal PDF Generator & Direct Download API
  (`POST /api/proposal`, `pdf-lib` + Arabic shaping, three-page branded PDF)
- [x] Admin Instant Notification Webhook (Email & WhatsApp alert dispatch)
  (`lib/notifications` fan-out on inquiry, consultation, proposal, signature)
- [x] Digital Contract Sign-Off & Milestone Verification in Client Portal
  (`PortalContract`, SHA-256 digest, stale-signature re-sign gate, verified milestones)
- [x] Multi-Currency Real-time Converter (SAR / EGP / USD) for Estimator Engine
  (`/api/rates`, live `open.er-api.com` feed with cached fallback, PDF currency)

**Section 8 verified:** 2026-11-12 — `npx tsc --noEmit`, `npm run lint`,
`npm run build`, and the proposal PDF smoke render all pass.

## 9. V5 — Editorial Control & Motion

- [x] MongoDB-backed copy override layer (`copyOverrides`) keyed by dictionary dot-paths
- [x] Every public dictionary leaf editable, including hand-authored section copy
- [x] MongoDB-backed media override layer (`mediaOverrides`) for hero, crane,
      craftsmanship, fleet, project covers, live-site covers, and live-site galleries
- [x] Dedicated `/admin/site-content` copy studio and `/admin/media` route
- [x] Route-addressable admin sections (`/admin/[section]`) with auth-gated metadata
- [x] Searchable, grouped copy editor with bilingual fields and reset-to-original
- [x] Animated admin sidebar: sliding gold indicator, icon lift/rotation, hover sweep,
      fluid label motion, and pressed-state feedback
- [x] `WorkspaceProvider` moved above `I18nProvider` so CMS copy resolves globally
- [x] Hero copy and copy overrides share one effective translation surface
- [x] Media overrides resolve through `next/image` with an admin-gated remote allow-list

**Section 9 verified:** 2026-11-12 — `npx tsc --noEmit`, `npm run lint`, and
`npm run build` all pass; `/admin/site-content` and `/admin/media` redirect to
sign-in without an admin session, while `/api/content` and `/` return 200.

---

## Environment Checklist (deployment)

| Variable | Required | Purpose |
| :--- | :---: | :--- |
| `AUTH_SECRET` | ✅ | HMAC signing for sessions + reset tokens (32+ chars) |
| `JWT_SECRET` | optional | Accepted alias for `AUTH_SECRET` |
| `MONGODB_URI` | production | MongoDB Atlas / self-hosted connection string |
| `RESEND_API_KEY` | production | OTP email delivery |
| `OTP_FROM_EMAIL` | production | Verified sender, e.g. `no-reply@alattar.sa` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | production | First admin bootstrap (hashed by `npm run seed`) |
| `ADMIN_ALERT_EMAIL` | optional | Recipient for instant admin email alerts |
| `WHATSAPP_WEBHOOK_URL` | optional | Generic webhook alert transport |
| `WHATSAPP_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` / `WHATSAPP_TO` | optional | Meta Cloud API WhatsApp transport |
| `ALLOW_IN_MEMORY_DB` | optional | Explicitly allows the seeded memory repository in production |

> Production fails closed without `MONGODB_URI` unless `ALLOW_IN_MEMORY_DB=true`.
> Development falls back to the seeded in-process repository when MongoDB is
> unreachable. Run `npm run seed` once against the production database to
> bootstrap the first super-admin and the project/service catalogue.

> The proposal PDF embeds `public/fonts/NotoNaskhArabic.ttf`; keep that asset
> deployed with the app so Arabic shaping renders on the server.