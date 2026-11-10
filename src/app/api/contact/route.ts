import { NextResponse, type NextRequest } from "next/server";
import { services } from "@/data/services";
import { randomReference } from "@/lib/auth/token";
import {
  NO_STORE_HEADERS,
  clientIp,
  isSameOrigin,
  readJsonBody,
} from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";
import {
  cleanMultiline,
  cleanString,
  isDisplayName,
  isEmail,
  isPhone,
  isPlainObject,
  normalizeEmail,
} from "@/lib/security/validation";

const allowedServices = new Set(services.map((service) => service.slug));
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

  const name = cleanString(body.name, 120);
  const email = normalizeEmail(body.email);
  const phone = cleanString(body.phone, 40);
  const company = cleanString(body.company, 160);
  const service = cleanString(body.service, 80);
  const projectType = cleanString(body.projectType, 120);
  const location = cleanString(body.location, 160);
  const message = cleanMultiline(body.message, 4000);
  const consent = body.consent === true;
  const files = fileMetadata(body.files);

  if (
    !isDisplayName(name) ||
    !isEmail(email) ||
    !isPhone(phone) ||
    !service ||
    !allowedServices.has(service) ||
    !projectType ||
    !location ||
    !message ||
    !consent
  ) {
    return NextResponse.json(
      { error: "invalid_input" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  // This endpoint deliberately does not persist the submission. It validates
  // and acknowledges the request; the production CRM/email integration can be
  // attached here without changing the public contract.
  return NextResponse.json(
    {
      ok: true,
      reference: randomReference("ALT"),
      filesReceived: files.length,
      ...(company ? { company } : {}),
    },
    { status: 201, headers: NO_STORE_HEADERS },
  );
}
