import { expect, test } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";
const PASSWORD = "AccountTest!2026";
const unique = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const testIp = () => `203.0.113.${Math.floor(Math.random() * 200) + 20}`;

async function createClientAccount(request: import("@playwright/test").APIRequestContext) {
  const email = `admin-managed-${unique()}@example.com`;
  const response = await request.post(`${BASE_URL}/api/auth/sign-up`, {
    data: {
      name: "Managed Client",
      email,
      company: "Account Tests",
      password: PASSWORD,
    },
    headers: {
      Origin: BASE_URL,
      Referer: `${BASE_URL}/sign-up`,
      "X-Real-IP": testIp(),
    },
  });
  expect(response.ok(), `sign-up failed: ${await response.text()}`).toBeTruthy();
  return email;
}

async function directoryRequest(
  request: import("@playwright/test").APIRequestContext,
  email: string,
  excludeTest: boolean,
) {
  const params = new URLSearchParams({
    page: "1",
    limit: "5",
    role: "client",
    query: email.split("@")[0],
    excludeTest: excludeTest ? "1" : "0",
  });
  const response = await request.get(`${BASE_URL}/api/admin/access?${params.toString()}`, {
    headers: { Origin: BASE_URL, "X-Real-IP": testIp() },
  });
  expect(response.ok(), `directory failed: ${await response.text()}`).toBeTruthy();
  return (await response.json()) as {
    users?: { email?: string }[];
    page?: number;
    limit?: number;
    pages?: number;
    total?: number;
    primaryAdmin?: string;
  };
}

test.describe("primary-admin account management", () => {
  test("account directory is paginated and hides synthetic accounts by default", async ({
    context,
    request,
  }) => {
    const email = await createClientAccount(request);

    const visible = await directoryRequest(context.request, email, false);
    expect(visible.page).toBe(1);
    expect(visible.limit).toBe(5);
    expect(typeof visible.pages).toBe("number");
    expect(visible.primaryAdmin?.toLowerCase()).toBe(ADMIN_EMAIL);
    expect(visible.users?.some((user) => user.email === email)).toBe(true);

    const filtered = await directoryRequest(context.request, email, true);
    expect(filtered.users?.some((user) => user.email === email)).toBe(false);
  });

  test("removal requires the Primary Admin password and deletes only the target", async ({
    context,
    request,
  }) => {
    expect(ADMIN_EMAIL, "ADMIN_EMAIL must be configured").toBeTruthy();
    expect(ADMIN_PASSWORD, "ADMIN_PASSWORD must be configured").toBeTruthy();
    const email = await createClientAccount(request);

    const wrong = await context.request.post(`${BASE_URL}/api/admin/access/remove`, {
      data: { email, primaryPassword: `wrong-${PASSWORD}` },
      headers: { Origin: BASE_URL, "X-Real-IP": testIp() },
    });
    expect(wrong.status()).toBe(401);

    const removed = await context.request.post(`${BASE_URL}/api/admin/access/remove`, {
      data: { email, primaryPassword: ADMIN_PASSWORD },
      headers: { Origin: BASE_URL, "X-Real-IP": testIp() },
    });
    expect(removed.ok(), `remove failed: ${await removed.text()}`).toBeTruthy();
    expect((await removed.json()).removed).toBe(true);

    const after = await directoryRequest(context.request, email, false);
    expect(after.users?.some((user) => user.email === email)).toBe(false);
  });
});
