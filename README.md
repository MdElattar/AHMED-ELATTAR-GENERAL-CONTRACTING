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

## Routes

- `/` — hero, manifesto, fleet, featured projects, process, crane experience, testimonials, CTA
- `/projects` — filterable portfolio with a detail modal
- `/projects/[slug]` — statically generated project case study
- `/services` — four service lines with anchored sections
- `/about` — founder story, values, safety, timeline, certifications
- `/contact` — three-step bidding form with validation and file upload
- `/sign-in`, `/sign-up` — demo authentication
- `/auth` — compatibility redirect to `/sign-in`
- `/forgot-password`, `/reset-password` — password recovery demo flow
- `/portal` — auth-gated client dashboard (projects, milestones, documents, invoices, updates)
- `/sitemap.xml`, `/robots.txt` — generated metadata routes

## Project structure

```
src/
├── app/                 # routes, metadata, global styles
├── components/
│   ├── layout/          # navbar, footer, preloader, scroll progress
│   ├── providers/       # i18n, auth, smooth scroll
│   ├── sections/        # home, projects, services, about, contact, portal, auth
│   ├── three/           # procedural crane model and R3F scenes
│   └── ui/              # buttons, fields, modal, counters, bespoke SVG art
├── data/                # projects, services, fleet, testimonials, portal demo data
└── lib/                 # bilingual dictionary and utilities
```

## Language

Arabic is the default. The locale toggle switches between AR/EN, updates
`<html lang dir>`, and persists the choice in `localStorage` under
`alattar-locale`. `?lang=en` or `?lang=ar` can be used to share a specific
locale, and the preloader renders language-neutral markup that resolves to the
stored locale before first paint. All copy lives in `src/lib/dictionary.ts`.

## Demo behaviour

There is no backend. Authentication, the client portal, and the bid form are
client-side demos persisted in `localStorage` / `sessionStorage`:

- `alattar-portal-user` — demo session
- `alattar-locale` — language preference
- `alattar-intro-seen` — skips the intro on repeat visits within a session

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
