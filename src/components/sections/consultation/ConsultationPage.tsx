"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  ShieldCheck,
  Video,
} from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { Field, Select, TextInput, Textarea } from "@/components/ui/Field";
import { Reveal } from "@/components/ui/Reveal";
import {
  CONSULTATION_SLOTS,
  type ConsultationDay,
  type ConsultationMode,
  type ConsultationSlot,
} from "@/lib/consultation";
import { cn } from "@/lib/utils";

const copy = {
  ar: {
    eyebrow: "مكتب المدير التنفيذي",
    title: "استشارة تنفيذية خاصة.",
    description:
      "احجز جلسة مباشرة مع مجلس الإدارة أو فريق القيادة في مقر الرياض. نخصص لك مستشاراً تنفيذياً وملفاً تحضيرياً قبل الموعد.",
    formTitle: "احجز موعدك",
    formText: "اختر اليوم والقناة، وسنؤكد الموعد هاتفياً خلال ساعات العمل.",
    name: "الاسم الكامل",
    email: "البريد الإلكتروني",
    phone: "رقم الهاتف",
    company: "الشركة",
    topic: "موضوع الجلسة",
    date: "اليوم",
    slot: "الوقت",
    mode: "قناة الاجتماع",
    notes: "سياق إضافي",
    notesPlaceholder: "نبذة عن المشروع، الموقع، أو القرار الذي تريد مناقشته…",
    submit: "تأكيد طلب الاستشارة",
    working: "جارٍ إرسال الطلب…",
    boardroom: "مجلس الإدارة",
    video: "اجتماع مرئي",
    site: "زيارة موقع",
    boardroomNote: "مقر الرياض · الدور ٢٤",
    videoNote: "رابط مشفّر يُرسل بعد التأكيد",
    siteNote: "فريق ميداني في الرياض وجدة",
    booked: "محجوز",
    available: "متاح",
    allBooked: "كل المواعيد محجوزة في هذا اليوم. اختر يوماً آخر أو تواصل معنا.",
    topics: {
      development: "تطوير جديد",
      expansion: "توسّع أو مرحلة ثانية",
      advisory: "استشارة هندسية / مالية",
      partnership: "شراكة أو تحالف",
      other: "موضوع آخر",
    },
    boardroomTitle: "قاعة المجلس",
    boardroomText:
      "جلسة مغلقة في مقر الشركة بالرياض، بحضور مدير تنفيذي ومدير مشروع. تتضمن مراجعة أولية للمخططات ونطاق الاستثمار.",
    address: "طريق الملك فهد · الرياض",
    capacity: "حتى ٨ مشاركين",
    concierge: "مكتب الاستقبال التنفيذي",
    protocol: "بروتوكول الجلسة",
    steps: [
      { title: "قبل الموعد", text: "نراجع ملفك ونرسل أجندة الجلسة والأسئلة المحورية." },
      { title: "أثناء الجلسة", text: "٦٠ دقيقة مع القيادة التنفيذية، ومخرجات مكتوبة في اليوم نفسه." },
      { title: "بعد الجلسة", text: "خطة عمل، نطاق أولي، وترشيح الفريق المناسب للمشروع." },
    ],
    confirmation: "تم استلام طلبك",
    confirmationText: "سيتواصل معك مكتب المدير التنفيذي لتأكيد الموعد. احتفظ بالمرجع أدناه.",
    reference: "المرجع",
    addCalendar: "أضف إلى التقويم",
    another: "حجز موعد آخر",
    error: {
      invalid_input: "تحقق من الحقول المطلوبة.",
      invalid_date: "اليوم المختار غير متاح.",
      slot_unavailable: "هذا الموعد حُجز للتو. اختر وقتاً آخر.",
      rate_limited: "طلبات كثيرة. حاول بعد قليل.",
      server_error: "تعذّر إرسال الطلب. حاول مرة أخرى.",
      generic: "تعذّر إرسال الطلب.",
    },
    timezone: "بتوقيت الرياض",
  },
  en: {
    eyebrow: "Executive office",
    title: "A private executive consultation.",
    description:
      "Book a direct session with the board or leadership team at our Riyadh headquarters. We assign an executive adviser and prepare a briefing file before you arrive.",
    formTitle: "Reserve your session",
    formText: "Choose a day and channel; the executive office confirms by phone during business hours.",
    name: "Full name",
    email: "Email",
    phone: "Phone",
    company: "Company",
    topic: "Session topic",
    date: "Day",
    slot: "Time",
    mode: "Meeting channel",
    notes: "Additional context",
    notesPlaceholder: "A short brief on the project, site, or decision you want to discuss…",
    submit: "Request consultation",
    working: "Sending request…",
    boardroom: "Boardroom",
    video: "Video call",
    site: "Site visit",
    boardroomNote: "Riyadh HQ · Level 24",
    videoNote: "Encrypted link after confirmation",
    siteNote: "Field team in Riyadh & Jeddah",
    booked: "Booked",
    available: "Available",
    allBooked: "All slots are booked on this day. Choose another day or contact us directly.",
    topics: {
      development: "New development",
      expansion: "Expansion / phase two",
      advisory: "Engineering / financial advisory",
      partnership: "Partnership or alliance",
      other: "Another topic",
    },
    boardroomTitle: "The boardroom",
    boardroomText:
      "A closed session at our Riyadh headquarters with an executive director and project lead. Includes a preliminary review of drawings and investment scope.",
    address: "King Fahd Road · Riyadh",
    capacity: "Up to 8 participants",
    concierge: "Executive concierge",
    protocol: "Session protocol",
    steps: [
      { title: "Before", text: "We review your file and send the agenda and key questions." },
      { title: "During", text: "60 minutes with executive leadership, with written outcomes the same day." },
      { title: "After", text: "An action plan, preliminary scope, and the right delivery team." },
    ],
    confirmation: "Request received",
    confirmationText: "The executive office will call to confirm. Keep the reference below.",
    reference: "Reference",
    addCalendar: "Add to calendar",
    another: "Book another session",
    error: {
      invalid_input: "Check the required fields.",
      invalid_date: "The selected day is not available.",
      slot_unavailable: "That slot was just booked. Choose another time.",
      rate_limited: "Too many requests. Try again shortly.",
      server_error: "The request could not be sent. Try again.",
      generic: "The request could not be sent.",
    },
    timezone: "Riyadh time",
  },
};

