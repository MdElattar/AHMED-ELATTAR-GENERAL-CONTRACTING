"use client";

import { useMemo } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";

const PLACEHOLDER_NAME = "platform administrator";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  return parts
    .slice(0, 2)
    .map((part) => Array.from(part)[0] ?? "")
    .join("")
    .toUpperCase();
}

/** "mohamed.elattar" -> "Mohamed Elattar" */
function humanizeEmailLocal(local: string) {
  const cleaned = local.replace(/[._-]+/g, " ").trim();
  if (!cleaned) return "";
  return cleaned.replace(/\b\w/g, (character) => character.toUpperCase());
}

/**
 * The single source of truth for how the signed-in person is addressed.
 *
 * It never exposes the seed placeholder "Platform Administrator": when the
 * profile has no real name it falls back to the email local part. Consumers
 * render a skeleton while `loading` is true instead of a fake name.
 */
export function useCurrentUser() {
  const { user, ready } = useAuth();
  const { locale } = useI18n();

  return useMemo(() => {
    const email = user?.email ?? "";
    const emailLocal = email.split("@")[0] ?? "";
    const fallbackName = humanizeEmailLocal(emailLocal);

    const localizedName =
      (locale === "ar" ? user?.nameAr || user?.name : user?.name) ?? "";
    const cleanedName = localizedName.trim();
    const name =
      cleanedName.toLowerCase() === PLACEHOLDER_NAME ? "" : cleanedName || fallbackName;

    const localizedHonorific =
      (locale === "ar"
        ? user?.honorificAr || user?.honorific
        : user?.honorific) ?? "";
    const displayName = [localizedHonorific.trim(), name]
      .filter(Boolean)
      .join(" ")
      .trim();

    const roleLabel = user?.primaryAdmin
      ? locale === "ar"
        ? "المسؤول الرئيسي"
        : "Primary admin"
      : user?.role === "admin"
        ? locale === "ar"
          ? "مسؤول"
          : "Admin"
        : user?.role === "client"
          ? locale === "ar"
            ? "عميل"
            : "Client"
          : user?.company || (locale === "ar" ? "مستخدم" : "User");

    return {
      user,
      ready,
      loading: !ready,
      email,
      name,
      displayName,
      firstName: name.split(/\s+/)[0] ?? "",
      monogram: initials(name) || initials(fallbackName) || "?",
      roleLabel,
    };
  }, [user, ready, locale]);
}
