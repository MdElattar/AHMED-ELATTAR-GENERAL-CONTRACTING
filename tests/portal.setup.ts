import { expect, test as setup } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const ADMIN_AUTH = "tests/.auth/admin.json";
const PORTAL_AUTH = "tests/.auth/portal.json";
const CLIENT_EMAIL =
  process.env.PORTFOLIO_CLIENT_EMAIL ?? "showcase.client@alattar.example";
const CLIENT_PASSWORD = process.env.PORTFOLIO_CLIENT_PASSWORD ?? "Showcase!2026";
const PORTFOLIO_SLUGS = ["advanced-industries", "al-hijr-hotel", "marina-quarter"];
const TEST_IP = `203.0.113.${Math.floor(Math.random() * 200) + 20}`;
const HEADERS = {
  Origin: BASE_URL,
  Referer: `${BASE_URL}/sign-in`,
  "X-Real-IP": TEST_IP,
};

/**
 * Provisions a deterministic client identity for the portfolio screenshots.
 * Ownership is attached to the seeded portal projects through the same
 * admin-only API the product uses, so the captured views are live data rather
 * than mocked fixtures.
 */
setup("authenticate as portal showcase client", async ({ playwright }) => {
  expect(fs.existsSync(ADMIN_AUTH), "run the admin setup project first").toBeTruthy();

  const admin = await playwright.request.newContext({
    baseURL: BASE_URL,
    storageState: ADMIN_AUTH,
    extraHTTPHeaders: HEADERS,
  });
  const client = await playwright.request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: HEADERS,
  });

  const signup = await client.post(`${BASE_URL}/api/auth/sign-up`, {
    headers: HEADERS,
    data: {
      name: "Showcase Client",
      company: "Portfolio Preview",
      email: CLIENT_EMAIL,
      password: CLIENT_PASSWORD,
    },
  });

  if (!signup.ok()) {
    const signin = await client.post(`${BASE_URL}/api/auth/sign-in`, {
      headers: HEADERS,
      data: { email: CLIENT_EMAIL, password: CLIENT_PASSWORD, remember: true },
    });
    expect(
      signin.ok(),
      `portal showcase sign-in failed: ${signin.status()} ${await signin.text()}`,
    ).toBeTruthy();
  }

  const listed = await admin.get(`${BASE_URL}/api/admin/projects`);
  expect(listed.ok(), `project list failed: ${listed.status()}`).toBeTruthy();
  const payload = (await listed.json()) as { projects?: Record<string, unknown>[] };
  const projects = payload.projects ?? [];

  for (const slug of PORTFOLIO_SLUGS) {
    const project = projects.find((item) => item.slug === slug);
    expect(project, `seeded project ${slug} must exist`).toBeTruthy();

    const existing = Array.isArray(project?.clientEmails) ? project!.clientEmails : [];
    const owners = new Set(
      existing.filter((value): value is string => typeof value === "string" && value.length > 0),
    );
    owners.add(CLIENT_EMAIL);

    const patched = await admin.patch(`${BASE_URL}/api/admin/projects/${slug}`, {
      headers: HEADERS,
      data: { clientEmails: [...owners] },
    });
    expect(patched.ok(), `ownership assignment failed for ${slug}: ${await patched.text()}`).toBeTruthy();
  }

  fs.mkdirSync(path.dirname(PORTAL_AUTH), { recursive: true });
  await client.storageState({ path: PORTAL_AUTH });
  await admin.dispose();
  await client.dispose();
});
