import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import bcrypt from "bcryptjs";

const scrypt = promisify(scryptCallback);

const BCRYPT_COST = 12;
const LEGACY_KEY_LENGTH = 64;

/**
 * Passwords are hashed with bcrypt (cost 12).
 *
 * bcrypt silently truncates inputs at 72 bytes, so the raw password is first
 * reduced to a fixed-length SHA-256 digest (base64). This keeps the full
 * entropy of long passphrases and avoids multi-byte truncation bugs while
 * remaining a standard bcrypt verifier.
 *
 * Stored format: `bcrypt$<bcrypt-hash>`.
 */
export async function hashPassword(password: string): Promise<string> {
  const material = createHash("sha256").update(password, "utf8").digest("base64");
  const hash = await bcrypt.hash(material, BCRYPT_COST);
  return `bcrypt$${hash}`;
}

/**
 * Verifies current bcrypt hashes and, during a rolling migration, the legacy
 * `scrypt$<salt>$<hash>` format used by earlier builds.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    if (stored.startsWith("bcrypt$")) {
      const hash = stored.slice("bcrypt$".length);
      if (!hash) return false;
      const material = createHash("sha256").update(password, "utf8").digest("base64");
      return await bcrypt.compare(material, hash);
    }

    // Raw bcrypt hashes (for example imported from an external system).
    if (/^\$2[aby]\$/.test(stored)) {
      return await bcrypt.compare(password, stored);
    }

    const [scheme, saltHex, hashHex] = stored.split("$");
    if (scheme !== "scrypt" || !saltHex || !hashHex) return false;

    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    if (expected.length !== LEGACY_KEY_LENGTH) return false;

    const derived = (await scrypt(password, salt, expected.length)) as Buffer;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/** True when a stored hash should be upgraded after a successful sign-in. */
export function needsRehash(stored: string) {
  return !stored.startsWith("bcrypt$");
}

export function isStrongEnoughPassword(password: string) {
  if (password.length < 8) return false;
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((pattern) =>
    pattern.test(password),
  ).length;
  return classes >= 2 || password.length >= 12;
}

export function randomResetToken() {
  return randomBytes(32).toString("base64url");
}

export function hashResetToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}
