import type { StoredUser, UserRole } from "@/lib/db";

const SYNTHETIC_TEST_EMAIL = /@example\.com$/i;

/** Synthetic accounts created by e2e/bulk tests are hidden by default. */
export function isSyntheticTestAccount(email: string) {
  return SYNTHETIC_TEST_EMAIL.test(email.trim());
}

export type AdminDirectoryUser = {
  email: string;
  name: string;
  company: string;
  phone?: string;
  role: UserRole;
  accountId: string;
  createdAt: string;
  lastLoginAt?: string;
};

/** Never send password or reset material to the admin directory client. */
export function adminDirectoryUser(user: StoredUser): AdminDirectoryUser {
  return {
    email: user.email,
    name: user.name,
    company: user.company,
    ...(user.phone ? { phone: user.phone } : {}),
    role: user.role,
    accountId: user.accountId,
    createdAt: user.createdAt,
    ...(user.lastLoginAt ? { lastLoginAt: user.lastLoginAt } : {}),
  };
}
