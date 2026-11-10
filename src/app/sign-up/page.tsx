import type { Metadata } from "next";
import { AuthPage } from "@/components/sections/auth/AuthPage";

export const metadata: Metadata = {
  title: "إنشاء حساب | بوابة العملاء",
  description: "أنشئ حسابك في بوابة عملاء أحمد العطار وتابع مشاريعك من أي مكان.",
  alternates: { canonical: "/sign-up" },
};

export default function SignUpRoute() {
  return <AuthPage mode="sign-up" />;
}
