import { expect, test } from "@playwright/test";
import fs from "node:fs";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const TEST_IP = `203.0.113.${Math.floor(Math.random() * 200) + 20}`;
const ORIGIN = {
  Origin: BASE_URL,
  Referer: `${BASE_URL}/sign-in`,
  "X-Real-IP": TEST_IP,
};
const PASSWORD = "SecurityTest!2026";
const unique = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

test.describe("production security controls", () => {
  test("unauthenticated admin pages and APIs are blocked", async ({ page, request }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/sign-in(\?|$)/);

    const response = await request.get(`${BASE_URL}/api/admin/kpis`, { headers: ORIGIN });
    expect(response.status()).toBe(401);
  });

  test("repeated failed logins return 429", async ({ request }) => {
    let sawRateLimit = false;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await request.post(`${BASE_URL}/api/auth/sign-in`, {
        headers: ORIGIN,
        data: {
          email: `brute-${unique()}@example.com`,
          password: "DefinitelyWrong!2026",
          remember: false,
        },
      });
      if (response.status() === 429) sawRateLimit = true;
    }
    expect(sawRateLimit).toBeTruthy();
  });

  test("IDOR cross-account project access is denied with 403", async ({ playwright }) => {
    expect(fs.existsSync("tests/.auth/admin.json")).toBeTruthy();

    const admin = await playwright.request.newContext({
      baseURL: BASE_URL,
      storageState: "tests/.auth/admin.json",
      extraHTTPHeaders: ORIGIN,
    });
    const owner = await playwright.request.newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: ORIGIN,
    });
    const stranger = await playwright.request.newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: ORIGIN,
    });

    const ownerEmail = `owner-${unique()}@example.com`;
    const strangerEmail = `stranger-${unique()}@example.com`;

    for (const [context, email, name] of [
      [owner, ownerEmail, "Project Owner"],
      [stranger, strangerEmail, "Other Client"],
    ] as const) {
      const signup = await context.post(`${BASE_URL}/api/auth/sign-up`, {
        headers: ORIGIN,
        data: { name, email, company: "Security Test", password: PASSWORD },
      });
      expect(signup.ok(), `signup failed: ${await signup.text()}`).toBeTruthy();
    }

    const slug = "advanced-industries";
    const list = await admin.get(`${BASE_URL}/api/admin/projects`);
    const listed = (await list.json()) as { projects?: Record<string, unknown>[] };
    const original = listed.projects?.find((project) => project.slug === slug);
    expect(original, "seeded portal project must exist").toBeTruthy();
    const originalOwners = original?.clientEmails ?? [];

    try {
      const assigned = await admin.patch(
        `${BASE_URL}/api/admin/projects/${slug}`,
        { headers: ORIGIN, data: { clientEmails: [ownerEmail] } },
      );
      expect(assigned.ok(), `owner assignment failed: ${await assigned.text()}`).toBeTruthy();

      const ownerRead = await owner.get(`${BASE_URL}/api/portal/contract?projectSlug=${slug}`);
      expect(ownerRead.status()).toBe(200);

      const strangerRead = await stranger.get(
        `${BASE_URL}/api/portal/contract?projectSlug=${slug}`,
      );
      expect(strangerRead.status()).toBe(403);

      const strangerSign = await stranger.post(`${BASE_URL}/api/portal/contract`, {
        headers: ORIGIN,
        data: { projectSlug: slug, signatureName: "Other Client", accepted: true },
      });
      expect(strangerSign.status()).toBe(403);
    } finally {
      await admin.patch(`${BASE_URL}/api/admin/projects/${slug}`, {
        headers: ORIGIN,
        data: { clientEmails: originalOwners },
      });
    }

    await admin.dispose();
    await owner.dispose();
    await stranger.dispose();
  });

  test("NoSQL injection payloads are rejected", async ({ playwright, request }) => {
    const injected = await request.post(`${BASE_URL}/api/auth/sign-in`, {
      headers: ORIGIN,
      data: { email: { $gt: "" }, password: "Password123!" },
    });
    expect([400, 401]).toContain(injected.status());
    expect(injected.status()).not.toBe(500);

    const stranger = await playwright.request.newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: ORIGIN,
    });
    const signup = await stranger.post(`${BASE_URL}/api/auth/sign-up`, {
      headers: ORIGIN,
      data: {
        name: "Injection Client",
        email: `inject-${unique()}@example.com`,
        password: PASSWORD,
      },
    });
    expect(signup.ok()).toBeTruthy();

    const queryInjection = await stranger.get(
      `${BASE_URL}/api/portal/contract?projectSlug%5B%24gt%5D=`,
    );
    expect(queryInjection.status()).toBe(400);
    await stranger.dispose();
  });

  test("security headers are present and no secrets are rendered", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/`);
    expect(response.ok()).toBeTruthy();

    const headers = response.headers();
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["content-security-policy"]).toContain("default-src 'self'");
    expect(headers["permissions-policy"]).toContain("camera=()");

    const html = await response.text();
    for (const secret of [
      "MONGODB_URI",
      "RESEND_API_KEY",
      "WHATSAPP_TOKEN",
      "AUTH_SECRET",
      "ADMIN_PASSWORD",
    ]) {
      expect(html).not.toContain(secret);
    }
  });
});
