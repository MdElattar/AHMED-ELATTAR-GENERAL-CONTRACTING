import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import { AuthConfigError } from "@/lib/auth/token";

export const WEBAUTHN_COOKIE = "alattar_webauthn";
export const WEBAUTHN_CHALLENGE_TTL_SECONDS = 5 * 60;

export const RP_NAME = "Ahmed Elattar General Contracting";

export type WebAuthnChallengeKind = "registration" | "authentication";

type ChallengePayload = {
  challenge: string;
  kind: WebAuthnChallengeKind;
  email?: string;
  exp: number;
};

function secret() {
  const value = (process.env.AUTH_SECRET ?? process.env.JWT_SECRET)?.trim();
  if (value && value.length >= 32) return value;

  if (process.env.NODE_ENV === "production") {
    throw new AuthConfigError();
  }

  return "alattar-development-webauthn-secret-change-me";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function encode(payload: ChallengePayload) {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${sign(body)}`;
}

function decode(value: string): ChallengePayload | null {
  try {
    const [body, signature] = value.split(".");
    if (!body || !signature) return null;

    const expected = Buffer.from(sign(body), "utf8");
    const actual = Buffer.from(signature, "utf8");
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      return null;
    }

    const parsed: unknown = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    );
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return null;
    }

    const record = parsed as Record<string, unknown>;
    const challenge = typeof record.challenge === "string" ? record.challenge : "";
    const kind =
      record.kind === "registration" || record.kind === "authentication"
        ? record.kind
        : null;
    const exp = typeof record.exp === "number" ? record.exp : 0;
    const email =
      typeof record.email === "string" ? record.email.trim().toLowerCase() : undefined;

    if (!challenge || !kind) return null;
    if (exp <= Math.floor(Date.now() / 1000)) return null;

    return { challenge, kind, ...(email ? { email } : {}), exp };
  } catch {
    return null;
  }
}

/**
 * A fresh challenge is generated for every ceremony and stored in a signed,
 * httpOnly cookie. It is never accepted from the browser request body.
 */
export function createWebAuthnChallenge(
  response: NextResponse,
  kind: WebAuthnChallengeKind,
  email?: string,
): string {
  const challenge = randomBytes(32).toString("base64url");
  const payload: ChallengePayload = {
    challenge,
    kind,
    ...(email ? { email: email.trim().toLowerCase() } : {}),
    exp: Math.floor(Date.now() / 1000) + WEBAUTHN_CHALLENGE_TTL_SECONDS,
  };

  response.cookies.set({
    name: WEBAUTHN_COOKIE,
    value: encode(payload),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: WEBAUTHN_CHALLENGE_TTL_SECONDS,
  });

  return challenge;
}

export function readWebAuthnChallenge(
  request: NextRequest,
  kind: WebAuthnChallengeKind,
): ChallengePayload | null {
  const value = request.cookies.get(WEBAUTHN_COOKIE)?.value;
  if (!value) return null;

  const payload = decode(value);
  if (!payload || payload.kind !== kind) return null;
  return payload;
}

export function clearWebAuthnChallenge(response: NextResponse) {
  response.cookies.set({
    name: WEBAUTHN_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

/**
 * The RP ID is the registrable domain without protocol or port. Deployments
 * can pin it with WEBAUTHN_RP_ID; local development uses localhost.
 */
function hostnameFrom(value: string | null) {
  if (!value) return "";
  try {
    return new URL(value.includes("://") ? value : `http://${value}`).hostname;
  } catch {
    return "";
  }
}

export function relyingParty(request: NextRequest) {
  const configured = process.env.WEBAUTHN_RP_ID?.trim();
  const forwardedHost =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const hostname =
    hostnameFrom(forwardedHost) || hostnameFrom(request.nextUrl.host) || request.nextUrl.hostname;
  const origin =
    request.headers.get("origin") ||
    (forwardedProto && forwardedHost
      ? `${forwardedProto.split(",")[0].trim()}://${forwardedHost.split(",")[0].trim()}`
      : request.nextUrl.origin);

  return { rpID: configured || hostname, origin, rpName: RP_NAME };
}

export function webauthnUserID(userId: string, email: string) {
  return new Uint8Array(
    createHash("sha256").update(userId || email.toLowerCase()).digest(),
  );
}
