import { NextResponse, connection, type NextRequest } from "next/server";
import {
  CONSULTATION_SLOTS,
  isCalendarDate,
  isConsultationDateAllowed,
  isConsultationMode,
} from "@/lib/consultation";
import { createConsultation, listBookedSlots, recordAudit } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { dispatchAdminAlert } from "@/lib/notifications";
import {
  NO_STORE_HEADERS,
  clientIp,
  isSameOrigin,
  readJsonBody,
} from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";
import { consultationSchema } from "@/lib/security/schemas";
import { isPlainObject } from "@/lib/security/validation";

export async function GET(request: NextRequest) {
  await connection();

  const date = request.nextUrl.searchParams.get("date") ?? "";
  const modeParam = request.nextUrl.searchParams.get("mode") ?? "boardroom";
  const mode = isConsultationMode(modeParam) ? modeParam : "boardroom";

  if (!isCalendarDate(date)) {
    return NextResponse.json(
      { error: "invalid_date" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const bookedSlots = await listBookedSlots(date, mode);
  return NextResponse.json(
    { date, mode, slots: CONSULTATION_SLOTS, bookedSlots },
    { headers: NO_STORE_HEADERS },
  );
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const limited = rateLimit(`consultation:${clientIp(request)}`, 6, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited", retryAfter: limited.retryAfter },
      { status: 429, headers: NO_STORE_HEADERS },
    );
  }

  const body = await readJsonBody(request, 16_000);
  if (!isPlainObject(body)) {
    return NextResponse.json(
      { error: "invalid_body" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const parsed = consultationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues.map((issue) => issue.message) },
      { status: 422, headers: NO_STORE_HEADERS },
    );
  }

  const data = parsed.data;
  if (!isConsultationDateAllowed(data.date)) {
    return NextResponse.json(
      { error: "invalid_date" },
      { status: 422, headers: NO_STORE_HEADERS },
    );
  }

  if (data.mode === "boardroom") {
    const booked = await listBookedSlots(data.date, "boardroom");
    if (booked.includes(data.slot)) {
      return NextResponse.json(
        { error: "slot_unavailable" },
        { status: 409, headers: NO_STORE_HEADERS },
      );
    }
  }

  try {
    const consultation = await createConsultation(data);
    const ip = clientIp(request);
    const site = process.env.NEXT_PUBLIC_SITE_URL?.trim() || request.nextUrl.origin;

    await recordAudit({
      actor: data.email,
      action: "consultation.requested",
      entity: "consultation",
      entityId: consultation.id,
      meta: {
        reference: consultation.reference,
        date: consultation.date,
        slot: consultation.slot,
        mode: consultation.mode,
      },
      ip,
    });

    await Promise.allSettled([
      dispatchAdminAlert({
        title: "VIP consultation requested",
        message: `${data.name} requested a ${data.mode} consultation.`,
        url: `${site.replace(/\/$/, "")}/admin`,
        meta: {
          Reference: consultation.reference,
          Date: consultation.date,
          Slot: consultation.slot,
          Topic: data.topic,
          Email: data.email,
          Phone: data.phone,
        },
      }),
      sendEmail({
        to: data.email,
        subject: `تم استلام طلب الاستشارة ${consultation.reference} · Consultation received`,
        text: [
          `مرحباً ${data.name},`,
          `استلمنا طلب استشارتك (${consultation.reference}) بتاريخ ${consultation.date} الساعة ${consultation.slot}.`,
          "سيتواصل معك مكتب المدير التنفيذي لتأكيد الموعد خلال ساعات العمل.",
          "",
          `Hello ${data.name},`,
          `We received your consultation request (${consultation.reference}) on ${consultation.date} at ${consultation.slot}.`,
          "The executive office will call to confirm during business hours.",
        ].join("\n"),
      }),
    ]);

    return NextResponse.json(
      {
        consultation: {
          reference: consultation.reference,
          date: consultation.date,
          slot: consultation.slot,
          mode: consultation.mode,
          status: consultation.status,
        },
      },
      { status: 201, headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    console.error("[consultation] create failed", error);
    return NextResponse.json(
      { error: "server_error" },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
