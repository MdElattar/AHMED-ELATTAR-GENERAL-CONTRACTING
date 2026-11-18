import type { AdminAlert } from "@/lib/notifications";

const PRODUCTION_SITE_URL = "https://ahmed-elattar-general-contracting.vercel.app";
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&amp;fit=crop&amp;w=1400&amp;q=85";

const META_LABELS: Record<string, string> = {
  Reference: "رقم المرجع",
  Date: "التاريخ",
  Slot: "الوقت",
  Mode: "النمط",
  Topic: "الموضوع",
  Email: "البريد الإلكتروني",
  Phone: "الهاتف",
  Company: "الشركة",
  Client: "العميل",
  Budget: "الميزانية",
  Location: "الموقع",
  Project: "المشروع",
  Milestone: "المرحلة",
  Area: "المساحة",
  Currency: "العملة",
  Digest: "البصمة الرقمية",
  TriggeredBy: "تم بواسطة",
  Environment: "البيئة",
  Status: "الحالة",
};

const FONT_STACK = "Arial,'Segoe UI',Tahoma,sans-serif";
const GOLD = "#D4AF37";
const GOLD_DEEP = "#B8860B";
const PALE_GOLD_BORDER = "#614F1E";
const PALE_GOLD_BORDER_RGBA = "rgba(212,175,55,0.25)";
const IVORY = "#F5EFE4";
const MUTED = "rgba(245,239,228,0.62)";

/**
 * Emails are rendered outside the request, so the public site URL must be
 * self-contained. A localhost value (often left in `.env.example`) is treated
 * as unconfigured so executive CTAs never ship a development link.
 */
function resolveSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) return PRODUCTION_SITE_URL;

  try {
    const parsed = new URL(configured);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return PRODUCTION_SITE_URL;
    }
    if (["localhost", "127.0.0.1", "::1", "[::1]"].includes(parsed.hostname)) {
      return PRODUCTION_SITE_URL;
    }
    return parsed.toString().replace(/\/+$/, "");
  } catch {
    return PRODUCTION_SITE_URL;
  }
}

const SITE_URL = resolveSiteUrl();
const LOGO_URL = `${SITE_URL}/brand/logo-full.svg`;
const MARK_URL = `${SITE_URL}/brand/logo-mark.svg`;
const WEBSITE_URL = `${SITE_URL}/`;
const PORTAL_URL = `${SITE_URL}/portal`;
export const ADMIN_ALERT_URL = `${SITE_URL}/admin`;
const ADMIN_URL = ADMIN_ALERT_URL;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Strips stray leading punctuation such as `.MOhammed` without touching initials. */
function cleanValue(value: string | number | undefined) {
  return String(value ?? "")
    .trim()
    .replace(/^[.,;:]\s*(?=[A-Za-z0-9])/, "")
    .replace(/\s+/g, " ");
}

function labelFor(key: string) {
  if (META_LABELS[key]) return META_LABELS[key];
  return key.replace(/([a-z])([A-Z])/g, "$1 $2").trim();
}

function statusFor(title: string) {
  const text = title.toLowerCase();
  if (text.includes("inquiry") || text.includes("request")) {
    return { ar: "طلب جديد", en: "New lead" };
  }
  if (text.includes("signed")) return { ar: "تم التوقيع", en: "Executed" };
  if (text.includes("verified")) return { ar: "تم التحقق", en: "Verified" };
  if (text.includes("downloaded") || text.includes("proposal")) {
    return { ar: "تم الإصدار", en: "Generated" };
  }
  if (text.includes("test")) return { ar: "اختبار مباشر", en: "Live test" };
  return { ar: "تحديث تنفيذي", en: "Executive update" };
}

function findReference(alert: AdminAlert) {
  const entry = Object.entries(alert.meta ?? {}).find(
    ([key]) => key.toLowerCase() === "reference",
  );
  if (entry) {
    const value = cleanValue(entry[1]);
    if (value) return value;
  }
  return alert.message.match(/\b(ALT-\d{4}-\d+)\b/)?.[1] ?? "";
}

