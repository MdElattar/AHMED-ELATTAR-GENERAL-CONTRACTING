/**
 * Declarative index contract shared by the Mongoose schemas and the
 * `npm run check:indexes` deployment check. Keep this list in sync with the
 * `schema.index(...)` calls in `src/lib/db.ts`.
 */
export type RequiredIndex = {
  collection: string;
  keys: Record<string, 1 | -1>;
  unique?: boolean;
  expireAfterSeconds?: number;
};

export const REQUIRED_DB_INDEXES: RequiredIndex[] = [
  // Account directory: exact-identity lookups, role filters, newest-first pages.
  { collection: "users", keys: { email: 1 }, unique: true },
  { collection: "users", keys: { role: 1, createdAt: -1 } },
  { collection: "users", keys: { createdAt: -1 } },
  { collection: "users", keys: { accountId: 1 } },
  { collection: "users", keys: { resetTokenHash: 1 } },

  // Passkeys and grants: credential discovery plus TTL cleanup.
  { collection: "passkeys", keys: { email: 1 } },
  { collection: "passkeys", keys: { userId: 1 } },
  { collection: "passkeys", keys: { credentialId: 1 }, unique: true },
  { collection: "admingrants", keys: { expiresAt: 1 }, expireAfterSeconds: 0 },
  { collection: "otptokens", keys: { expiresAt: 1 }, expireAfterSeconds: 0 },
  { collection: "authchallenges", keys: { expiresAt: 1 }, expireAfterSeconds: 0 },

  // Public portfolio feeds and admin filters.
  { collection: "projects", keys: { slug: 1 }, unique: true },
  { collection: "projects", keys: { status: 1, createdAt: -1 } },
  { collection: "projects", keys: { category: 1, createdAt: -1 } },
  { collection: "projects", keys: { featured: 1, createdAt: -1 } },
  { collection: "projects", keys: { clientEmails: 1 } },
  { collection: "assets", keys: { assetId: 1 }, unique: true },

  // Back-office lists and audit trails.
  { collection: "inquiries", keys: { kind: 1, createdAt: -1 } },
  { collection: "inquiries", keys: { status: 1, createdAt: -1 } },
  { collection: "auditlogs", keys: { createdAt: -1 } },
  { collection: "auditlogs", keys: { entity: 1, createdAt: -1 } },
  { collection: "auditlogs", keys: { actor: 1, createdAt: -1 } },
  { collection: "consultations", keys: { reference: 1 }, unique: true },
  { collection: "consultations", keys: { status: 1, createdAt: -1 } },
  { collection: "signoffs", keys: { projectSlug: 1, email: 1 }, unique: true },
];

/** Key order matters for compound indexes, so compare a stable signature. */
export function indexSignature(keys: Record<string, unknown>) {
  return Object.entries(keys)
    .map(([key, value]) => `${key}:${Number(value)}`)
    .join(",");
}

type ExistingIndex = {
  key: Record<string, unknown>;
  unique?: boolean;
  expireAfterSeconds?: number;
};

export function missingRequiredIndexes(
  actual: ExistingIndex[],
  required: RequiredIndex[] = REQUIRED_DB_INDEXES,
) {
  return required.filter((wanted) => {
    const signature = indexSignature(wanted.keys);
    return !actual.some((index) => {
      if (indexSignature(index.key) !== signature) return false;
      if (wanted.unique && index.unique !== true) return false;
      if (
        wanted.expireAfterSeconds !== undefined &&
        index.expireAfterSeconds !== wanted.expireAfterSeconds
      ) {
        return false;
      }
      return true;
    });
  });
}
