import { expect, test, type Page } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const PASSWORD = "IdleGuard!2026";
const unique = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const testIp = () => `198.51.100.${Math.floor(Math.random() * 200) + 20}`;
const WARNING_MS = 14 * 60 * 1000 + 2_000;
const TIMEOUT_MS = 61_000;

async function waitForIdleGuard(page: Page) {
  await expect
    .poll(() => page.evaluate(() => window.localStorage.getItem("alattar-session-activity")))
    .not.toBeNull();
}

test.describe("idle session protection", () => {
  test("warns after 14 minutes, stays on interaction, then signs out", async ({
    context,
    page,
  }) => {
    const email = `idle-${unique()}@example.com`;
    const signup = await context.request.post(`${BASE_URL}/api/auth/sign-up`, {
      data: { name: "Idle Client", email, company: "Idle Test", password: PASSWORD },
      headers: {
        Origin: BASE_URL,
        Referer: `${BASE_URL}/sign-up`,
        "X-Real-IP": testIp(),
      },
    });
    expect(signup.ok(), `client sign-up failed: ${await signup.text()}`).toBeTruthy();

    await page.route("**/api/auth/session", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            name: "Idle Client",
            email,
            company: "Idle Test",
            accountId: "IDLE-1",
            role: "client",
            passkeyEnrolled: true,
            primaryAdmin: false,
          },
        }),
      });
    });

    await page.clock.install();
    await page.goto("/portal");
    await waitForIdleGuard(page);
    await expect(page.getByTestId("idle-warning")).toHaveCount(0);

    await page.clock.fastForward(WARNING_MS);
    await expect(page.getByTestId("idle-warning")).toBeVisible();
    await expect(page.getByTestId("idle-countdown")).toBeVisible();

    await page.getByTestId("idle-stay-signed-in").click();
    await expect(page.getByTestId("idle-warning")).toHaveCount(0);

    await page.clock.fastForward(WARNING_MS);
    await expect(page.getByTestId("idle-warning")).toBeVisible();

    await page.clock.fastForward(TIMEOUT_MS);
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("a logout signal in another tab ends the session here", async ({ context, page }) => {
    const email = `idle-tabs-${unique()}@example.com`;
    const signup = await context.request.post(`${BASE_URL}/api/auth/sign-up`, {
      data: { name: "Tab Client", email, company: "Idle Test", password: PASSWORD },
      headers: {
        Origin: BASE_URL,
        Referer: `${BASE_URL}/sign-up`,
        "X-Real-IP": testIp(),
      },
    });
    expect(signup.ok(), `client sign-up failed: ${await signup.text()}`).toBeTruthy();

    await page.route("**/api/auth/session", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            name: "Tab Client",
            email,
            company: "Idle Test",
            accountId: "IDLE-2",
            role: "client",
            passkeyEnrolled: true,
            primaryAdmin: false,
          },
        }),
      });
    });

    await page.goto("/portal");
    await waitForIdleGuard(page);
    await expect(page.getByTestId("idle-warning")).toHaveCount(0);

    await page.evaluate(() => {
      const channel = new BroadcastChannel("alattar-session-channel");
      channel.postMessage({ type: "logout", at: Date.now() });
      channel.close();
    });

    await expect(page).toHaveURL(/\/sign-in/);
  });
});
