import { expect, test, type Page, type TestInfo } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "portfolio-showcase");
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

type ShotOptions = {
  fullPage?: boolean;
};

async function settle(page: Page, delay = 650) {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.waitForTimeout(delay);
}

async function capture(page: Page, testInfo: TestInfo, name: string, options: ShotOptions = {}) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const target = path.join(OUTPUT_DIR, `${name}.png`);
  await page.screenshot({
    path: target,
    fullPage: options.fullPage ?? false,
    animations: "disabled",
    caret: "hide",
    timeout: 120_000,
  });
  await testInfo.attach(name, { path: target, contentType: "image/png" });
}

async function selectAllProjects(page: Page) {
  const header = page.locator('[data-testid="select-all"]');
  if ((await header.count()) > 0 && (await header.isVisible())) {
    await header.check();
    return;
  }

  const boxes = page.locator('[data-testid="project-select"]');
  const total = await boxes.count();
  expect(total).toBeGreaterThan(0);
  for (let index = 0; index < total; index += 1) {
    await boxes.nth(index).evaluate((element) => {
      const input = element as HTMLInputElement;
      if (!input.checked) input.click();
    });
  }
}

test.describe("01 — public homepage", () => {
  test("hero with procedural WebGL accent and cinematic intro", async ({ page }, testInfo) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    // The R3F canvas is dynamically imported and must be present in the hero.
    await expect(page.locator("canvas").first()).toBeVisible({ timeout: 30_000 });
    await settle(page, 1_500);
    await capture(page, testInfo, "01-home-hero-ar");

    await page.goto(`${BASE_URL}/?lang=en`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await expect(page.locator("canvas").first()).toBeVisible({ timeout: 30_000 });
    await settle(page, 1_200);
    await capture(page, testInfo, "01-home-hero-en");
  });
});

test.describe("02 — public interactive catalog", () => {
  test("projects catalog full page", async ({ page }, testInfo) => {
    await page.goto(`${BASE_URL}/projects`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: /عرض المشروع|تفاصيل المشروع|View project|Project details/ }).first(),
    ).toBeVisible();
    await settle(page, 1_000);
    await capture(page, testInfo, "02-projects-catalog", { fullPage: true });
  });

  test("interactive project preview modal", async ({ page }, testInfo) => {
    await page.goto(`${BASE_URL}/projects?lang=en`, { waitUntil: "domcontentloaded" });
    const trigger = page
      .getByRole("button", { name: /View project|Project details/ })
      .first();
    await expect(trigger).toBeVisible();
    await trigger.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await settle(page, 900);
    await capture(page, testInfo, "02-projects-preview-modal");
  });
});

test.describe("03 — client portal", () => {
  test.use({ storageState: "tests/.auth/portal.json" });

  test("live milestones and financial tracker dashboard", async ({ page }, testInfo) => {
    const feed = page.waitForResponse(
      (response) => response.url().includes("/api/portal/projects") && response.ok(),
    );
    await page.goto(`${BASE_URL}/portal`, { waitUntil: "domcontentloaded" });
    await feed;
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await expect(page.getByText("مجمع الصناعات المتقدمة").first()).toBeVisible();
    await settle(page, 1_100);
    await capture(page, testInfo, "03-client-portal-dashboard", { fullPage: true });
  });

  test("secure contract signing panel", async ({ page }, testInfo) => {
    const contractFeed = page.waitForResponse(
      (response) => response.url().includes("/api/portal/contract") && response.ok(),
    );
    await page.goto(`${BASE_URL}/portal/projects`, { waitUntil: "domcontentloaded" });
    await contractFeed;
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();

    const signature = page.locator("#contract-signature");
    if (await signature.count()) {
      await signature.fill("Showcase Client");
      await page.locator('form input[type="checkbox"]').first().check();
      await expect(signature).toBeVisible();
      await signature.scrollIntoViewIfNeeded();
    }
    await settle(page, 900);
    await capture(page, testInfo, "06-client-contract-signing");
    await capture(page, testInfo, "06-client-contract-signing-full", { fullPage: true });
  });
});

test.describe("04 — admin control center", () => {
  test.use({ storageState: "tests/.auth/admin.json" });

  test("dark luxury overview with live KPIs", async ({ page }, testInfo) => {
    const kpis = page.waitForResponse(
      (response) => response.url().includes("/api/admin/kpis") && response.ok(),
    );
    await page.goto(`${BASE_URL}/admin`, { waitUntil: "domcontentloaded" });
    await kpis;
    await expect(page.getByText(/حسب الحالة: جديد|Counted where status is new/)).toBeVisible();
    await settle(page, 1_000);
    await capture(page, testInfo, "04-admin-dashboard", { fullPage: true });
  });

  test("projects table and bulk bar across breakpoints", async ({ page }, testInfo) => {
    await page.goto(`${BASE_URL}/admin/projects?view=table`, { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-testid="projects-toolbar"]')).toBeVisible();
    await expect(page.locator('[data-testid="projects-responsive"]')).toBeVisible();
    await settle(page, 900);
    await capture(page, testInfo, "05-admin-projects-table-full", { fullPage: true });

    await selectAllProjects(page);
    await expect(page.locator('[data-testid="projects-bulk-bar"]')).toBeVisible();
    await settle(page, 500);
    await capture(page, testInfo, "05-admin-projects-bulk-desktop");

    await page.setViewportSize({ width: 768, height: 1024 });
    await settle(page, 650);
    await expect(page.locator('[data-testid="projects-bulk-bar"]')).toBeVisible();
    await capture(page, testInfo, "05-admin-projects-bulk-tablet");

    await page.setViewportSize({ width: 390, height: 844 });
    await settle(page, 650);
    await expect(page.locator('[data-testid="projects-bulk-bar"]')).toBeVisible();
    await capture(page, testInfo, "05-admin-projects-bulk-mobile");
  });
});
