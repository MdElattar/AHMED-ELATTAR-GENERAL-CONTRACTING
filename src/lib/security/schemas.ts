import { z } from "zod";
import { isStrongEnoughPassword } from "@/lib/auth/password";
import { CONSULTATION_MODES, CONSULTATION_SLOTS } from "@/lib/consultation";
import { ESTIMATE_AREA_MAX, ESTIMATE_AREA_MIN } from "@/lib/estimate";
import {
  cleanMultiline,
  cleanString,
  isDisplayName,
  isEmail,
  isPhone,
  isSafeMongoValue,
  normalizeEmail,
} from "@/lib/security/validation";

/** Rejects unknown fields instead of silently stripping attacker input. */
function strictObject<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape).strict();
}

/**
 * CMS records intentionally have a flexible shape, but they still must never
 * contain MongoDB operators or prototype-pollution keys at any depth.
 */
export const safeRecordSchema = z
  .record(z.string(), z.unknown())
  .refine(isSafeMongoValue, { message: "unsafe_input" });

export const adminProjectMutationSchema = strictObject({
  project: safeRecordSchema,
}).transform(({ project }) => project);

export const adminContentMutationSchema = strictObject({
  content: safeRecordSchema,
}).transform(({ content }) => content);

export const adminInquiryStatusSchema = strictObject({
  status: z.string().max(40).transform((value) => cleanString(value, 40)),
  id: z.string().max(80).transform((value) => cleanString(value, 80)).optional().default(""),
  ids: z
    .array(z.string().max(80).transform((value) => cleanString(value, 80)))
    .max(100)
    .optional()
    .default([]),
});

export const adminConsultationStatusSchema = strictObject({
  id: z
    .string()
    .max(80)
    .transform((value) => cleanString(value, 80))
    .refine((value) => value.length > 0, { message: "invalid_id" }),
  status: z
    .string()
    .max(40)
    .transform((value) => cleanString(value, 40))
    .refine((value) => value.length > 0, { message: "invalid_status" }),
});

export const adminMaintenanceSchema = strictObject({
  dryRun: z.boolean().optional().default(false),
});

export const passkeyDeleteSchema = strictObject({
  credentialId: z
    .string()
    .max(2048)
    .transform((value) => cleanString(value, 2048))
    .refine((value) => value.length > 0, { message: "invalid_credential" }),
});

/**
 * Zod contracts for every authentication payload.
 *
 * Each field normalises before it validates, so a route never has to repeat
 * trimming/casing rules and an invalid value can never reach the repository.
 */
export const emailField = z
  .string()
  .max(254)
  .transform((value) => normalizeEmail(value))
  .refine((value) => isEmail(value), { message: "invalid_email" });

export const passwordField = z
  .string()
  .min(8)
  .max(128)
  .refine((value) => isStrongEnoughPassword(value), { message: "weak_password" });

export const signInSchema = strictObject({
  email: emailField,
  password: z.string().min(8).max(128),
  remember: z.boolean().optional().default(false),
  next: z.string().max(2048).optional(),
});

export const signUpSchema = strictObject({
  name: z
    .string()
    .max(120)
    .transform((value) => cleanString(value, 120))
    .refine((value) => isDisplayName(value), { message: "invalid_name" }),
  email: emailField,
  company: z
    .string()
    .max(160)
    .optional()
    .default("")
    .transform((value) => cleanString(value, 160)),
  phone: z
    .string()
    .max(40)
    .optional()
    .default("")
    .transform((value) => cleanString(value, 40))
    .refine((value) => value.length === 0 || isPhone(value), { message: "invalid_phone" }),
  password: passwordField,
});

export const forgotPasswordSchema = strictObject({
  email: emailField,
  locale: z.enum(["ar", "en"]).optional().default("ar"),
});

export const verifyOtpSchema = strictObject({
  email: emailField,
  code: z
    .string()
    .max(32)
    .transform((value) => cleanString(value, 32).replace(/\D/g, "").slice(0, 6))
    .refine((value) => value.length === 6, { message: "invalid_code" }),
});

export const resetPasswordSchema = strictObject({
  password: passwordField,
});

