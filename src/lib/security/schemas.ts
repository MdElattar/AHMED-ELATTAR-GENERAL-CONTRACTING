import { z } from "zod";
import { isStrongEnoughPassword } from "@/lib/auth/password";
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
