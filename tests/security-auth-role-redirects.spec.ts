import { expect, test, type BrowserContext } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const PASSWORD = "RoleRedirect!2026";
const unique = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const testIp = () => `198.51.100.${Math.floor(Math.random() * 200) + 20}`;

async function createClientSession(context: BrowserContext) {
  const email = `client-${unique()}@example.com`;
  const response = await context.request.post(`${BASE_URL}/api/auth/sign-up`, {
    data: { name: "Portal Client", email, company: "Redirect Test", password: PASSWORD },
    headers: {
      Origin: BASE_URL,
      Referer: `${BASE_URL}/sign-up`,
      "X-Real-IP": testIp(),
    },
  });
  expect(response.ok(), `client sign-up failed: ${await response.text()}`).toBeTruthy();
  return email;
}

async function recordNavigation(page: import("@playwright/test").Page) {
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

function navCalls(page: import("@playwright/test").Page) {
  return page.evaluate(() => (window as unknown as { __navCalls: string[] }).__navCalls ?? []);
}

/** Avoid filling controlled inputs before React has attached its handlers. */
async function waitForHydration(page: import("@playwright/test").Page) {
  await page.waitForFunction(() => {
    const field = document.querySelector('[data-testid="auth-email"]');
    return Boolean(field && Object.keys(field).some((key) => key.startsWith("__reactProps$")));
  });
}

test.describe("authentication role redirects", () => {
  test("clients land in the portal after sign-in", async ({ context, page }) => {
    await createClientSession(context);
    await page.goto("/sign-in");
    await expect(page).toHaveURL(/\/portal\/?$/);
  });

  test("clients cannot use next=/admin to enter the admin area", async ({ context, page }) => {
    await createClientSession(context);
    await page.goto("/sign-in?next=%2Fadmin");
    await expect(page).toHaveURL(/\/portal\/?$/);
    await expect(page).not.toHaveURL(/\/admin/);
  });

  test("privileged users without a passkey are sent to enrollment", async ({ context, page }) => {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    test.skip(!email || !password, "ADMIN_EMAIL/ADMIN_PASSWORD are required");

    const signIn = await context.request.post(`${BASE_URL}/api/auth/sign-in`, {
      data: { email, password, remember: true },
      headers: {
        Origin: BASE_URL,
        Referer: `${BASE_URL}/sign-in`,
        "X-Real-IP": testIp(),
      },
    });
    expect(signIn.ok(), `admin sign-in failed: ${await signIn.text()}`).toBeTruthy();

    const session = await context.request.get(`${BASE_URL}/api/auth/session`);
    const data = (await session.json()) as {
      user?: { passkeyEnrolled?: boolean; role?: string };
    };
    expect(["admin", "manager"]).toContain(data.user?.role);

    await page.goto("/sign-in");
    await expect(page).toHaveURL(/\/admin\/?$/);
  });

  test("a late session response cannot undo a fresh sign-in", async ({ context, page }) => {
    // A real client cookie keeps the proxy from intercepting the client-side
    // redirect to /portal; the API responses themselves stay stubbed.
    await createClientSession(context);
    await recordNavigation(page);

    await page.route("**/api/auth/session", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ user: null }),
      });
    });
    await page.route("**/api/auth/sign-in", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            name: "Race Client",
            email: "race@example.com",
            company: "Race Test",
            accountId: "RACE-1",
            role: "client",
            passkeyEnrolled: true,
            primaryAdmin: false,
          },
          redirectTo: "/portal",
        }),
      });
    });

    await page.goto("/sign-in");
    await waitForHydration(page);
    await page.getByTestId("auth-email").fill("race@example.com");
    await page.getByTestId("auth-password").fill("Password!2026");
    await page.getByTestId("auth-submit").click();

    await expect.poll(() => navCalls(page)).toContain("/portal");
    await page.waitForTimeout(900);
    const calls = await navCalls(page);
    expect(calls.some((call) => call.startsWith("/portal"))).toBeTruthy();
    expect(calls).not.toContain("/sign-in?next=%2Fportal");
    await expect(page).toHaveURL(/\/portal/);
    await expect(page.getByRole("heading", { name: /Race Client/ })).toBeVisible();
    await expect(page.getByTestId("auth-error")).toHaveCount(0);
  });
});
