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
  normalizeEmail,
} from "@/lib/security/validation";

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

export const signInSchema = z.object({
  email: emailField,
  password: z.string().min(8).max(128),
  remember: z.boolean().optional().default(false),
});

export const signUpSchema = z.object({
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

export const forgotPasswordSchema = z.object({
  email: emailField,
  locale: z.enum(["ar", "en"]).optional().default("ar"),
});

export const verifyOtpSchema = z.object({
  email: emailField,
  code: z
    .string()
    .max(32)
    .transform((value) => cleanString(value, 32).replace(/\D/g, "").slice(0, 6))
    .refine((value) => value.length === 6, { message: "invalid_code" }),
});

export const resetPasswordSchema = z.object({
  password: passwordField,
});

export const contactSchema = z.object({
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
});

export const newsletterSchema = z.object({
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

const slugField = z
  .string()
  .max(120)
  .transform((value) => cleanString(value, 120).toLowerCase())
  .refine((value) => /^[a-z0-9][a-z0-9-]*$/.test(value), { message: "invalid_slug" });

export const consultationSchema = z.object({
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

export const proposalSchema = z.object({
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

export const contractSignSchema = z.object({
  projectSlug: slugField,
  signatureName: displayNameField,
  accepted: z.literal(true),
});

export const milestoneVerifySchema = z.object({
  projectSlug: slugField,
  titleEn: z
    .string()
    .max(200)
    .transform((value) => cleanString(value, 200))
    .refine((value) => value.length > 0, { message: "invalid_milestone" }),
});

export const adminNotificationSchema = z.object({
  channel: z.enum(["email", "whatsapp", "all"]).optional().default("all"),
  message: z
    .string()
    .max(1000)
    .optional()
    .default("")
    .transform((value) => cleanMultiline(value, 1000)),
});
