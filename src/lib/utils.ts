import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function smoothstep(edge0: number, edge1: number, value: number) {
  const x = clamp((value - edge0) / (edge1 - edge0));
  return x * x * (3 - 2 * x);
}

export function lerp(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}

const numberFormatters = new Map<number, Intl.NumberFormat>();

/**
 * Number formatting is used inside animation frames, so the `Intl` instance is
 * cached per precision instead of being reconstructed on every tick.
 */
export function formatNumber(value: number, decimals = 0) {
  let formatter = numberFormatters.get(decimals);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    numberFormatters.set(decimals, formatter);
  }
  return formatter.format(value);
}

export function makeReference() {
  const stamp = Date.now().toString().slice(-6);
  return `ALT-${stamp}`;
}
