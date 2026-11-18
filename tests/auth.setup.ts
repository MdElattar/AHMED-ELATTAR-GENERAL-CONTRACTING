import { expect, test as setup } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const authFile = "tests/.auth/admin.json";
// Isolate the test run from the in-memory limiter's shared local bucket.
const TEST_IP = `198.51.100.${Math.floor(Math.random() * 200) + 20}`;

setup("authenticate as admin", async ({ request }) => {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env (or the environment) to run the e2e tests.");
  }
  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  const response = await request.post(`${BASE_URL}/api/auth/sign-in`, {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, remember: true },
    headers: {
      Origin: BASE_URL,
      Referer: `${BASE_URL}/sign-in`,
      "X-Real-IP": TEST_IP,
    },
  });
  expect(response.ok(), `admin sign-in failed: ${response.status()} ${await response.text()}`).toBeTruthy();
  await request.storageState({ path: authFile });
});
