import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];

function tracked(pattern) {
  try {
    return execFileSync("git", ["ls-files", pattern], { cwd: root, encoding: "utf8" })
      .split("\n")
      .filter(Boolean);
  } catch {
    return [];
  }
}

// 1. Real env files must never be tracked.
for (const file of tracked(".env*")) {
  if (file !== ".env.example") failures.push(`Tracked env file: ${file}`);
}
if (existsSync(join(root, ".env"))) {
  try {
    execFileSync("git", ["check-ignore", "-q", ".env"], { cwd: root, stdio: "ignore" });
  } catch {
    failures.push(".env exists but is not ignored by git");
  }
}

// 2. Server-only secrets must not appear in client bundles or public assets.
const secretNames = [
  "MONGODB_URI",
  "MONGODB_URL",
  "RESEND_API_KEY",
  "WHATSAPP_TOKEN",
  "WHATSAPP_WEBHOOK_TOKEN",
  "AUTH_SECRET",
  "JWT_SECRET",
  "NEXTAUTH_SECRET",
  "ADMIN_PASSWORD",
];
const clientFiles = [...tracked("src/**/*.ts"), ...tracked("src/**/*.tsx"), ...tracked("public/*")];
for (const file of clientFiles) {
  const absolute = join(root, file);
  const source = readFileSync(absolute, "utf8");
  const isClient = source.includes('"use client"') || file.startsWith("public/");
  if (!isClient) continue;
  for (const name of secretNames) {
    if (source.includes(`process.env.${name}`)) {
      failures.push(`${name} referenced in client code: ${file}`);
    }
  }
}

// 3. No credential-looking literals in tracked source (example file excluded).
const credentialPattern =
  /(mongodb(?:\+srv)?:\/\/[^"'\s]+:[^"'\s]+@|(?:re_|sk_)[A-Za-z0-9_-]{16,}|eyJ[A-Za-z0-9_-]{20,})/g;
for (const file of tracked("src/**/*").concat(tracked("scripts/*"), tracked("*.ts"), tracked("*.js"))) {
  if (file === ".env.example") continue;
  try {
    const source = readFileSync(join(root, file), "utf8");
    if (credentialPattern.test(source)) failures.push(`Credential-like literal in ${file}`);
    credentialPattern.lastIndex = 0;
  } catch {
    // Directories or deleted files are ignored.
  }
}

// 4. .env.example must use placeholders for the super-admin password.
const example = readFileSync(join(root, ".env.example"), "utf8");
if (!/ADMIN_PASSWORD=replace-with-a-long-random-password/.test(example)) {
  failures.push(".env.example ADMIN_PASSWORD is not a placeholder");
}

if (failures.length) {
  console.error("Security scan failed:");
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}
console.log("Security scan passed: no exposed secrets or tracked env files.");
