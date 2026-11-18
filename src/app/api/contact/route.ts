import { NextResponse, type NextRequest } from "next/server";
import { randomReference } from "@/lib/auth/token";
import { createInquiry, listServiceSlugs, recordAudit } from "@/lib/db";
import { dispatchAdminAlert } from "@/lib/notifications";
import {NO_STORE_HEADERS,
  clientIp,
  isSameOrigin,
  readJsonBody, safeLogError } from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";
import { contactSchema } from "@/lib/security/schemas";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const limited = rateLimit(`contact:${clientIp(request)}`, 6, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: { ...NO_STORE_HEADERS, "Retry-After": String(limited.retryAfter) },
      },
    );
  }

  const parsed = contactSchema.safeParse(await readJsonBody(request, 32_000));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const {
    name,
    email,
    phone,
    company,
    service,
    projectType,
    budget,
    location,
    message,
    consent,
    files,
  } = parsed.data;

  let allowedServices: string[] = [];
  try {
    allowedServices = await listServiceSlugs();
  } catch (error) {
    safeLogError("[contact] failed to load service catalogue", error);
    return NextResponse.json(
      { error: "server_error" },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }

  if (!allowedServices.includes(service) || !consent) {
    return NextResponse.json(
      { error: "invalid_input" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const reference = randomReference("ALT");

  try {
    await createInquiry({
      kind: "contact",
      name,
      email,
      phone,
      ...(company ? { company } : {}),
      service,
      projectType,
      ...(budget ? { budget } : {}),
      location,
      message,
      ...(files.length ? { files } : {}),
      reference,
    });
    await recordAudit({
      actor: email,
      action: "inquiry.created",
      entity: "inquiry",
      entityId: reference,
      ip: clientIp(request),
    });
  } catch (error) {
    safeLogError("[contact] failed to persist inquiry", error);
    return NextResponse.json(
      { error: "server_error" },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }

  await dispatchAdminAlert({
    title: "New project inquiry",
    message: `${name} submitted a ${projectType} inquiry for ${service}.`,
    meta: {
      Reference: reference,
      Email: email,
      Phone: phone,
      Budget: budget || "—",
      Location: location,
    },
    url: `${(process.env.NEXT_PUBLIC_SITE_URL?.trim() || request.nextUrl.origin).replace(/\/$/, "")}/admin`,
  });

  return NextResponse.json(
    {
      ok: true,
      reference,
      filesReceived: files.length,
      ...(company ? { company } : {}),
    },
    { status: 201, headers: NO_STORE_HEADERS },
  );
}
