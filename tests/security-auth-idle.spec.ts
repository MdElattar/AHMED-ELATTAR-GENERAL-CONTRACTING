import { expect, test, type Page } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const PASSWORD = "IdleGuard!2026";
const unique = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const testIp = () => `198.51.100.${Math.floor(Math.random() * 200) + 20}`;
const IDLE_WARNING_MS = 10 * 60 * 1000 + 2_000;
const TIMEOUT_MS = 61_000;

async function waitForAuthenticatedPage(page: Page) {
  await expect
    .poll(() => page.evaluate(() => window.localStorage.getItem("alattar-portal-user")))
    .not.toBeNull();
}

test.describe("idle session protection", () => {
  test("warns admins after 10 minutes, resets on stay, then signs out", async ({
    context,
    page,
  }) => {
    const email = `idle-admin-${unique()}@example.com`;
    const signup = await context.request.post(`${BASE_URL}/api/auth/sign-up`, {
      data: { name: "Idle Admin", email, company: "Idle Test", password: PASSWORD },
      headers: {
        Origin: BASE_URL,
        Referer: `${BASE_URL}/sign-up`,
        "X-Real-IP": testIp(),
      },
    });
    expect(signup.ok(), `admin sign-up failed: ${await signup.text()}`).toBeTruthy();

    await page.route("**/api/auth/session", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            name: "Idle Admin",
            email,
            company: "Idle Test",
            accountId: "IDLE-1",
            role: "admin",
            passkeyEnrolled: true,
            primaryAdmin: false,
          },
        }),
      });
    });

    await page.clock.install();
    await page.goto("/portal");
    await waitForAuthenticatedPage(page);
    await expect(page.getByTestId("idle-warning")).toHaveCount(0);

    await page.clock.fastForward(IDLE_WARNING_MS);
    await expect(page.getByTestId("idle-warning")).toHaveCount(1);
    await expect(page.getByTestId("idle-countdown")).toBeVisible();

    // Extra ticks in the same cycle must not stack another dialog.
    await page.clock.fastForward(2_000);
    await expect(page.getByTestId("idle-warning")).toHaveCount(1);

    await page.getByTestId("idle-stay-signed-in").click();
    await expect(page.getByTestId("idle-warning")).toHaveCount(0);

    // The cycle restarts from the click: no immediate second appearance.
    await page.clock.fastForward(IDLE_WARNING_MS - 5_000);
    await expect(page.getByTestId("idle-warning")).toHaveCount(0);
    await page.clock.fastForward(6_000);
    await expect(page.getByTestId("idle-warning")).toHaveCount(1);

    await page.clock.fastForward(TIMEOUT_MS);
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("client sessions are never warned or signed out for inactivity", async ({
    context,
    page,
  }) => {
    const email = `idle-client-${unique()}@example.com`;
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
            accountId: "IDLE-CLIENT",
            role: "client",
            passkeyEnrolled: true,
            primaryAdmin: false,
          },
        }),
      });
    });

    await page.clock.install();
    await page.goto("/portal");
    await waitForAuthenticatedPage(page);
    await page.clock.fastForward(12 * 60 * 1000);

    await expect(page.getByTestId("idle-warning")).toHaveCount(0);
    await expect(page).toHaveURL(/\/portal/);
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
    await waitForAuthenticatedPage(page);
    await expect(page.getByTestId("idle-warning")).toHaveCount(0);

    await page.evaluate(() => {
      const channel = new BroadcastChannel("alattar-session-channel");
      channel.postMessage({ type: "logout", at: Date.now() });
      channel.close();
    });

    await expect(page).toHaveURL(/\/sign-in/);
  });
});