/**
 * Table-based, fully inline admin alert. No flex/grid, CSS variables, or
 * external stylesheets: Outlook's Word renderer and Gmail both ignore them.
 * Hex `bgcolor` values are paired with explicit text colors so client dark
 * modes cannot invert the luxury palette into unreadable combinations.
 */
export function renderAdminAlertEmail(alert: AdminAlert) {
  const reference = findReference(alert);
  const status = statusFor(alert.title);
  const year = new Date().getFullYear();

  const rows = Object.entries(alert.meta ?? {})
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value], index) => {
      const label = escapeHtml(labelFor(key));
      const display = escapeHtml(cleanValue(value));
      const background = index % 2 === 0 ? "#0E1015" : "#0B0C0F";
      return `
        <tr>
          <td dir="rtl" align="right" valign="top" width="38%" bgcolor="${background}" style="padding:12px 16px;border-bottom:1px solid #24262D;border-bottom:1px solid rgba(255,255,255,0.07);color:${MUTED};font-family:${FONT_STACK};font-size:12px;line-height:1.6;text-align:right;direction:rtl">
            ${label}
          </td>
          <td dir="ltr" align="right" valign="top" bgcolor="${background}" style="padding:12px 16px;border-bottom:1px solid #24262D;border-bottom:1px solid rgba(255,255,255,0.07);color:${IVORY};font-family:${FONT_STACK};font-size:13px;font-weight:bold;line-height:1.6;text-align:right;direction:ltr;word-break:break-word">
            ${display}
          </td>
        </tr>`;
    })
    .join("");

  const referenceBadge = reference
    ? `<span dir="ltr" style="display:inline-block;padding:6px 10px;border:1px solid ${PALE_GOLD_BORDER};border:1px solid ${PALE_GOLD_BORDER_RGBA};border-radius:999px;background-color:#11131A;color:${GOLD};font-family:${FONT_STACK};font-size:11px;font-weight:bold;letter-spacing:0.4px;line-height:1;direction:ltr">REF · ${escapeHtml(reference)}</span>`
    : "";

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${escapeHtml(alert.title)}</title>
  <!--[if mso]>
  <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  <![endif]-->
  <style type="text/css">
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
    table,td{border-collapse:collapse!important;mso-table-lspace:0pt;mso-table-rspace:0pt}
    img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none}
    a{color:${GOLD}!important;text-decoration:none}
    .ExternalClass,.ExternalClass p,.ExternalClass td,.ExternalClass div{line-height:100%}
    @media only screen and (max-width:620px){
      .shell{width:100%!important}
      .px{padding-left:20px!important;padding-right:20px!important}
      .hero-title{font-size:22px!important;line-height:1.3!important}
      .stack{display:block!important;width:100%!important;box-sizing:border-box}
    }
  </style>
