import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const unique = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const testIp = () => `198.51.100.${Math.floor(Math.random() * 200) + 20}`;

async function createClientSession(context: BrowserContext) {
  const response = await context.request.post(`${BASE_URL}/api/auth/sign-up`, {
    data: {
      name: "Passkey Client",
      email: `passkey-client-${unique()}@example.com`,
      company: "Passkey Test",
      password: "PasskeyTest!2026",
    },
    headers: {
      Origin: BASE_URL,
      Referer: `${BASE_URL}/sign-up`,
      "X-Real-IP": testIp(),
    },
  });
  expect(response.ok(), `client sign-up failed: ${await response.text()}`).toBeTruthy();
}

type Role = "client" | "admin";

function sessionUser(role: Role, passkeyEnrolled: boolean) {
  return {
    name: "Passkey Test",
    email: role === "admin" ? "admin-passkey@example.com" : "client-passkey@example.com",
    company: "Passkey Test Co",
    accountId: role === "admin" ? "ADM-1" : "CLI-1",
    role,
    passkeyEnrolled,
    primaryAdmin: false,
  };
}

async function stubSession(page: Page, role: Role, passkeyEnrolled: boolean) {
  await page.route("**/api/auth/session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ user: sessionUser(role, passkeyEnrolled) }),
    });
  });
}

async function recordNavigation(page: Page) {
  await page.addInitScript(() => {
    const calls: string[] = [];
    Object.defineProperty(window, "__navCalls", { value: calls, configurable: true });
    const original = window.history.replaceState.bind(window.history);
    window.history.replaceState = (state, unused, url) => {
      calls.push(String(url ?? ""));
      return original(state, unused, url);
    };
  });
}

function navCalls(page: Page) {
  return page.evaluate(() => (window as unknown as { __navCalls: string[] }).__navCalls ?? []);
}

async function addVirtualAuthenticator(page: Page) {
  const client = await page.context().newCDPSession(page);
  await client.send("WebAuthn.enable");
  await client.send("WebAuthn.addVirtualAuthenticator", {
    options: {
      protocol: "ctap2",
      transport: "internal",
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });
  return client;
}

test.describe("passkey UX", () => {
  test("unsupported browsers see a clear passkey message", async ({ page }) => {
    await page.addInitScript(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).PublicKeyCredential;
    });
    await page.route("**/api/auth/session", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ user: null }),
      });
    });

    await page.goto("/sign-in");
    await expect(page.locator("main").getByTestId("webauthn-unsupported")).toBeVisible();
    await expect(page.locator("main").getByTestId("passkey-sign-in")).toBeDisabled();
  });

  test("privileged users cannot dismiss passkey enrollment", async ({ page }) => {
    await stubSession(page, "admin", false);
    await page.goto("/passkey-enroll?next=%2Fadmin");

    await expect(page.getByTestId("passkey-enroll-form")).toBeVisible();
    await expect(page.getByTestId("passkey-device-name")).toBeVisible();
    await expect(page.getByTestId("passkey-enroll-remind")).toHaveCount(0);
    await expect(page.getByTestId("passkey-enroll-sign-out")).toBeVisible();
  });

  test("clients can remind later and the count is remembered", async ({ context, page }) => {
    await createClientSession(context);
    await stubSession(page, "client", false);
    await recordNavigation(page);
    await page.goto("/passkey-enroll");

    await expect(page.getByTestId("passkey-enroll-remind")).toBeVisible();
    await page.getByTestId("passkey-enroll-remind").click();

    const count = await page.evaluate(() =>
      window.localStorage.getItem("alattar-passkey-reminder-count"),
    );
    expect(count).toBe("1");
    await expect.poll(() => navCalls(page)).toContain("/portal");
  });

  test("enrollment shows backup codes and continues to the admin area", async ({ page }) => {
    await stubSession(page, "admin", false);
    const host = new URL(BASE_URL).hostname;
    const challenge = Buffer.from("passkey-enrollment-challenge").toString("base64url");
    const userId = Buffer.from("admin-passkey@example.com").toString("base64url");

    await page.route("**/api/auth/passkey/register/options", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          options: {
            rp: { name: "Alattar Test", id: host },
            user: { id: userId, name: "admin-passkey@example.com", displayName: "Passkey Test" },
            challenge,
            pubKeyCredParams: [{ type: "public-key", alg: -7 }],
            timeout: 60_000,
            attestation: "none",
            authenticatorSelection: {
              residentKey: "required",
              userVerification: "required",
            },
          },
        }),
      });
    });
    await page.route("**/api/auth/passkey/register/verify", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          passkey: {
            credentialId: "test-credential",
            createdAt: new Date().toISOString(),
            deviceName: "Test device",
            deviceType: "singleDevice",
            backedUp: false,
          },
          user: sessionUser("admin", true),
          redirectTo: "/admin",
          backupCodes: ["ABCD-EFGH", "IJKL-MNOP", "QRST-UVWX"],
        }),
      });
    });

    const adminRequests: string[] = [];
    await page.route("**/admin**", async (route) => {
      adminRequests.push(route.request().url());
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<!doctype html><html><body><h1>Admin</h1></body></html>",
      });
    });

    let cdp: Awaited<ReturnType<typeof addVirtualAuthenticator>> | undefined;
    try {
      await page.goto("/passkey-enroll?next=%2Fadmin");
      cdp = await addVirtualAuthenticator(page);
      await page.getByTestId("passkey-device-name").fill("Test device");
      await page.getByTestId("passkey-enroll-create").click();

      await expect(page.getByTestId("passkey-enroll-success")).toBeVisible();
      await expect(page.getByTestId("backup-codes-panel")).toBeVisible();
      await expect(page.getByText("ABCD-EFGH")).toBeVisible();
      await expect(page.getByTestId("backup-codes-download")).toBeVisible();

      await page.getByTestId("passkey-enroll-continue").click();
      await expect.poll(() => adminRequests.length).toBeGreaterThan(0);
      await expect(page).toHaveURL(/\/admin\/?$/);
    } finally {
      await cdp?.detach();
    }
  });
});
