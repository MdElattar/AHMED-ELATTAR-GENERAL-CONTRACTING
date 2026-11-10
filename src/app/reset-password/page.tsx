import type { Metadata } from "next";
import { PasswordReset } from "@/components/sections/auth/PasswordReset";

export const metadata: Metadata = {
  title: "تعيين كلمة مرور جديدة | بوابة العملاء",
  description: "اختر كلمة مرور جديدة لحسابك في بوابة عملاء أحمد العطار.",
  alternates: { canonical: "/reset-password" },
  robots: { index: false, follow: false },
};

export default function ResetPasswordRoute() {
  return <PasswordReset mode="reset" />;
}
