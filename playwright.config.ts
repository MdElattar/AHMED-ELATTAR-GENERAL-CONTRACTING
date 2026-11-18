import { defineConfig } from "@playwright/test";
import fs from "node:fs";

// Load .env for the test process, mirroring the app's `tsx --env-file=.env`
// scripts. Real environment variables always win.
function loadEnvFile(file = ".env") {
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, "");
    }
    if (process.env[match[1]] === undefined) process.env[match[1]] = value;
  }
}

loadEnvFile();

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    channel: "chrome",
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: true,
    timeout: 180_000,
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      testMatch: /projects-.*\.spec\.ts/,
      dependencies: ["setup"],
      use: { storageState: "tests/.auth/admin.json" },
    },
    {
      name: "security",
      testMatch: /security-.*\.spec\.ts/,
      dependencies: ["setup"],
      use: { storageState: { cookies: [], origins: [] } },
    },
    {
      name: "theme",
      testMatch: /theme-.*\.spec\.ts/,
      dependencies: ["setup"],
      use: { storageState: { cookies: [], origins: [] } },
    },
    {
      name: "mobile",
      testMatch: /mobile-.*\.spec\.ts/,
      dependencies: ["setup"],
      use: { storageState: { cookies: [], origins: [] } },
    },
    {
      name: "enterprise",
      testMatch: /enterprise-.*\.spec\.ts/,
      dependencies: ["setup"],
      use: { storageState: "tests/.auth/portal.json" },
    },
    {
      name: "portal-setup",
      testMatch: /portal\.setup\.ts/,
      dependencies: ["setup"],
    },
    {
      // Portfolio captures are strictly English, landscape, and 16:9.
      // With deviceScaleFactor 2 the exported PNGs are 3840 x 2160 (4K).
      name: "portfolio",
      testMatch: /portfolio-showcase\.spec\.ts/,
      dependencies: ["setup", "portal-setup"],
      use: {
        storageState: { cookies: [], origins: [] },
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 2,
        locale: "en-US",
      },
    },
  ],
});
