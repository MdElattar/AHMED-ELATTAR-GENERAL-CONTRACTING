import { NextResponse } from "next/server";
import { NO_STORE_HEADERS } from "@/lib/security/http";

/**
 * Returned when the deployment cannot sign sessions (for example a missing
 * AUTH_SECRET on Vercel). A JSON 503 keeps the client in control instead of
 * surfacing an opaque "Something went wrong" HTML error page.
 */
export function authUnavailable() {
  return NextResponse.json(
    { error: "auth_unavailable" },
    { status: 503, headers: NO_STORE_HEADERS },
  );
}

export function isAuthConfigError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { name?: unknown }).name === "AuthConfigError"
  );
}