export const adminGrantRequestSchema = strictObject({
    primaryPassword: z.string().min(8).max(128),
    mode: z.enum(["promote", "create"]),
    email: emailField,
    name: z
      .string()
      .max(120)
      .optional()
      .default("")
      .transform((value) => cleanString(value, 120)),
    company: z
      .string()
      .max(160)
      .optional()
      .default("")
      .transform((value) => cleanString(value, 160)),
    phone: z
      .string()
      .max(40)
      .optional()
      .default("")
      .transform((value) => cleanString(value, 40))
      .refine((value) => value.length === 0 || isPhone(value), { message: "invalid_phone" }),
    password: passwordField.optional(),
  })
  .superRefine((value, context) => {
    if (value.mode !== "create") return;
    if (!isDisplayName(value.name)) {
      context.addIssue({
        code: "custom",
        path: ["name"],
        message: "invalid_name",
      });
    }
    if (!value.password) {
      context.addIssue({
        code: "custom",
        path: ["password"],
        message: "weak_password",
      });
    }
  });

export const adminGrantConfirmSchema = strictObject({
  grantId: z
    .string()
    .min(16)
    .max(80)
    .regex(/^[a-zA-Z0-9-]+$/, { message: "invalid_grant" }),
  code: z
    .string()
    .max(32)
    .transform((value) => cleanString(value, 32).replace(/\D/g, "").slice(0, 6))
    .refine((value) => value.length === 6, { message: "invalid_code" }),
});

export const adminRevokeSchema = strictObject({
  email: emailField,
});

/** Query contract for the paginated, filterable primary-admin directory. */
export const adminAccessQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(5).max(50).default(10),
  role: z.enum(["all", "admin", "manager", "client"]).default("all"),
  query: z
    .string()
    .max(120)
    .optional()
    .default("")
    .transform((value) => cleanString(value, 120)),
  excludeTest: z
    .enum(["0", "1", "false", "true"])
    .optional()
    .default("1")
    .transform((value) => value === "1" || value === "true"),
});

export const adminAccountRemoveSchema = strictObject({
  email: emailField,
  primaryPassword: z.string().min(8).max(128),
});

export const contactSchema = strictObject({
  name: z
    .string()
    .max(120)
    .transform((value) => cleanString(value, 120))
    .refine((value) => isDisplayName(value), { message: "invalid_name" }),
  email: emailField,
  phone: z
    .string()
    .max(40)
    .transform((value) => cleanString(value, 40))
    .refine((value) => isPhone(value), { message: "invalid_phone" }),
  company: z
    .string()
    .max(160)
    .optional()
    .default("")
    .transform((value) => cleanString(value, 160)),
  service: z
    .string()
    .max(80)
    .transform((value) => cleanString(value, 80))
    .refine((value) => value.length > 0, { message: "invalid_service" }),
  projectType: z
    .string()
    .max(120)
    .transform((value) => cleanString(value, 120))
    .refine((value) => value.length > 0, { message: "invalid_project_type" }),
  budget: z
    .string()
    .max(80)
    .optional()
    .default("")
    .transform((value) => cleanString(value, 80)),
  location: z
    .string()
    .max(160)
    .transform((value) => cleanString(value, 160))
    .refine((value) => value.length > 0, { message: "invalid_location" }),
  message: z
    .string()
    .max(4000)
    .transform((value) => cleanMultiline(value, 4000))
    .refine((value) => value.length > 0, { message: "invalid_message" }),
  consent: z.literal(true, { message: "consent_required" }),
  files: z
    .array(
      strictObject({
        name: z.string().max(180).transform((value) => cleanString(value, 180)),
        size: z.number().int().positive().max(25 * 1024 * 1024),
        type: z.string().max(120).transform((value) => cleanString(value, 120)),
      }),
    )
    .max(10)
    .default([]),
});

export const newsletterSchema = strictObject({
  email: emailField,
});

const displayNameField = z
  .string()
  .max(120)
  .transform((value) => cleanString(value, 120))
  .refine((value) => isDisplayName(value), { message: "invalid_name" });

const phoneField = z
  .string()
  .max(40)
  .transform((value) => cleanString(value, 40))
  .refine((value) => isPhone(value), { message: "invalid_phone" });

const companyField = z
  .string()
  .max(160)
  .optional()
  .default("")
  .transform((value) => cleanString(value, 160));

const optionalDisplayNameField = z
  .string()
  .max(120)
  .optional()
  .default("")
  .transform((value) => cleanString(value, 120))
  .refine((value) => value.length === 0 || isDisplayName(value), { message: "invalid_name" });

const optionalPhoneField = z
  .string()
  .max(40)
  .optional()
  .default("")
  .transform((value) => cleanString(value, 40))
  .refine((value) => value.length === 0 || isPhone(value), { message: "invalid_phone" });

export const profileSchema = strictObject({
  name: displayNameField,
  nameAr: optionalDisplayNameField,
  honorific: z.string().max(30).optional().default("").transform((value) => cleanString(value, 30)),
  honorificAr: z
    .string()
    .max(30)
    .optional()
    .default("")
    .transform((value) => cleanString(value, 30)),
  company: companyField,
  phone: optionalPhoneField,
});

