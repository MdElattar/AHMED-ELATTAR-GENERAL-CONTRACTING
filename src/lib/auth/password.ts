import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

/**
 * Password hashing with Node's built-in scrypt.
 *
 * Format: `scrypt$<salt-hex>$<hash-hex>`. Keeping the parameters in the value
 * makes a future migration to argon2/bcrypt possible without invalidating
 * existing hashes.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const derived = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [scheme, saltHex, hashHex] = stored.split("$");
    if (scheme !== "scrypt" || !saltHex || !hashHex) return false;

    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    if (expected.length !== KEY_LENGTH) return false;

    const derived = (await scrypt(password, salt, expected.length)) as Buffer;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function isStrongEnoughPassword(password: string) {
  return password.length >= 8 && password.length <= 128;
}
