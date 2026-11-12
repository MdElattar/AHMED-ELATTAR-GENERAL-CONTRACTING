import { NextResponse, connection, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { isConsultationStatus } from "@/lib/consultation";
import { listConsultations, recordAudit, updateConsultationStatus } from "@/lib/db";
import { dispatchAdminAlert } from "@/lib/notifications";
import {
  NO_STORE_HEADERS,
  clientIp,
  isSameOrigin,
  readJsonBody,
} from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";
import { cleanString, isPlainObject } from "@/lib/security/validation";

function unauthorized() {
  return NextResponse.json(
    { error: "unauthorized" },
    { status: 401, headers: NO_STORE_HEADERS },
  );
}

export async function GET() {
  await connection();
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const consultations = await listConsultations(300);
  return NextResponse.json({ consultations }, { headers: NO_STORE_HEADERS });
}

export async function PATCH(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const session = await requireAdmin();
  if (!session) return unauthorized();

  const limited = rateLimit(`admin-consultations:${clientIp(request)}`, 90, 60 * 1000);
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

  const id = cleanString(body.id, 80);
  const status = body.status;
  if (!id || !isConsultationStatus(status)) {
    return NextResponse.json(
      { error: "invalid_input" },
      { status: 422, headers: NO_STORE_HEADERS },
    );
  }

  const consultation = await updateConsultationStatus(id, status);
  if (!consultation) {
    return NextResponse.json(
      { error: "not_found" },
      { status: 404, headers: NO_STORE_HEADERS },
    );
  }

  await recordAudit({
    actor: session.email,
    action: `consultation.${status}`,
    entity: "consultation",
    entityId: consultation.id,
    meta: { reference: consultation.reference, date: consultation.date, slot: consultation.slot },
    ip: clientIp(request),
  });

  if (status === "confirmed" || status === "cancelled") {
    await dispatchAdminAlert({
      title: `Consultation ${status}`,
      message: `${consultation.reference} · ${consultation.name}`,
      meta: {
        Date: consultation.date,
        Slot: consultation.slot,
        Mode: consultation.mode,
      },
    });
  }

  return NextResponse.json({ consultation }, { headers: NO_STORE_HEADERS });
}
