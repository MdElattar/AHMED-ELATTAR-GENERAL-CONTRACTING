type SendOtpInput = {
  to: string;
  code: string;
  expiresMinutes: number;
  locale?: "ar" | "en";
  purpose?: "password-reset" | "admin-delegation";
  targetEmail?: string;
};

export type SendOtpResult = {
  delivered: boolean;
  provider: "resend" | "development";
};

export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  from?: string;
};

export type SendEmailResult = {
  delivered: boolean;
  provider: "resend" | "development";
};

/**
 * Generic transactional delivery used by OTP, consultation confirmations, and
 * the admin alert webhook. Resend is the only provider that needs an API key;
 * local development logs the payload instead of silently dropping it.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    input.from?.trim() ||
    process.env.OTP_FROM_EMAIL?.trim() ||
    "Ahmed Elattar <no-reply@alattar.sa>";

  if (!apiKey) {
    console.info(`[email] Development delivery for ${input.to}: ${input.subject}`);
    return { delivered: false, provider: "development" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        ...(input.html ? { html: input.html } : {}),
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      }),
    });

    if (!response.ok) {
      console.error("[email] Resend delivery failed", response.status, await response.text());
      return { delivered: false, provider: "resend" };
    }

    return { delivered: true, provider: "resend" };
  } catch (error) {
    console.error("[email] Resend request failed", error);
    return { delivered: false, provider: "resend" };
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function template(
  code: string,
  minutes: number,
  locale: "ar" | "en",
  purpose: "password-reset" | "admin-delegation",
  targetEmail?: string,
) {
  const isDelegation = purpose === "admin-delegation";
  const target = targetEmail ? escapeHtml(targetEmail) : "";

  if (locale === "ar") {
    return {
      subject: isDelegation
        ? `رمز تفويض صلاحية إدارية: ${code}`
        : `رمز التحقق من أحمد العطار: ${code}`,
      text: isDelegation
        ? `طلب تفويض صلاحية إدارية للحساب ${target || "المحدد"} على منصة أحمد العطار. رمز التحقق هو ${code}. ينتهي خلال ${minutes} دقائق. إذا لم تطلب ذلك، تجاهل الرسالة وراجع أمان الحساب.`
        : `رمز التحقق الخاص بك هو ${code}. ينتهي خلال ${minutes} دقائق. إذا لم تطلب إعادة تعيين كلمة المرور، تجاهل هذه الرسالة.`,
      html: `
        <div dir="rtl" style="background:#060708;padding:40px 20px;font-family:Tahoma,Arial,sans-serif;color:#f3eee4">
          <div style="max-width:520px;margin:0 auto;border:1px solid rgba(212,175,55,.25);background:#0b0c0f;padding:36px">
            <p style="margin:0;color:#d4af37;font-size:12px;letter-spacing:2px">شركة أحمد العطار للمقاولات العامة</p>
            <h1 style="margin:18px 0 0;font-size:26px;font-weight:600">${isDelegation ? "تأكيد تفويض صلاحية إدارية" : "رمز إعادة تعيين كلمة المرور"}</h1>
            <p style="margin:14px 0 0;color:rgba(243,238,228,.62);font-size:14px;line-height:1.8">${isDelegation ? `طلب تفويض صلاحية إدارية للحساب <strong dir="ltr">${target}</strong>. أدخل الرمز التالي للموافقة. الرمز صالح لمدة ${minutes} دقائق ولمرة واحدة فقط.` : `أدخل الرمز التالي لإكمال إعادة التعيين. الرمز صالح لمدة ${minutes} دقائق ولمرة واحدة فقط.`}</p>
            <div style="margin:28px 0;padding:20px;text-align:center;border:1px solid rgba(212,175,55,.35);background:#060708">
              <span style="font-size:38px;letter-spacing:12px;color:#f2dfa0;font-weight:700">${code}</span>
            </div>
            <p style="margin:0;color:rgba(243,238,228,.38);font-size:12px;line-height:1.8">${isDelegation ? "إذا لم تطلب هذا التفويض، تجاهل الرسالة ولا تشارك الرمز مع أي شخص." : "إذا لم تطلب إعادة تعيين كلمة المرور، تجاهل هذه الرسالة — لن يتغير حسابك."}</p>
          </div>
        </div>`,
    };
  }

  return {
    subject: isDelegation
      ? `Admin access verification code: ${code}`
      : `Your Elattar verification code: ${code}`,
    text: isDelegation
      ? `A request was made to grant admin access to ${target || "the specified account"} on the Ahmed Elattar platform. Your verification code is ${code}. It expires in ${minutes} minutes. If you did not request this, ignore this email and review account security.`
      : `Your verification code is ${code}. It expires in ${minutes} minutes. If you did not request a password reset, ignore this email.`,
    html: `
      <div style="background:#060708;padding:40px 20px;font-family:Arial,Helvetica,sans-serif;color:#f3eee4">
        <div style="max-width:520px;margin:0 auto;border:1px solid rgba(212,175,55,.25);background:#0b0c0f;padding:36px">
          <p style="margin:0;color:#d4af37;font-size:12px;letter-spacing:2px">AHMED ELATTAR GENERAL CONTRACTING</p>
          <h1 style="margin:18px 0 0;font-size:26px;font-weight:600">${isDelegation ? "Confirm admin delegation" : "Reset your password"}</h1>
          <p style="margin:14px 0 0;color:rgba(243,238,228,.62);font-size:14px;line-height:1.8">${isDelegation ? `A request was made to grant admin access to <strong dir="ltr">${target}</strong>. Enter the code below to approve it. It is valid for ${minutes} minutes and can be used once.` : `Enter the code below to complete the reset. It is valid for ${minutes} minutes and can be used once.`}</p>
          <div style="margin:28px 0;padding:20px;text-align:center;border:1px solid rgba(212,175,55,.35);background:#060708">
            <span style="font-size:38px;letter-spacing:12px;color:#f2dfa0;font-weight:700">${code}</span>
          </div>
          <p style="margin:0;color:rgba(243,238,228,.38);font-size:12px;line-height:1.8">${isDelegation ? "If you did not request this delegation, ignore this email and do not share the code with anyone." : "If you did not request a reset, ignore this email — your account will not change."}</p>
        </div>
      </div>`,
  };
}

/**
 * Delivers the OTP through Resend when configured. In local development the
 * code is logged and returned to the client so the full flow remains testable
 * without an email provider. Production without a provider fails closed.
 */
export async function sendOtpEmail(input: SendOtpInput): Promise<SendOtpResult> {
  const locale = input.locale === "en" ? "en" : "ar";
  const purpose = input.purpose === "admin-delegation" ? "admin-delegation" : "password-reset";
  const body = template(
    input.code,
    input.expiresMinutes,
    locale,
    purpose,
    input.targetEmail,
  );

  if (!process.env.RESEND_API_KEY?.trim()) {
    console.info(`[otp] Development code for ${escapeHtml(input.to)}: ${input.code}`);
    return { delivered: false, provider: "development" };
  }

  const result = await sendEmail({
    to: input.to,
    subject: body.subject,
    text: body.text,
    html: body.html,
  });

  return { delivered: result.delivered, provider: result.provider };
}
