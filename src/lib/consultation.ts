/**
 * Shared rules for the VIP executive consultation desk.
 *
 * The same slot list and date window power the public scheduler, the
 * availability endpoint, and the admin boardroom calendar. Keeping them in one
 * dependency-free module avoids a client/server drift in what can be booked.
 */

export const CONSULTATION_SLOTS = ["10:00", "11:30", "13:00", "15:00", "16:30"] as const;
export type ConsultationSlot = (typeof CONSULTATION_SLOTS)[number];

export const CONSULTATION_MODES = ["boardroom", "video", "site"] as const;
export type ConsultationMode = (typeof CONSULTATION_MODES)[number];

export const CONSULTATION_STATUSES = [
  "requested",
  "confirmed",
  "completed",
  "cancelled",
] as const;
export type ConsultationStatus = (typeof CONSULTATION_STATUSES)[number];

export const CONSULTATION_WINDOW_DAYS = 90;

export function isConsultationSlot(value: unknown): value is ConsultationSlot {
  return typeof value === "string" && (CONSULTATION_SLOTS as readonly string[]).includes(value);
}

export function isConsultationMode(value: unknown): value is ConsultationMode {
  return typeof value === "string" && (CONSULTATION_MODES as readonly string[]).includes(value);
}

export function isConsultationStatus(value: unknown): value is ConsultationStatus {
  return typeof value === "string" && (CONSULTATION_STATUSES as readonly string[]).includes(value);
}

/** True when `value` is a real YYYY-MM-DD calendar date. */
export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/**
 * The boardroom runs Sunday–Thursday. A request may be placed today for a slot
 * later today (the concierge confirms by phone), but never in the past or more
 * than one quarter ahead.
 */
export function isConsultationDateAllowed(value: string, reference = new Date()): boolean {
  if (!isCalendarDate(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`).getTime();
  const today = Date.UTC(
    reference.getUTCFullYear(),
    reference.getUTCMonth(),
    reference.getUTCDate(),
  );
  const limit = today + CONSULTATION_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  return date >= today && date <= limit;
}

export type ConsultationDay = {
  /** YYYY-MM-DD */
  value: string;
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
};

/** Upcoming working days (Sunday–Thursday) for the scheduler. */
export function nextConsultationDates(count = 21, reference = new Date()): ConsultationDay[] {
  const days: ConsultationDay[] = [];
  const cursor = new Date(
    Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), reference.getUTCDate()),
  );

  while (days.length < count) {
    const weekday = cursor.getUTCDay();
    if (weekday !== 5 && weekday !== 6) {
      days.push({ value: cursor.toISOString().slice(0, 10), weekday });
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return days;
}
