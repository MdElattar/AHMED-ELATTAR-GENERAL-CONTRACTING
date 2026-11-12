import { NextResponse, type NextRequest } from "next/server";
import { randomReference } from "@/lib/auth/token";
import { createInquiry, listServiceSlugs } from "@/lib/db";
import { dispatchAdminAlert } from "@/lib/notifications";
import {
  NO_STORE_HEADERS,
  clientIp,
  isSameOrigin,
  readJsonBody,
} from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";
import { contactSchema } from "@/lib/security/schemas";
import { cleanString, isPlainObject } from "@/lib/security/validation";

const MAX_FILE_SIZE = 25 * 1024 * 1024;

function fileMetadata(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 10)
    .map((item) => {
      if (!isPlainObject(item)) return null;
      const name = cleanString(item.name, 180);
      const size = typeof item.size === "number" && Number.isFinite(item.size) ? item.size : 0;
      const type = cleanString(item.type, 120);
      if (!name || size <= 0 || size > MAX_FILE_SIZE) return null;
      return { name, size, type };
    })
    .filter((item): item is { name: string; size: number; type: string } => item !== null);
}

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

  const body = await readJsonBody(request, 32_000);
  if (!isPlainObject(body)) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const { name, email, phone, company, service, projectType, budget, location, message } =
    parsed.data;
  const consent = body.consent === true;
  const files = fileMetadata(body.files);

  let allowedServices: string[] = [];
  try {
    allowedServices = await listServiceSlugs();
  } catch (error) {
    console.error("[contact] failed to load service catalogue", error);
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
  } catch (error) {
    console.error("[contact] failed to persist inquiry", error);
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
