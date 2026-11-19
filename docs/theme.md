# Executive theme (admin light / standard dark)

The public site and client portal always use the original executive dark palette.
Only the Admin Panel can opt into the light palette; the default everywhere is
dark. The palette is defined once in `src/app/globals.css` and exposed as Tailwind 4
semantic utilities. Components never contain color literals — they use tokens or
`rgb(var(--*-rgb) / alpha)` for alpha composition.

## Modes

| Mode | Behavior |
| --- | --- |
| `dark` | Standard cinematic dark palette. Default for the whole site. |
| `light` | Editorial light palette, scoped to `/admin` only. |

The preference is stored in `localStorage["alattar-theme"]` and mirrored to an
httpOnly-free cookie of the same name. `src/app/layout.tsx` reads that cookie on
the server and passes it to `ThemeProvider`, so the first paint already reflects
the correct preference. The inline bootstrap script sets
`html[data-theme="dark"]` for the public shell and only adds
`html[data-admin-theme="light"]` while the route is under `/admin`. Leaving the
Admin Panel removes the admin attribute, so public pages never inherit light
colors. There is no `system` mode: OS light preference never changes the site.

## Tokens

| Token | Dark (site standard) | Light (admin only) | Tailwind |
| --- | --- | --- | --- |
| `--bg` | `#0A0B0E` | `#F7F5F0` | `bg-bg` |
| `--surface` | `#0E1017` | `#FFFFFF` | `bg-surface` |
| `--surface-2` | `#15181D` | `#F1EEE7` | `bg-surface-2` |
| `--line` | `rgba(255,255,255,.08)` | `rgba(22,27,38,.10)` | `border-line` |
| `--fg` | `#F3EEE4` | `#161B26` | `text-fg` |
| `--muted` | `#96938B` | `#5B6474` | `text-muted` |
| `--accent` | `#B8860B` | `#7A5812` | `text-accent` |
| `--accent-fg` | `#060708` | `#1A1405` | `text-accent-fg` |
| `--accent-fill` | `#C59B27` | `#C9A24A` | `bg-accent-fill` |
| `--success` | `#4CCB96` | `#166B47` | `text-success`, `bg-success` |
| `--warning` | `#E2B04A` | `#9A6412` | `text-warning`, `bg-warning` |
| `--danger` | `#FF6B5E` | `#B23A2E` | `text-danger`, `bg-danger` |
| `--info` | `#6BB6FF` | `#2A62A0` | `text-info`, `bg-info` |

Every color above also has a space-separated channel variable for alpha:
`--bg-rgb`, `--surface-rgb`, `--surface-2-rgb`, `--fg-rgb`, `--muted-rgb`,
`--accent-rgb`, `--success-rgb`, `--warning-rgb`, `--danger-rgb`, `--info-rgb`.
Example: `bg-accent/10` or
`style={{ backgroundColor: "rgb(var(--accent-rgb) / 0.14)" }}`.

### Elevation

| Token | Dark | Light (admin) |
| --- | --- | --- |
| `shadow-e1` | hairline + subtle surface step | `0 1px 2px rgba(22,27,38,.06), 0 8px 24px rgba(22,27,38,.06)` |
| `shadow-e2` | stronger hairline + soft depth | same pair at `.08` |
| `shadow-e3` | deepest panel elevation | same pair at `.10` / `.12` |

`shadow-lux` and `shadow-gold` are aliases of these. `color-scheme` follows the
resolved admin theme only while an admin route is mounted.

### Legacy aliases

The original utilities (`obsidian`, `ink`, `coal`, `graphite`, `steel`, `ash`,
`ivory`, `paper`, `sand`, `muted`, `gold`, `gold-light`, `gold-dark`, `bronze`,
`champagne`, `ember`) are mapped to the semantic variables above. That keeps the
restored public-site palette dynamic under the admin light tokens where needed.
Prefer semantic names in new code.

## Component API

```tsx
import { useTheme } from "@/components/providers/ThemeProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const { theme, resolvedTheme, setTheme, cycleTheme } = useTheme();

<ThemeToggle
  labels={{ cycle: "تبديل المظهر", light: "فاتح", dark: "داكن" }}
/>
```

`ThemeToggle` is a 44px target with a visible focus ring that toggles the Admin
Panel between dark and light. All strings come from `labels`; the fallback is
English. Never write `data-theme` directly in a component.

## Rules

1. No hex, `rgb(0 0 0 / …)`, `hsl(…)`, `text-white`, `bg-black`, or
   `linear-gradient(…#…)` in `src/**/*.{ts,tsx,css}`. All raw literals live only
   in the `:root[data-theme="dark"]` and `:root[data-admin-theme="light"]`
   blocks of `globals.css` (including the elevation definitions).
2. Use `rgb(var(--accent-rgb) / 0.14)`-style alpha instead of literal `rgba`.
3. Blur is reserved for sticky top bars and overlays. Those selectors get
   `backdrop-filter` inside `@supports`, with solid `--surface` backgrounds
   under `@supports not (…)`.
4. `html.theme-transition` animates color/background/border/shadow for 200ms
   only while an admin toggles the theme; `prefers-reduced-motion` disables it.
5. The admin content scroller hides its thumb until hover/focus so a refresh
   cannot paint a right-edge line artifact.

## Checks

- `npm run check:colors` — enforces rule 1 and exits 1 with `file:line` details.
- `npm run lint` — ESLint followed by the color guard.
- `npm run typecheck` / `npm run build`.
- `tests/theme-contrast.spec.ts` — axe `color-contrast` checks on `/sign-in`,
  `/admin`, and `/portal`. The public routes stay dark; `/admin` is checked in
  both admin themes at 1440px and 390px. It also writes best-effort screenshots
  to `artifacts/theme/`.