export const changePasswordSchema = strictObject({
  currentPassword: z.string().min(1).max(128),
  newPassword: passwordField,
});

const slugField = z
  .string()
  .max(120)
  .transform((value) => cleanString(value, 120).toLowerCase())
  .refine((value) => /^[a-z0-9][a-z0-9-]*$/.test(value), { message: "invalid_slug" });

export const projectSlugQuerySchema = strictObject({ projectSlug: slugField });

export const consultationSchema = strictObject({
  name: displayNameField,
  email: emailField,
  phone: phoneField,
  company: companyField,
  topic: z
    .string()
    .max(120)
    .transform((value) => cleanString(value, 120))
    .refine((value) => value.length > 0, { message: "invalid_topic" }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "invalid_date" }),
  slot: z.enum(CONSULTATION_SLOTS),
  mode: z.enum(CONSULTATION_MODES),
  notes: z
    .string()
    .max(2000)
    .optional()
    .default("")
    .transform((value) => cleanMultiline(value, 2000)),
});

export const proposalSchema = strictObject({
  slug: z
    .string()
    .max(120)
    .optional()
    .default("")
    .transform((value) => cleanString(value, 120).toLowerCase()),
  name: displayNameField,
  email: emailField,
  company: companyField,
  phone: z
    .string()
    .max(40)
    .optional()
    .default("")
    .transform((value) => cleanString(value, 40))
    .refine((value) => value.length === 0 || isPhone(value), { message: "invalid_phone" }),
  type: z.enum(["residential", "commercial", "infrastructure", "industrial"]),
  area: z.coerce.number().min(ESTIMATE_AREA_MIN).max(ESTIMATE_AREA_MAX),
  quality: z.enum(["essential", "premium", "signature"]),
  city: z.enum(["riyadh", "jeddah", "neom", "other", "cairo"]),
  pace: z.enum(["standard", "fast", "accelerated"]),
  currency: z.enum(["SAR", "USD", "EGP"]).optional().default("SAR"),
  locale: z.enum(["ar", "en"]).optional().default("ar"),
});

export const contractSignSchema = strictObject({
  projectSlug: slugField,
  signatureName: displayNameField,
  accepted: z.literal(true),
});

export const milestoneVerifySchema = strictObject({
  projectSlug: slugField,
  titleEn: z
    .string()
    .max(200)
    .transform((value) => cleanString(value, 200))
    .refine((value) => value.length > 0, { message: "invalid_milestone" }),
});

export const adminNotificationSchema = strictObject({
  channel: z.enum(["email", "whatsapp", "all"]).optional().default("all"),
  message: z
    .string()
    .max(1000)
    .optional()
    .default("")
    .transform((value) => cleanMultiline(value, 1000)),
});

/* --------------------------------------------------- passkeys / recovery */

/** Optional device label; the caller supplies the "This device" fallback. */
export const deviceNameField = z
  .string()
  .max(80)
  .optional()
  .default("")
  .transform((value) => cleanString(value, 80));

export const passkeyRenameSchema = strictObject({
  credentialId: z
    .string()
    .max(2048)
    .transform((value) => cleanString(value, 2048))
    .refine((value) => value.length > 0, { message: "invalid_credential" }),
  deviceName: z
    .string()
    .max(80)
    .transform((value) => cleanString(value, 80))
    .refine((value) => value.length > 0, { message: "invalid_device_name" }),
});

export const passkeyOptionsSchema = strictObject({
  purpose: z.enum(["sign-in", "step-up"]).optional().default("sign-in"),
  email: emailField.optional(),
});

export const passkeyAuthVerifySchema = strictObject({
  response: z.record(z.string(), z.unknown()),
  purpose: z.enum(["sign-in", "step-up"]).optional().default("sign-in"),
  remember: z.boolean().optional().default(true),
  next: z
    .string()
    .max(2048)
    .optional()
    .transform((value) => (typeof value === "string" ? cleanString(value, 2048) : undefined)),
});

export const passkeyResetSchema = strictObject({
  email: emailField,
  reason: z
    .string()
    .max(500)
    .transform((value) => cleanString(value, 500))
    .refine((value) => value.length > 0, { message: "invalid_reason" }),
});

export const backupCodeRedeemSchema = strictObject({
  email: emailField,
  code: z
    .string()
    .max(64)
    .transform((value) => cleanString(value, 64))
    .refine((value) => value.length > 0, { message: "invalid_code" }),
});
