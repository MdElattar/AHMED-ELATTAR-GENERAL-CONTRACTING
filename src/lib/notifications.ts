import { safeLogError } from "@/lib/security/http";
import "server-only";
import { ADMIN_ALERT_URL, renderAdminAlertEmail } from "@/lib/admin-alert-template";
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
  lines.push(ADMIN_ALERT_URL);
  return lines.join("\n");
}

async function sendAlertEmail(alert: AdminAlert): Promise<DispatchState> {
  const to = alertEmail();
  if (!process.env.RESEND_API_KEY?.trim() || !to) return "skipped";

  const text = alertText(alert);
  const html = renderAdminAlertEmail(alert);

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
    safeLogError("[alert] WhatsApp dispatch failed", error);
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
    safeLogError("[alert] dispatch failed", error);
    return { email: "failed", whatsapp: "failed" };
  }
}
