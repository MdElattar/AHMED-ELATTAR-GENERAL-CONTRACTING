import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { AuthConfigError } from "@/lib/auth/token";

function otpSecret() {
  const secret = (
    process.env.AUTH_SECRET ??
    process.env.JWT_SECRET ??
    process.env.NEXTAUTH_SECRET
  )?.trim();
  if (secret && secret.length >= 32) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new AuthConfigError();
  }
  return "alattar-development-otp-secret-change-me";
}

export function generateOtp() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashOtp(email: string, code: string) {
  return createHmac("sha256", otpSecret())
    .update(`${email.trim().toLowerCase()}:${code}`)
    .digest("hex");
}

export function verifyOtpHash(email: string, code: string, expectedHash: string) {
  try {
    const actual = Buffer.from(hashOtp(email, code), "hex");
    const expected = Buffer.from(expectedHash, "hex");
    if (actual.length !== expected.length || actual.length === 0) return false;
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export const OTP_TTL_SECONDS = 10 * 60;
export const OTP_MAX_ATTEMPTS = 5;
