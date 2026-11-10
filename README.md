# Alattar — Construction & Contracting

An Arabic-first (RTL) bilingual marketing and client portal experience for a luxury
Saudi construction house. Built with the Next.js App Router, a procedural Three.js
crane, and a scroll-driven editorial layout.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) + React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 4, custom design tokens |
| Motion | GSAP + ScrollTrigger, Framer Motion, Lenis smooth scroll |
| 3D | Three.js, `@react-three/fiber`, `@react-three/drei` |
| Icons | Lucide |

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve the production build
npm run lint
npx tsc --noEmit
```

## Environment

Copy `.env.example` to `.env.local`. `AUTH_SECRET` is required in production
(32+ characters); generate one with `openssl rand -base64 48`. Development falls
back to a local-only secret, and production refuses to sign sessions without a
valid value.

## Routes

- `/` — hero, manifesto, fleet, featured projects, process, crane experience, testimonials, CTA
- `/projects` — filterable portfolio with a detail modal
- `/projects/[slug]` — statically generated project case study
- `/services` — four service lines with anchored sections
- `/about` — founder story, values, safety, timeline, certifications
- `/contact` — three-step bidding form with validation and file upload
- `/sign-in`, `/sign-up` — authentication against the signed-session API
- `/auth` — compatibility redirect to `/sign-in`
- `/forgot-password`, `/reset-password` — password recovery flow
- `/portal` — auth-gated client dashboard (projects, milestones, documents, invoices, updates)
- `/portal/projects`, `/portal/financials`, `/portal/settings` — portal sub-views
- `/admin` — admin-only workspace (server-gated by `src/proxy.ts`)
- `/privacy`, `/terms` — legal pages
- `/sitemap.xml`, `/robots.txt` — generated metadata routes

### API route handlers

- `POST /api/auth/sign-in`, `POST /api/auth/sign-up`, `POST /api/auth/sign-out`
- `GET /api/auth/session`, `PATCH /api/auth/profile`
- `POST /api/contact`, `POST /api/newsletter`

Every mutating handler validates the payload and rejects cross-origin requests
before it reads or writes anything.

## Project structure

```
src/
├── app/                 # routes, metadata, global styles
├── components/
│   ├── layout/          # navbar, footer, preloader, scroll progress
│   ├── providers/       # i18n, auth, workspace, smooth scroll
│   ├── sections/        # home, projects, services, about, contact, portal, auth
│   ├── system/          # shared route loading skeletons and error boundaries
│   ├── three/           # procedural crane model and R3F scenes
│   └── ui/              # buttons, fields, modal, counters, bespoke SVG art
├── data/                # projects, services, fleet, testimonials, portal demo data
└── lib/                 # dictionary, utils, session signing, security helpers
```

## Language

Arabic is the default. The locale toggle switches between AR/EN, updates
`<html lang dir>`, and persists the choice in `localStorage` under
`alattar-locale`. `?lang=en` or `?lang=ar` can be used to share a specific
locale, and the preloader renders language-neutral markup that resolves to the
stored locale before first paint. All copy lives in `src/lib/dictionary.ts`.

## Demo behaviour

Authentication is served by route handlers under `src/app/api/auth/*` and backed
by an HMAC-SHA256 signed, `httpOnly`, `sameSite=strict` session cookie
(`alattar_session`). Credentials are validated server-side; the browser never
holds the signing key. There is still no database — accounts, projects, and
invoices are seeded demo data — so treat this as a reference implementation,
not a production identity provider.

- Set `AUTH_SECRET` (32+ characters) in production; the server refuses to sign
  sessions without it.
- `src/proxy.ts` gates `/portal` and `/admin` before any page renders, and
  `AuthProvider` re-verifies the session against `/api/auth/session` on mount.
- Only a server-verified session can grant the `admin` role; a cached
  `localStorage` copy is display-only and is downgraded to `client`.

Client storage keys:

- `alattar-portal-user` — display cache of the verified session (never trusted)
- `ahmed-elattar-workspace-v1` — client-side portal/admin workspace state
- `ahmed-elattar-portal-preferences` — portal UI preferences
- `alattar-locale` — language preference
- `alattar-intro-seen` — skips the intro on repeat visits within a session

The contact, newsletter, sign-in, sign-up, profile, and sign-out handlers all
validate input and same-origin requests before touching state.

## Design notes

- Obsidian, charcoal, champagne gold, and ivory palette.
- Bespoke inline SVG artwork for projects and fleet — no external imagery.
- The crane is modelled procedurally from primitives and instanced struts, so
  there is no GLB payload. Brushed-metal roughness maps, a procedural city
  backdrop, an under-construction frame, and a directional sun shadow map add
  depth without external assets.
- The pinned crane section uses GSAP ScrollTrigger to drive slewing, boom
  luffing, trolley travel, cable lowering, and hook motion.
- Reduced-motion preferences skip the intro and settle scroll animations.
- Site credit: [Developed by Mohamed Elattar](https://mohamedelattar.com).
# AHMED-ELATTAR-GENERAL-CONTRACTING
# AHMED-ELATTAR-GENERAL-CONTRACTING
