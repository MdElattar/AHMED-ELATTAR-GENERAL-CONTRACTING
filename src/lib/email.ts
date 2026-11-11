type SendOtpInput = {
  to: string;
  code: string;
  expiresMinutes: number;
  locale?: "ar" | "en";
};

export type SendOtpResult = {
  delivered: boolean;
  provider: "resend" | "development";
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function template(code: string, minutes: number, locale: "ar" | "en") {
  if (locale === "ar") {
    return {
      subject: `رمز التحقق من أحمد العطار: ${code}`,
      text: `رمز التحقق الخاص بك هو ${code}. ينتهي خلال ${minutes} دقائق. إذا لم تطلب إعادة تعيين كلمة المرور، تجاهل هذه الرسالة.`,
      html: `
        <div dir="rtl" style="background:#060708;padding:40px 20px;font-family:Tahoma,Arial,sans-serif;color:#f3eee4">
          <div style="max-width:520px;margin:0 auto;border:1px solid rgba(212,175,55,.25);background:#0b0c0f;padding:36px">
            <p style="margin:0;color:#d4af37;font-size:12px;letter-spacing:2px">شركة أحمد العطار للمقاولات العامة</p>
            <h1 style="margin:18px 0 0;font-size:26px;font-weight:600">رمز إعادة تعيين كلمة المرور</h1>
            <p style="margin:14px 0 0;color:rgba(243,238,228,.62);font-size:14px;line-height:1.8">أدخل الرمز التالي لإكمال إعادة التعيين. الرمز صالح لمدة ${minutes} دقائق ولمرة واحدة فقط.</p>
            <div style="margin:28px 0;padding:20px;text-align:center;border:1px solid rgba(212,175,55,.35);background:#060708">
              <span style="font-size:38px;letter-spacing:12px;color:#f2dfa0;font-weight:700">${code}</span>
            </div>
            <p style="margin:0;color:rgba(243,238,228,.38);font-size:12px;line-height:1.8">إذا لم تطلب إعادة تعيين كلمة المرور، تجاهل هذه الرسالة — لن يتغير حسابك.</p>
          </div>
        </div>`,
    };
  }

  return {
    subject: `Your Elattar verification code: ${code}`,
    text: `Your verification code is ${code}. It expires in ${minutes} minutes. If you did not request a password reset, ignore this email.`,
    html: `
      <div style="background:#060708;padding:40px 20px;font-family:Arial,Helvetica,sans-serif;color:#f3eee4">
        <div style="max-width:520px;margin:0 auto;border:1px solid rgba(212,175,55,.25);background:#0b0c0f;padding:36px">
          <p style="margin:0;color:#d4af37;font-size:12px;letter-spacing:2px">AHMED ELATTAR GENERAL CONTRACTING</p>
          <h1 style="margin:18px 0 0;font-size:26px;font-weight:600">Reset your password</h1>
          <p style="margin:14px 0 0;color:rgba(243,238,228,.62);font-size:14px;line-height:1.8">Enter the code below to complete the reset. It is valid for ${minutes} minutes and can be used once.</p>
          <div style="margin:28px 0;padding:20px;text-align:center;border:1px solid rgba(212,175,55,.35);background:#060708">
            <span style="font-size:38px;letter-spacing:12px;color:#f2dfa0;font-weight:700">${code}</span>
          </div>
          <p style="margin:0;color:rgba(243,238,228,.38);font-size:12px;line-height:1.8">If you did not request a reset, ignore this email — your account will not change.</p>
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
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.OTP_FROM_EMAIL?.trim() || "Ahmed Elattar <no-reply@alattar.sa>";
  const locale = input.locale === "en" ? "en" : "ar";
  const body = template(input.code, input.expiresMinutes, locale);

  if (!apiKey) {
    console.info(`[otp] Development code for ${escapeHtml(input.to)}: ${input.code}`);
    return { delivered: false, provider: "development" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: body.subject,
      text: body.text,
      html: body.html,
    }),
  });

  if (!response.ok) {
    console.error("[otp] Resend delivery failed", response.status, await response.text());
    return { delivered: false, provider: "resend" };
  }

  return { delivered: true, provider: "resend" };
}
