import type { Metadata } from "next";
import { PasswordReset } from "@/components/sections/auth/PasswordReset";

export const metadata: Metadata = {
  title: "استعادة كلمة المرور | بوابة العملاء",
  description: "أعد تعيين كلمة مرور حسابك في بوابة عملاء أحمد العطار بأمان.",
  alternates: { canonical: "/forgot-password" },
  robots: { index: false, follow: false },
};

export default function ForgotPasswordRoute() {
  return <PasswordReset mode="request" />;
}
