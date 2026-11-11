import type { NextResponse } from "next/server";
import { RESET_COOKIE, RESET_TTL_SECONDS, SESSION_COOKIE } from "./token";

export function setSessionCookie(
  response: NextResponse,
  token: string,
  maxAge?: number,
) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    ...(maxAge ? { maxAge } : {}),
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export function setResetCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: RESET_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: RESET_TTL_SECONDS,
  });
}

export function clearResetCookie(response: NextResponse) {
  response.cookies.set({
    name: RESET_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}
