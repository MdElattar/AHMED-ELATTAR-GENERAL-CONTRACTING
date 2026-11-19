import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Production deployment preflight. Validates that the environment is complete
 * without ever printing a value. Run with production variables exported:
 *
 *   npm run check:deploy
 */

const root = process.cwd();
const envPath = join(root, ".env");

if (existsSync(envPath)) {
  for (const raw of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match || process.env[match[1]] !== undefined) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, "");
    }
    process.env[match[1]] = value;
  }
}

const problems = [];
const warnings = [];
const value = (name) => (process.env[name] ?? "").trim();
const present = (name) => Boolean(value(name));

function requireValue(name, hint) {
  if (!present(name)) problems.push(`${name} is required — ${hint}`);
}

function requireSecret(name, aliases = []) {
  const resolved = [name, ...aliases].find((candidate) => value(candidate));
  if (!resolved) {
    problems.push(`${name} (or ${aliases.join("/")}) must be set to a 32+ character secret`);
    return;
  }
  if (value(resolved).length < 32) {
    problems.push(`${resolved} must be at least 32 characters`);
  }
  if (/replace-with|change-me|example/i.test(value(resolved))) {
    problems.push(`${resolved} still contains a placeholder value`);
  }
}

function hostname(input) {
  try {
    return new URL(input.includes("://") ? input : `https://${input}`).hostname;
  } catch {
    return "";
  }
}

// 1. Persistence — production never silently falls back to memory.
if (!present("MONGODB_URI") && !present("MONGODB_URL")) {
  problems.push("MONGODB_URI (or MONGODB_URL) is required in production");
}
if (/^true$/i.test(value("ALLOW_IN_MEMORY_DB"))) {
  warnings.push("ALLOW_IN_MEMORY_DB=true is ignored in production; remove it to avoid confusion");
}

// 2. Secrets.
requireSecret("AUTH_SECRET", ["JWT_SECRET", "NEXTAUTH_SECRET"]);

// 3. WebAuthn — passkeys are bound to a stable, allowlisted RP ID.
requireValue("WEBAUTHN_RP_ID", "set the bare production hostname, e.g. alattar.sa");
const rpId = hostname(value("WEBAUTHN_RP_ID"));
const defaultRpIds = new Set([
  "localhost",
  "127.0.0.1",
  "alattar.sa",
  "www.alattar.sa",
]);
const extraRpIds = value("WEBAUTHN_RP_ID_ALLOWLIST")
  .split(",")
  .map((entry) => hostname(entry.trim()) || entry.trim().toLowerCase())
  .filter(Boolean);
if (rpId && !defaultRpIds.has(rpId) && !extraRpIds.includes(rpId)) {
  problems.push(`WEBAUTHN_RP_ID "${rpId}" is not allowlisted — add it to WEBAUTHN_RP_ID_ALLOWLIST`);
}

// 4. Canonical origin and transactional email.
const siteUrl = value("NEXT_PUBLIC_SITE_URL");
if (!siteUrl) {
  problems.push("NEXT_PUBLIC_SITE_URL is required — use the canonical https:// origin");
} else if (!/^https:\/\//i.test(siteUrl)) {
  problems.push("NEXT_PUBLIC_SITE_URL must use https:// in production");
}
requireValue("RESEND_API_KEY", "OTP delivery is required for portal sign-in");
requireValue("OTP_FROM_EMAIL", "use a verified sender such as alattar@aalattar.com");

// 5. Bootstrap identity — only the placeholder check is safe after seeding.
if (/replace-with|change-me|admin@example\.com/i.test(value("ADMIN_EMAIL") + value("ADMIN_PASSWORD"))) {
  problems.push("ADMIN_EMAIL/ADMIN_PASSWORD still contain seed placeholders");
}

if (warnings.length) {
  for (const warning of warnings) console.warn(`Warning: ${warning}`);
}
if (problems.length) {
  console.error("Production environment check failed:");
  for (const problem of problems) console.error(` - ${problem}`);
  process.exit(1);
}
console.log("Production environment check passed (values not printed).");
