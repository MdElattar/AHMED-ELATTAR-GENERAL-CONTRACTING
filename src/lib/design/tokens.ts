/**
 * Semantic palette source for server-rendered artifacts (email and PDF).
 * Browser UI reads the same values as CSS custom properties from
 * `src/app/globals.css`; this module exists because email clients and pdf-lib
 * cannot resolve CSS variables.
 */
import { ColorTypes, type RGB } from "pdf-lib";

export const surfaceTokens = {
  bg: "#0B0E14",
  surface: "#121722",
  surface2: "#181E2B",
  line: "#24262D",
  fg: "#EAE7DF",
  muted: "#9AA3B2",
  accent: "#C9A24A",
  accentLight: "#FFD36B",
  accentDeep: "#9A6412",
  accentFill: "#C9A24A",
  accentFg: "#1A1405",
  legacyGold: "#D4AF37",
  legacyIvory: "#F5EFE4",
  success: "#4CB58A",
  warning: "#E0A94A",
  danger: "#E5746A",
  info: "#6FA8DC",
} as const;

export type SurfaceToken = keyof typeof surfaceTokens;

/** Converts a semantic token into an `rgba()` string for inline email CSS. */
export function tokenAlpha(token: SurfaceToken, alpha: number): string {
  const value = surfaceTokens[token].replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((character) => character + character)
          .join("")
      : value;
  const red = Number.parseInt(full.slice(0, 2), 16);
  const green = Number.parseInt(full.slice(2, 4), 16);
  const blue = Number.parseInt(full.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

/** Converts a semantic token into the `RGB` color object expected by pdf-lib. */
export function tokenColor(token: SurfaceToken): RGB {
  const value = surfaceTokens[token].replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((character) => character + character)
          .join("")
      : value;
  return {
    type: ColorTypes.RGB,
    red: Number.parseInt(full.slice(0, 2), 16) / 255,
    green: Number.parseInt(full.slice(2, 4), 16) / 255,
    blue: Number.parseInt(full.slice(4, 6), 16) / 255,
  };
}

/** Alias kept for callers that prefer the shorter name. */
export const tokenRgb = tokenColor;
