# Executive theme (light / dark)

The palette is defined once in `src/app/globals.css` and exposed as Tailwind 4
semantic utilities. Components never contain color literals — they use tokens
or `rgb(var(--*-rgb) / alpha)` for alpha composition.

## Modes

| Mode | Behavior |
| --- | --- |
| `system` | Follows `prefers-color-scheme` live (default when nothing is stored). |
| `light` | Forced editorial light palette. |
| `dark` | Forced cinematic dark palette. |

The preference is stored in `localStorage["alattar-theme"]`. An inline script
in `src/app/layout.tsx` reads it before first paint, sets
`document.documentElement.dataset.theme` and `style.colorScheme`, and mirrors
the preference on `data-theme-preference`. `ThemeProvider` then keeps React,
`matchMedia`, storage, and the HTML attributes in sync.

## Tokens

| Token | Dark | Light | Tailwind |
| --- | --- | --- | --- |
| `--bg` | `#0B0E14` | `#F7F5F0` | `bg-bg` |
| `--surface` | `#121722` | `#FFFFFF` | `bg-surface` |
| `--surface-2` | `#181E2B` | `#F1EEE7` | `bg-surface-2` |
| `--line` | `rgba(255,255,255,.08)` | `rgba(22,27,38,.10)` | `border-line` |
| `--fg` | `#EAE7DF` | `#161B26` | `text-fg` |
| `--muted` | `#9AA3B2` | `#5B6474` | `text-muted` |
| `--accent` | `#C9A24A` | `#8F6A1A` | `text-accent` |
| `--accent-fg` | `#1A1405` | `#1A1405` | `text-accent-fg` |
| `--accent-fill` | `var(--accent)` | `#C9A24A` | `bg-accent-fill` |
| `--success` | `#4CB58A` | `#1F7A52` | `text-success`, `bg-success` |
| `--warning` | `#E0A94A` | `#9A6412` | `text-warning`, `bg-warning` |
| `--danger` | `#E5746A` | `#B23A2E` | `text-danger`, `bg-danger` |
| `--info` | `#6FA8DC` | `#2A62A0` | `text-info`, `bg-info` |

Every color above also has a space-separated channel variable for alpha:
`--bg-rgb`, `--surface-rgb`, `--surface-2-rgb`, `--fg-rgb`, `--muted-rgb`,
`--accent-rgb`, `--success-rgb`, `--warning-rgb`, `--danger-rgb`, `--info-rgb`.
Example: `bg-accent/10` or `style={{ backgroundColor: "rgb(var(--accent-rgb) / 0.14)" }}`.

### Elevation

| Token | Dark | Light |
| --- | --- | --- |
| `--shadow-e1` / `shadow-e1` | hairline + subtle surface step | `0 1px 2px rgba(22,27,38,.06), 0 8px 24px rgba(22,27,38,.06)` |
| `--shadow-e2` / `shadow-e2` | stronger hairline + soft depth | same pair at `.08` |
| `--shadow-e3` / `shadow-e3` | deepest panel elevation | same pair at `.10` / `.12` |

`shadow-lux` and `shadow-gold` are aliases of these, so existing classes still
work. `color-scheme` is set per theme, which keeps native controls and
scrollbars correct.

### Legacy aliases

`obsidian`, `ink`, `coal`, `graphite`, `steel`, `ash`, `ivory`, `paper`, `sand`,
`muted`, `gold`, `gold-light`, `gold-dark`, `bronze`, `champagne`, and `ember`
are all mapped to semantic variables. `text-gold` resolves to `--accent`;
`.bg-gold` resolves to `--accent-fill` with `--accent-fg` text for filled
buttons. Prefer the semantic names in new code.

## Component API

```tsx
import { useTheme } from "@/components/providers/ThemeProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const { theme, resolvedTheme, setTheme, cycleTheme } = useTheme();

<ThemeToggle
  labels={{ cycle: "تبديل المظهر", system: "النظام", light: "فاتح", dark: "داكن" }}
/>
```

`ThemeToggle` is a 44px target with a visible focus ring and cycles
`system → light → dark`. All strings come from `labels`; the fallback is
English. Admin code should replace its local theme state with `useTheme()`
instead of writing `data-theme` directly.

## Rules

1. No hex, `rgb(0 0 0 / …)`, `hsl(…)`, `text-white`, `bg-black`, or
   `linear-gradient(…#…)` in `src/**/*.{ts,tsx,css}`. Because these are
   intentionally theme-dependent, all raw literals live only in the two
   `:root[data-theme=…]` blocks of `globals.css` (including the elevation
   definitions).
2. Use `rgb(var(--accent-rgb) / 0.14)`-style alpha instead of literal `rgba`.
3. Blur is reserved for sticky top bars and overlays. Those selectors get
   `backdrop-filter` inside `@supports`, with solid `--surface` backgrounds
   under `@supports not (…)`.
4. `html.theme-transition` animates color/background/border/shadow for 200ms
   only while a user toggles the theme; `prefers-reduced-motion` disables it.

## Checks

- `npm run check:colors` — enforces rule 1 and exits 1 with `file:line` details.
- `npm run lint` — ESLint followed by the color guard. The guard reports legacy
  literals until the parallel codemod lands. It also scans server-side
  email/PDF template files (`src/lib/email.ts`, `src/lib/admin-alert-template.ts`,
  `src/lib/proposal.ts`), which need either tokenized markup or an explicit
  exclusion agreed with their owner.
- `npx tsc --noEmit --incremental false`
- `tests/theme-contrast.spec.ts` — axe `color-contrast` checks on `/sign-in`,
  `/admin`, and `/portal` in both themes at 1440px and 390px. Authenticated
  routes skip when `ADMIN_EMAIL` / `ADMIN_PASSWORD` are absent. It also writes
  best-effort screenshots to `artifacts/theme/`.

> Note: `playwright.config.ts` currently enumerates projects by filename
> (`projects-*`, `security-*`, …) and has no project matching
> `theme-contrast.spec.ts`. Add a `theme` project (or run with a config that
> includes the file) when wiring the suite into CI.
