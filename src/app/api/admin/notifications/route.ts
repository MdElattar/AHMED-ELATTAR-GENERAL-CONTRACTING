import { NextResponse, connection, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { dispatchAdminAlert, notificationConfig } from "@/lib/notifications";
import {
  NO_STORE_HEADERS,
  clientIp,
  isSameOrigin,
  readJsonBody,
} from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";
import { adminNotificationSchema } from "@/lib/security/schemas";
import { isPlainObject } from "@/lib/security/validation";

export async function GET() {
  await connection();
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  return NextResponse.json({ config: notificationConfig() }, { headers: NO_STORE_HEADERS });
}

export async function POST(request: NextRequest) {
  await connection();
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  const limited = rateLimit(`admin-notify:${clientIp(request)}`, 12, 10 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited", retryAfter: limited.retryAfter },
      { status: 429, headers: NO_STORE_HEADERS },
    );
  }

  const body = await readJsonBody(request, 8_000);
  if (!isPlainObject(body)) {
    return NextResponse.json(
      { error: "invalid_body" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const parsed = adminNotificationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues.map((issue) => issue.message) },
      { status: 422, headers: NO_STORE_HEADERS },
    );
  }

  const data = parsed.data;
  const channels =
    data.channel === "all" ? (["email", "whatsapp"] as const) : ([data.channel] as const);

  const result = await dispatchAdminAlert({
    title: "Admin test dispatch",
    message: data.message || "This is a live test of the Alattar alert channel.",
    meta: {
      TriggeredBy: session.email,
      Environment: process.env.NODE_ENV ?? "development",
    },
    channels: [...channels],
  });

  return NextResponse.json({ result, config: notificationConfig() }, { headers: NO_STORE_HEADERS });
}