type Confirmation = {
  reference: string;
  date: string;
  slot: string;
  mode: ConsultationMode;
  status: string;
};

const modeIcons = {
  boardroom: Building2,
  video: Video,
  site: MapPin,
} as const;

function dateLabel(value: string, locale: "ar" | "en") {
  const date = new Date(`${value}T12:00:00.000Z`);
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(date);
}

function calendarFile(confirmation: Confirmation, title: string) {
  const date = confirmation.date.replace(/-/g, "");
  const [hour, minute] = confirmation.slot.split(":").map(Number);
  const endHour = String((hour + 1) % 24).padStart(2, "0");
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ahmed Elattar//Consultation//EN",
    "BEGIN:VEVENT",
    `UID:${confirmation.reference}@alattar.sa`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=Asia/Riyadh:${date}T${String(hour).padStart(2, "0")}${String(minute).padStart(2, "0")}00`,
    `DTEND;TZID=Asia/Riyadh:${date}T${endHour}${String(minute).padStart(2, "0")}00`,
    `SUMMARY:${title}`,
    "LOCATION:Ahmed Elattar HQ, King Fahd Road, Riyadh",
    `DESCRIPTION:Reference ${confirmation.reference}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function ConsultationPage({ dates }: { dates: ConsultationDay[] }) {
  const { locale } = useI18n();
  const c = copy[locale];
  const [date, setDate] = useState(dates[0]?.value ?? "");
  const [slot, setSlot] = useState<ConsultationSlot>("10:00");
  const [mode, setMode] = useState<ConsultationMode>("boardroom");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [topic, setTopic] = useState("development");
  const [notes, setNotes] = useState("");
  const [availability, setAvailability] = useState<{ date: string; booked: string[] } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  useEffect(() => {
    if (!date || mode !== "boardroom") return;

    let cancelled = false;
    fetch(`/api/consultation?date=${encodeURIComponent(date)}&mode=boardroom`)
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { bookedSlots?: string[] } | null) => {
        if (cancelled) return;
        const slots = payload?.bookedSlots ?? [];
        setAvailability({ date, booked: slots });
        setSlot((current) => {
          if (!slots.includes(current)) return current;
          return CONSULTATION_SLOTS.find((item) => !slots.includes(item)) ?? current;
        });
      })
      .catch(() => {
        if (!cancelled) setAvailability({ date, booked: [] });
      });

    return () => {
      cancelled = true;
    };
  }, [date, mode]);

  const booked = availability?.date === date ? availability.booked : [];
  const loadingSlots = mode === "boardroom" && Boolean(date) && availability?.date !== date;

  const topicOptions = useMemo(
    () =>
      Object.entries(c.topics).map(([value, label]) => ({
        value,
        label,
      })),
    [c.topics],
  );

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, company, topic, date, slot, mode, notes }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        const code = payload?.error ?? "generic";
        setError(c.error[code as keyof typeof c.error] ?? c.error.generic);
        if (code === "slot_unavailable") {
          setAvailability((current) => ({
            date,
            booked: [
              ...new Set([...(current?.date === date ? current.booked : []), slot]),
            ],
          }));
        }
        return;
      }

      const payload = (await response.json()) as { consultation: Confirmation };
      setConfirmation(payload.consultation);
    } catch {
      setError(c.error.generic);
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setConfirmation(null);
    setNotes("");
    setError("");
  };

  return (
    <main className="bg-obsidian text-ivory">
      <section className="relative overflow-hidden border-b border-white/10 pb-16 pt-36 sm:pb-20 sm:pt-44">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_0%,rgba(212,175,55,0.12),transparent_55%)]" />
        <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-25" />
        <div className="container-lux relative">
          <Reveal>
            <span className="eyebrow">{c.eyebrow}</span>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="display-title mt-6 max-w-4xl text-[clamp(2.6rem,6vw,6rem)] text-ivory">
              {c.title}
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-5 max-w-2xl text-[0.95rem] leading-[1.95] text-ivory/50">
              {c.description}
            </p>
          </Reveal>
          <Reveal delay={220}>
            <div className="mt-8 flex flex-wrap items-center gap-5 text-[0.55rem] uppercase tracking-[0.16em] text-ivory/35">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-gold" />
                {c.concierge}
              </span>
              <span className="flex items-center gap-2">
                <Clock3 className="h-3.5 w-3.5 text-gold" />
                {c.timezone}
              </span>
              <span className="flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5 text-gold" />
                {c.capacity}
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="relative overflow-hidden py-16 sm:py-24">
        <div className="container-lux grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="border border-white/10 bg-coal p-6 sm:p-10">
            {confirmation ? (
              <div className="flex min-h-[34rem] flex-col justify-center">
                <span className="flex h-14 w-14 items-center justify-center border border-gold/40 bg-gold/10 text-gold">
                  <CheckCircle2 className="h-6 w-6" />
                </span>
                <h2 className="display-title mt-6 text-[clamp(2rem,4vw,3.4rem)] text-ivory">
                  {c.confirmation}
                </h2>
                <p className="mt-4 max-w-xl text-[0.86rem] leading-[1.9] text-ivory/50">
                  {c.confirmationText}
                </p>
                <dl className="mt-8 grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2">
                  {[
                    [c.reference, confirmation.reference],
                    [c.date, dateLabel(confirmation.date, locale)],
                    [c.slot, confirmation.slot],
                    [c.mode, c[confirmation.mode]],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-obsidian p-4">
                      <dt className="text-[0.48rem] uppercase tracking-[0.14em] text-ivory/30">
                        {label}
                      </dt>
                      <dd className="mt-1.5 text-[0.78rem] text-ivory/75">{value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const ics = calendarFile(confirmation, c.title);
                      const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
                      const anchor = document.createElement("a");
                      anchor.href = url;
                      anchor.download = `alattar-consultation-${confirmation.reference}.ics`;
                      anchor.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="inline-flex h-11 items-center gap-2 bg-gold px-5 text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-obsidian transition-colors hover:bg-gold-light"
                  >
                    <CalendarDays className="h-4 w-4" />
                    {c.addCalendar}
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    className="inline-flex h-11 items-center gap-2 border border-white/15 px-5 text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-ivory/60 transition-colors hover:border-gold/40 hover:text-gold"
                  >
                    {c.another}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={submit}>
                <span className="eyebrow">{c.formTitle}</span>
                <p className="mt-3 max-w-xl text-[0.82rem] leading-[1.9] text-ivory/45">
                  {c.formText}
                </p>

                <div className="mt-7 grid gap-5 sm:grid-cols-2">
                  <Field label={c.name} htmlFor="consultation-name" required>
                    <TextInput
                      id="consultation-name"
                      autoComplete="name"
                      required
                      minLength={2}
                      maxLength={120}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                  </Field>
                  <Field label={c.email} htmlFor="consultation-email" required>
                    <TextInput
                      id="consultation-email"
                      type="email"
                      autoComplete="email"
                      required
                      maxLength={254}
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </Field>
                  <Field label={c.phone} htmlFor="consultation-phone" required>
                    <TextInput
                      id="consultation-phone"
                      type="tel"
                      autoComplete="tel"
                      required
                      maxLength={40}
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                    />
                  </Field>
                  <Field label={c.company} htmlFor="consultation-company">
                    <TextInput
                      id="consultation-company"
                      autoComplete="organization"
                      maxLength={160}
                      value={company}
                      onChange={(event) => setCompany(event.target.value)}
                    />
                  </Field>
                  <Field label={c.topic} htmlFor="consultation-topic" required className="sm:col-span-2">
                    <Select
                      id="consultation-topic"
                      value={topic}
                      onChange={(event) => setTopic(event.target.value)}
                      options={topicOptions}
                    />
                  </Field>
                </div>

                <div className="mt-7">
                  <p className="mb-3 text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-ivory/45">
                    {c.mode}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {(["boardroom", "video", "site"] as ConsultationMode[]).map((item) => {
                      const Icon = modeIcons[item];
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setMode(item)}
                          aria-pressed={mode === item}
                          className={cn(
                            "flex flex-col items-start gap-2 border p-3 text-start transition-colors",
                            mode === item
                              ? "border-gold bg-gold/[0.06]"
                              : "border-white/10 hover:border-white/25",
                          )}
                        >
                          <Icon className={cn("h-4 w-4", mode === item ? "text-gold" : "text-ivory/35")} />
                          <span className={cn("text-[0.68rem]", mode === item ? "text-ivory" : "text-ivory/60")}>
                            {c[item]}
                          </span>
                          <span className="text-[0.5rem] leading-relaxed text-ivory/30">
                            {c[`${item}Note` as "boardroomNote" | "videoNote" | "siteNote"]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-7 grid gap-5 sm:grid-cols-2">
                  <Field label={c.date} htmlFor="consultation-date" required>
                    <Select
                      id="consultation-date"
                      value={date}
                      onChange={(event) => setDate(event.target.value)}
                      options={dates.map((day) => ({
                        value: day.value,
                        label: dateLabel(day.value, locale),
                      }))}
                    />
                  </Field>
                  <div>
                    <p className="mb-2 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-ivory/45">
                      {c.slot}
                    </p>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                      {CONSULTATION_SLOTS.map((item) => {
                        const isBooked = mode === "boardroom" && booked.includes(item);
                        return (
                          <button
                            key={item}
                            type="button"
                            disabled={isBooked || loadingSlots}
                            onClick={() => setSlot(item)}
                            aria-pressed={slot === item}
                            className={cn(
                              "h-9 border text-[0.58rem] tabular transition-colors",
                              isBooked
                                ? "cursor-not-allowed border-white/5 text-ivory/20 line-through"
                                : slot === item
                                  ? "border-gold bg-gold text-obsidian"
                                  : "border-white/10 text-ivory/55 hover:border-gold/40 hover:text-gold",
                            )}
                          >
                            {item}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-[0.5rem] text-ivory/25">
                      {loadingSlots ? "…" : mode === "boardroom" ? `${booked.length} ${c.booked}` : c.available}
                    </p>
                  </div>
                </div>

                {mode === "boardroom" && booked.length >= CONSULTATION_SLOTS.length ? (
                  <p className="mt-4 border border-[#d98572]/30 bg-[#d98572]/10 px-4 py-3 text-[0.68rem] text-[#e6a99a]">
                    {c.allBooked}
                  </p>
                ) : null}

                <Field label={c.notes} htmlFor="consultation-notes" className="mt-6">
                  <Textarea
                    id="consultation-notes"
                    rows={4}
                    maxLength={2000}
                    placeholder={c.notesPlaceholder}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                  />
                </Field>

                {error ? (
                  <p
                    role="alert"
                    className="mt-5 border border-[#d98572]/30 bg-[#d98572]/10 px-4 py-3 text-[0.7rem] text-[#e6a99a]"
                  >
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={busy || !date || (mode === "boardroom" && booked.includes(slot))}
                  className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 bg-gold px-6 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-obsidian transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />}
                  {busy ? c.working : c.submit}
                </button>
              </form>
            )}
          </div>

          <aside className="flex flex-col gap-5">
            <div className="relative overflow-hidden border border-white/10 bg-obsidian p-6 sm:p-8">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(212,175,55,0.12),transparent_60%)]" />
              <span className="relative flex h-11 w-11 items-center justify-center border border-gold/40 bg-gold/10 text-gold">
                <Building2 className="h-5 w-5" />
              </span>
              <h2 className="relative mt-5 font-display text-2xl text-ivory">{c.boardroomTitle}</h2>
              <p className="relative mt-3 text-[0.76rem] leading-[1.9] text-ivory/45">
                {c.boardroomText}
              </p>
              <dl className="relative mt-6 space-y-3 border-t border-white/10 pt-5">
                {[
                  [c.address, "King Fahd Road, Riyadh"],
                  [c.capacity, "8"],
                  [c.concierge, "executive@alattar.sa"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4">
                    <dt className="text-[0.52rem] uppercase tracking-[0.14em] text-ivory/30">{label}</dt>
                    <dd className="text-end text-[0.68rem] text-ivory/65">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="border border-white/10 bg-coal p-6 sm:p-8">
              <span className="text-[0.52rem] uppercase tracking-[0.16em] text-gold">{c.protocol}</span>
              <ol className="mt-5 space-y-5">
                {c.steps.map((step, index) => (
                  <li key={step.title} className="flex gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-white/10 font-mono text-[0.58rem] text-gold">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>
                      <span className="block text-[0.72rem] text-ivory/75">{step.title}</span>
                      <span className="mt-1 block text-[0.64rem] leading-relaxed text-ivory/35">
                        {step.text}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
