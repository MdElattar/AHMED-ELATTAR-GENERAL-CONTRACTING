import { randomBytes } from "node:crypto";
import { hashResetToken } from "./password";

const BACKUP_CODE_COUNT = 10;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateBackupCodes(): string[] {
  return Array.from({ length: BACKUP_CODE_COUNT }, () => {
    const bytes = randomBytes(12);
    return [0, 4, 8]
      .map((offset) =>
        Array.from(bytes.subarray(offset, offset + 4))
          .map((byte) => ALPHABET[byte % ALPHABET.length])
          .join(""),
      )
      .join("-");
  });
}

export function hashBackupCode(code: string) {
  return hashResetToken(code.trim().toUpperCase());
}

export function normalizeBackupCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "-");
}
