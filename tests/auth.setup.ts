import { expect, test as setup } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const authFile = "tests/.auth/admin.json";
// Isolate the test run from the in-memory limiter's shared local bucket.
const TEST_IP = `198.51.100.${Math.floor(Math.random() * 200) + 20}`;

setup("authenticate as admin", async ({ browser, request }) => {
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
  const signInText = await response.text();
  expect(response.ok(), `admin sign-in failed: ${response.status()} ${signInText}`).toBeTruthy();
  const signInBody = JSON.parse(signInText) as { user?: { passkeyEnrolled?: boolean } };

  // Privileged sessions must carry a real passkey: the proxy enforces
  // enrollment on /admin and every /api/admin route. Enroll one in a virtual
  // authenticator on first use; later runs reuse the persisted credential.
  const signedIn = await request.storageState();
  const temporaryState = path.join(
    os.tmpdir(),
    `alattar-admin-signed-in-${process.pid}.json`,
  );
  fs.writeFileSync(temporaryState, JSON.stringify(signedIn));
  const context = await browser.newContext({ baseURL: BASE_URL, storageState: temporaryState });

  let cdp: Awaited<ReturnType<typeof context.newCDPSession>> | undefined;
  try {
    if (signInBody.user?.passkeyEnrolled === true) {
      await context.storageState({ path: authFile });
      return;
    }

    const page = await context.newPage();
    await page.goto(`${BASE_URL}/passkey-enroll?next=%2Fadmin`, {
      waitUntil: "domcontentloaded",
    });
    const deviceName = page.getByTestId("passkey-device-name");
    await expect(deviceName).toBeVisible();

    // Attach after navigation: virtual authenticators are target-scoped and
    // a cross-document navigation drops the registration.
    cdp = await context.newCDPSession(page);
    await cdp.send("WebAuthn.enable");
    await cdp.send("WebAuthn.addVirtualAuthenticator", {
      options: {
        protocol: "ctap2",
        transport: "internal",
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: true,
        automaticPresenceSimulation: true,
      },
    });

    await deviceName.fill("E2E admin device");
    await page.getByTestId("passkey-enroll-create").click();
    await expect(page.getByTestId("passkey-enroll-success")).toBeVisible();
    await context.storageState({ path: authFile });
  } finally {
    await cdp?.detach();
    await context.close();
    fs.rmSync(temporaryState, { force: true });
  }
});
