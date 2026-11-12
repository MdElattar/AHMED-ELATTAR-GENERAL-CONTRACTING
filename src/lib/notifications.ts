import { sendEmail } from "@/lib/email";

export type AlertChannel = "email" | "whatsapp";
export type DispatchState = "sent" | "skipped" | "failed";

export type AdminAlert = {
  title: string;
  message: string;
  url?: string;
  meta?: Record<string, string | number | undefined>;
  channels?: AlertChannel[];
};

export type DispatchResult = {
  email: DispatchState;
  whatsapp: DispatchState;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function alertEmail() {
  return process.env.ADMIN_ALERT_EMAIL?.trim() || process.env.ADMIN_EMAIL?.trim() || "";
}

function whatsappWebhook() {
  return process.env.WHATSAPP_WEBHOOK_URL?.trim() || "";
}

function metaEnabled() {
  return Boolean(
    process.env.WHATSAPP_TOKEN?.trim() &&
      process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() &&
      process.env.WHATSAPP_TO?.trim(),
  );
}

export function notificationConfig() {
  return {
    email: {
      configured: Boolean(process.env.RESEND_API_KEY?.trim() && alertEmail()),
      recipient: alertEmail(),
    },
    whatsapp: {
      configured: Boolean(whatsappWebhook() || metaEnabled()),
      transport: whatsappWebhook() ? "webhook" : metaEnabled() ? "meta" : "none",
    },
  };
}

function alertText(alert: AdminAlert) {
  const lines = [alert.title, alert.message];
  for (const [key, value] of Object.entries(alert.meta ?? {})) {
    if (value !== undefined && value !== "") lines.push(`${key}: ${value}`);
  }
  if (alert.url) lines.push(alert.url);
  return lines.join("\n");
}

async function sendAlertEmail(alert: AdminAlert): Promise<DispatchState> {
  const to = alertEmail();
  if (!process.env.RESEND_API_KEY?.trim() || !to) return "skipped";

  const text = alertText(alert);
  const rows = Object.entries(alert.meta ?? {})
    .filter(([, value]) => value !== undefined && value !== "")
    .map(
      ([key, value]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:rgba(243,238,228,.42);font-size:12px">${escapeHtml(
          key,
        )}</td><td style="padding:6px 0;color:#f3eee4;font-size:12px">${escapeHtml(
          String(value),
        )}</td></tr>`,
    )
    .join("");

  const html = `
    <div dir="rtl" style="background:#060708;padding:36px 18px;font-family:Tahoma,Arial,sans-serif;color:#f3eee4">
      <div style="max-width:560px;margin:0 auto;border:1px solid rgba(184,134,11,.25);background:#0b0c0f;padding:30px">
        <p style="margin:0;color:#b8860b;font-size:11px;letter-spacing:2px">شركة أحمد العطار للمقاولات العامة</p>
        <h1 style="margin:16px 0 0;font-size:21px;font-weight:600">${escapeHtml(alert.title)}</h1>
        <p style="margin:12px 0 0;color:rgba(243,238,228,.66);font-size:13px;line-height:1.9">${escapeHtml(
          alert.message,
        )}</p>
        ${rows ? `<table style="margin:18px 0 0;border-top:1px solid rgba(255,255,255,.08);width:100%">${rows}</table>` : ""}
        ${
          alert.url
            ? `<p style="margin:22px 0 0"><a href="${escapeHtml(
                alert.url,
              )}" style="color:#c59b27;font-size:12px">فتح لوحة الإدارة</a></p>`
            : ""
        }
      </div>
    </div>`;

  const result = await sendEmail({
    to,
    subject: `[Alattar] ${alert.title}`,
    text,
    html,
  });

  if (result.provider === "unconfigured") return "skipped";
  return result.delivered ? "sent" : "failed";
}

async function sendWhatsApp(alert: AdminAlert): Promise<DispatchState> {
  const text = alertText(alert);
  const webhook = whatsappWebhook();

  if (!webhook && !metaEnabled()) {
    console.info(`[alert] WhatsApp not configured — ${text.replace(/\n/g, " · ")}`);
    return "skipped";
  }

  try {
    if (webhook) {
      const token = process.env.WHATSAPP_WEBHOOK_TOKEN?.trim();
      const response = await fetch(webhook, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: AbortSignal.timeout(8_000),
        body: JSON.stringify({
          text,
          title: alert.title,
          message: alert.message,
          url: alert.url,
          meta: alert.meta,
        }),
      });
      return response.ok ? "sent" : "failed";
    }

    const token = process.env.WHATSAPP_TOKEN?.trim() as string;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() as string;
    const to = process.env.WHATSAPP_TO?.trim() as string;
    const response = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(8_000),
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    });
    return response.ok ? "sent" : "failed";
  } catch (error) {
    console.error("[alert] WhatsApp dispatch failed", error);
    return "failed";
  }
}

/**
 * Fan-out used by every high-intent public action (inquiry, consultation,
 * proposal). It never throws: a notification outage must not lose the lead.
 */
export async function dispatchAdminAlert(alert: AdminAlert): Promise<DispatchResult> {
  const channels = alert.channels ?? ["email", "whatsapp"];

  try {
    const [email, whatsapp] = await Promise.all([
      channels.includes("email") ? sendAlertEmail(alert) : Promise.resolve("skipped" as const),
      channels.includes("whatsapp") ? sendWhatsApp(alert) : Promise.resolve("skipped" as const),
    ]);

    return { email, whatsapp };
  } catch (error) {
    console.error("[alert] dispatch failed", error);
    return { email: "failed", whatsapp: "failed" };
  }
}
