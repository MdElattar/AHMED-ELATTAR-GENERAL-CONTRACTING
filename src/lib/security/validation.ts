export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Accepts local and international formats, including Arabic-Indic digits.
const PHONE_PATTERN = /^[+()\-\s.\p{N}]{6,40}$/u;

export function cleanString(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export function cleanMultiline(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, max);
}

export function normalizeEmail(value: unknown) {
  return cleanString(value, 254).toLowerCase();
}

export function isEmail(value: string) {
  return value.length <= 254 && EMAIL_PATTERN.test(value);
}

export function isPhone(value: string) {
  return value.length <= 40 && PHONE_PATTERN.test(value);
}

export function isDisplayName(value: string) {
  return value.length >= 2 && value.length <= 120;
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isSafeInternalPath(value: unknown) {
  if (typeof value !== "string") return false;
  if (!value.startsWith("/") || value.startsWith("//")) return false;
  if (value.includes("\\") || value.includes("\n") || value.includes("\r")) return false;
  return true;
}