</head>
<body bgcolor="#060708" style="margin:0;padding:0;width:100%;background-color:#060708;color:${IVORY};font-family:${FONT_STACK}">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">إشعار تنفيذي من شركة أحمد العطار للمقاولات العامة · ${escapeHtml(alert.title)}</div>

  <table role="presentation" class="shell" width="640" align="center" cellpadding="0" cellspacing="0" border="0" bgcolor="#060708" style="width:640px;max-width:640px;margin:0 auto;background-color:#060708">
    <tr>
      <td class="px" style="padding:26px 32px 18px;background-color:#08090B;border-top:3px solid ${GOLD}">
        <table role="presentation" dir="rtl" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="right" valign="middle" width="46" style="text-align:right">
              <img src="${MARK_URL}" alt="شعار أحمد العطار" width="42" style="display:block;width:42px;height:42px;border:0">
            </td>
            <td align="right" valign="middle" style="padding:0 12px;text-align:right">
              <div dir="rtl" style="color:${IVORY};font-family:${FONT_STACK};font-size:15px;font-weight:bold;line-height:1.4;text-align:right;direction:rtl">شركة أحمد العطار للمقاولات العامة</div>
              <div dir="ltr" style="color:${GOLD};font-family:${FONT_STACK};font-size:9px;font-weight:bold;letter-spacing:1.4px;line-height:1.6;text-align:right;direction:ltr">AHMED ALATTAR GENERAL CONTRACTING CO.</div>
            </td>
            <td align="left" valign="middle" style="text-align:left">
              <span dir="rtl" style="display:inline-block;padding:6px 10px;border:1px solid ${PALE_GOLD_BORDER};border:1px solid ${PALE_GOLD_BORDER_RGBA};border-radius:999px;color:${GOLD};font-family:${FONT_STACK};font-size:10px;font-weight:bold;line-height:1;text-align:right;direction:rtl">إشعار تنفيذي</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td class="px" style="padding:0 32px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#11131A" style="width:100%;background-color:#11131A;border:1px solid ${PALE_GOLD_BORDER};border:1px solid ${PALE_GOLD_BORDER_RGBA};border-radius:16px">
          <tr>
            <td style="padding:0;background-color:#151821">
              <img src="${HERO_IMAGE}" alt="Tower cranes rising over a construction site at golden hour" width="640" style="display:block;width:100%;max-width:640px;height:auto;border:0">
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:24px 24px 22px;background-color:#11131A">
              <div dir="rtl" style="color:${GOLD};font-family:${FONT_STACK};font-size:11px;font-weight:bold;letter-spacing:1px;line-height:1.6;text-align:right;direction:rtl">وارد عبر القنوات الرسمية · إشارة للمراجعة الفورية</div>
              <h1 class="hero-title" dir="rtl" style="margin:10px 0 0;color:${IVORY};font-family:${FONT_STACK};font-size:27px;font-weight:bold;line-height:1.25;text-align:right;direction:rtl">إشعار تنفيذي جديد</h1>
              <div dir="ltr" style="margin-top:8px;color:${IVORY};font-family:${FONT_STACK};font-size:15px;line-height:1.6;text-align:right;direction:ltr">${escapeHtml(alert.title)}</div>
              <table role="presentation" dir="rtl" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-top:18px">
                <tr>
                  <td align="right" style="text-align:right">
                    <span dir="rtl" style="display:inline-block;padding:6px 10px;border-radius:999px;background-color:${GOLD};color:#0A0B0E;font-family:${FONT_STACK};font-size:11px;font-weight:bold;line-height:1;text-align:right;direction:rtl">${escapeHtml(status.ar)} · ${escapeHtml(status.en)}</span>
                    &nbsp;&nbsp;${referenceBadge}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td class="px" style="padding:22px 32px 0">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0B0C0F" style="width:100%;background-color:#0B0C0F;border:1px solid ${PALE_GOLD_BORDER};border:1px solid ${PALE_GOLD_BORDER_RGBA};border-radius:16px">
          <tr>
            <td class="px" style="padding:30px 28px 8px">
              <p dir="rtl" style="margin:0;color:${GOLD};font-family:${FONT_STACK};font-size:13px;font-weight:bold;line-height:1.8;text-align:right;direction:rtl">سعادة الإدارة الموقرة،</p>
              <p dir="rtl" style="margin:12px 0 0;color:${MUTED};font-family:${FONT_STACK};font-size:13px;line-height:1.95;text-align:right;direction:rtl">نضع بين أيديكم هذا الإشعار التنفيذي الوارد عبر المنصات الرسمية لشركة أحمد العطار. التفاصيل أدناه مُعدّة للمراجعة الفورية، ونرجو اعتماد الإجراء المناسب عبر لوحة الإدارة في أقرب وقت.</p>
              <p dir="ltr" style="margin:12px 0 0;color:${MUTED};font-family:${FONT_STACK};font-size:12px;line-height:1.8;text-align:right;direction:ltr">Dear Management Team, a new executive notification has been received through the official Alattar channels. The particulars are set out below for immediate review and assignment.</p>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:14px 28px 0">
              <table role="presentation" dir="rtl" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#11131A" style="width:100%;background-color:#11131A;border-right:3px solid ${GOLD};border:1px solid ${PALE_GOLD_BORDER};border:1px solid ${PALE_GOLD_BORDER_RGBA};border-right:3px solid ${GOLD};border-radius:10px">
                <tr>
                  <td class="px" style="padding:16px 18px">
                    <div dir="rtl" style="color:${GOLD};font-family:${FONT_STACK};font-size:10px;font-weight:bold;letter-spacing:1px;line-height:1.6;text-align:right;direction:rtl">ملخص الإشعار</div>
                    <div dir="ltr" style="margin-top:6px;color:${IVORY};font-family:${FONT_STACK};font-size:14px;line-height:1.7;text-align:right;direction:ltr">${escapeHtml(cleanValue(alert.message))}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:24px 28px 0">
              <table role="presentation" dir="rtl" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border:1px solid ${PALE_GOLD_BORDER};border:1px solid ${PALE_GOLD_BORDER_RGBA};border-radius:12px">
                <tr>
                  <td colspan="2" bgcolor="#12141B" style="padding:14px 16px;background-color:#12141B;border-bottom:1px solid ${PALE_GOLD_BORDER};border-bottom:1px solid ${PALE_GOLD_BORDER_RGBA}">
                    <div dir="rtl" style="color:${IVORY};font-family:${FONT_STACK};font-size:13px;font-weight:bold;line-height:1.6;text-align:right;direction:rtl">مواصفات الطلب</div>
                    <div dir="ltr" style="margin-top:2px;color:${GOLD};font-family:${FONT_STACK};font-size:9px;font-weight:bold;letter-spacing:1.4px;line-height:1.6;text-align:right;direction:ltr">REQUEST SPECIFICATION</div>
                  </td>
                </tr>
                ${rows}
              </table>
            </td>
          </tr>
          <tr>
            <td class="px" align="right" dir="rtl" style="padding:26px 28px 30px;text-align:right">
              <!--[if mso]>
              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${ADMIN_URL}" style="height:46px;v-text-anchor:middle;width:210px" arcsize="18%" stroke="f" fillcolor="${GOLD}">
                <v:fill type="gradient" color="${GOLD}" color2="${GOLD_DEEP}" angle="135"></v:fill>
                <v:textbox inset="0,0,0,0"><div style="color:#0A0B0E;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;text-align:center">فتح لوحة الإدارة</div></v:textbox>
              </v:roundrect>
              <![endif]-->
              <!--[if !mso]><!-- -->
              <a href="${ADMIN_URL}" target="_blank" style="mso-hide:all;display:inline-block;padding:14px 26px;border:1px solid ${GOLD};border-radius:10px;background-color:${GOLD_DEEP};background-image:linear-gradient(135deg,${GOLD} 0%,${GOLD_DEEP} 100%);color:#0A0B0E!important;font-family:${FONT_STACK};font-size:14px;font-weight:bold;line-height:1;text-align:center;text-decoration:none">فتح لوحة الإدارة</a>
              <!--<![endif]-->
              <div dir="ltr" style="margin-top:10px;color:${MUTED};font-family:${FONT_STACK};font-size:11px;line-height:1.6;text-align:right;direction:ltr">Open the secure admin workspace</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td class="px" style="padding:22px 32px 36px">
        <table role="presentation" dir="rtl" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-top:1px solid ${PALE_GOLD_BORDER};border-top:1px solid ${PALE_GOLD_BORDER_RGBA}">
          <tr>
            <td class="stack" valign="top" width="58%" style="padding:24px 18px 0 0;text-align:right">
              <div style="padding-bottom:12px"><img src="${LOGO_URL}" alt="شركة أحمد العطار للمقاولات العامة" width="150" style="display:block;width:150px;max-width:150px;height:auto;border:0"></div>
              <div dir="rtl" style="color:${GOLD};font-family:${FONT_STACK};font-size:17px;font-weight:bold;line-height:1.6;text-align:right;direction:rtl">نبني ما يبقى.</div>
              <div dir="ltr" style="color:${IVORY};font-family:${FONT_STACK};font-size:11px;font-weight:bold;letter-spacing:1.2px;line-height:1.7;text-align:right;direction:ltr">WE BUILD WHAT ENDURES.</div>
              <p dir="rtl" style="margin:12px 0 0;color:${MUTED};font-family:${FONT_STACK};font-size:12px;line-height:1.9;text-align:right;direction:rtl">أربعة عقود من الهندسة الدقيقة والمشاريع الضخمة، من الرؤية الأولى إلى آخر مسمار.</p>
              <p dir="rtl" style="margin:12px 0 0;color:${IVORY};font-family:${FONT_STACK};font-size:12px;font-weight:bold;line-height:1.8;text-align:right;direction:rtl">المقر الرئيسي · الرياض، المملكة العربية السعودية</p>
              <p dir="ltr" style="margin:4px 0 0;color:${MUTED};font-family:${FONT_STACK};font-size:11px;line-height:1.7;text-align:right;direction:ltr">King Fahd Road, Ahmed Elattar Tower, Riyadh 12211, Saudi Arabia</p>
            </td>
            <td class="stack" valign="top" width="42%" style="padding:24px 0 0 18px;text-align:right;border-right:1px solid #24262D;border-right:1px solid rgba(255,255,255,0.07)">
              <div dir="rtl" style="color:${GOLD};font-family:${FONT_STACK};font-size:11px;font-weight:bold;letter-spacing:1px;line-height:1.6;text-align:right;direction:rtl">روابط سريعة</div>
              <div dir="ltr" style="margin-top:2px;color:${MUTED};font-family:${FONT_STACK};font-size:9px;font-weight:bold;letter-spacing:1.2px;line-height:1.6;text-align:right;direction:ltr">QUICK LINKS</div>
              <p style="margin:12px 0 0;text-align:right"><a href="${WEBSITE_URL}" style="color:${GOLD};font-family:${FONT_STACK};font-size:12px;line-height:1.9;text-align:right;text-decoration:none">الموقع الرسمي</a></p>
              <p style="margin:4px 0 0;text-align:right"><a href="${PORTAL_URL}" style="color:${GOLD};font-family:${FONT_STACK};font-size:12px;line-height:1.9;text-align:right;text-decoration:none">بوابة العملاء</a></p>
              <p style="margin:4px 0 0;text-align:right"><a href="${ADMIN_URL}" style="color:${GOLD};font-family:${FONT_STACK};font-size:12px;line-height:1.9;text-align:right;text-decoration:none">لوحة الإدارة</a></p>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding:22px 0 0;border-top:1px solid #24262D;border-top:1px solid rgba(255,255,255,0.07)">
              <div dir="rtl" style="color:${IVORY};font-family:${FONT_STACK};font-size:12px;font-weight:bold;line-height:1.7;text-align:right;direction:rtl">توقيع الشركة · م. أحمد العطار</div>
              <div dir="ltr" style="margin-top:2px;color:${MUTED};font-family:${FONT_STACK};font-size:10px;line-height:1.7;text-align:right;direction:ltr">Eng. Ahmed Alattar — Chairman</div>
              <div dir="ltr" style="margin-top:12px;color:${MUTED};font-family:${FONT_STACK};font-size:10px;line-height:1.7;text-align:right;direction:ltr">© ${year} Ahmed Alattar General Contracting Co. All rights reserved.</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
