export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Accepts local and international formats, including Arabic-Indic digits.
const PHONE_PATTERN = /^[+()\-\s.\p{N}]{6,40}$/u;

/** Strips markup and executable URL schemes before any value is persisted. */
function stripUnsafeMarkup(value: string) {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/\b(?:javascript|vbscript|data)\s*:/gi, "")
    .replace(/\bon[a-z]+\s*=/gi, "")
    .replace(/[\u2028\u2029]/g, " ");
}

export function cleanString(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return stripUnsafeMarkup(value)
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export function cleanMultiline(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return stripUnsafeMarkup(value)
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

const UNSAFE_KEYS = new Set(["__proto__", "prototype", "constructor"]);

/** Rejects prototype-pollution keys and MongoDB operator keys at any depth. */
export function isSafeMongoValue(value: unknown): boolean {
  if (typeof value === "string") return !value.startsWith("$");
  if (Array.isArray(value)) return value.every(isSafeMongoValue);
  if (!isPlainObject(value)) return value === null || ["string", "number", "boolean"].includes(typeof value);

  return Object.entries(value).every(
    ([key, nested]) =>
      !key.startsWith("$") && !UNSAFE_KEYS.has(key) && isSafeMongoValue(nested),
  );
}

export function isSafeInternalPath(value: unknown) {
  if (typeof value !== "string") return false;
  if (!value.startsWith("/") || value.startsWith("//")) return false;
  if (value.includes("\\") || value.includes("\n") || value.includes("\r")) return false;
  return true;
}
