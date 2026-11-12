import type { StoredUser, UserRole } from "@/lib/db";

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
