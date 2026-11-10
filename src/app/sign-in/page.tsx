import type { Metadata } from "next";
import { AuthPage } from "@/components/sections/auth/AuthPage";

export const metadata: Metadata = {
  title: "تسجيل الدخول | بوابة العملاء",
  description: "ادخل إلى بوابة عملاء أحمد العطار لمتابعة مشاريعك ومستنداتك ومدفوعاتك.",
  alternates: { canonical: "/sign-in" },
};

export default function SignInRoute() {
  return <AuthPage mode="sign-in" />;
}
