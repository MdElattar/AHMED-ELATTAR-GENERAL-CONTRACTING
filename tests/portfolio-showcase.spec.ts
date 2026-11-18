import { expect, test, type Page, type TestInfo } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "portfolio-showcase");
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const EXPECTED_ASPECT = 16 / 9;
const PNG_SIGNATURE = "89504e470d0a1a0a";

/** Every capture is forced through the English locale, even when a route has its own query string. */
function englishUrl(target: string) {
  const url = new URL(target, BASE_URL);
  url.searchParams.set("lang", "en");
  return url.toString();
}

async function enforceEnglishLandscape(page: Page) {
  await expect
    .poll(async () => page.evaluate(() => document.documentElement.lang), {
      message: "portfolio captures must render the English locale",
    })
    .toBe("en");
  await expect
    .poll(async () => page.evaluate(() => document.documentElement.dir), {
      message: "portfolio captures must render LTR (landscape) layout",
    })
    .toBe("ltr");

  const viewport = page.viewportSize();
  expect(viewport, "portfolio captures require an explicit viewport").not.toBeNull();
  expect(viewport!.width, "viewport must be wider than it is tall").toBeGreaterThan(viewport!.height);
  expect(viewport!.width / viewport!.height).toBeCloseTo(EXPECTED_ASPECT, 2);
}

async function settle(page: Page, delay = 650) {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.waitForTimeout(delay);
}

async function capture(page: Page, testInfo: TestInfo, name: string) {
  await enforceEnglishLandscape(page);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const image = await page.screenshot({
    animations: "disabled",
    caret: "hide",
    timeout: 120_000,
  });

  // Guard the exported file itself, not just the browser viewport: no portrait
  // or non-16:9 asset may enter the portfolio showcase folder.
  expect(image.subarray(0, 8).toString("hex"), `${name} must be a PNG`).toBe(PNG_SIGNATURE);
  const width = image.readUInt32BE(16);
  const height = image.readUInt32BE(20);
  expect(width, `${name} must be landscape`).toBeGreaterThan(height);
  expect(width / height, `${name} must be 16:9 widescreen`).toBeCloseTo(EXPECTED_ASPECT, 2);

  const target = path.join(OUTPUT_DIR, `${name}.png`);
  fs.writeFileSync(target, image);
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
  test("English widescreen hero with procedural WebGL accent", async ({ page }, testInfo) => {
    await page.goto(englishUrl("/"), { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    // The R3F canvas is dynamically imported and must be present in the hero.
    await expect(page.locator("canvas").first()).toBeVisible({ timeout: 30_000 });
    await settle(page, 1_500);
    await capture(page, testInfo, "01-homepage-hero-wide");
  });
});

test.describe("02 — public interactive catalog", () => {
  test("English widescreen projects catalog", async ({ page }, testInfo) => {
    await page.goto(englishUrl("/projects"), { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    const firstProject = page
      .getByRole("button", { name: /View project|Project details/ })
      .first();
    await expect(firstProject).toBeVisible();
    await firstProject.scrollIntoViewIfNeeded();
    await settle(page, 1_000);
    await capture(page, testInfo, "02-projects-catalog-wide");
  });

  test("English widescreen project preview modal", async ({ page }, testInfo) => {
    await page.goto(englishUrl("/projects"), { waitUntil: "domcontentloaded" });
    const trigger = page
      .getByRole("button", { name: /View project|Project details/ })
      .first();
    await expect(trigger).toBeVisible();
    await trigger.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await settle(page, 900);
    await capture(page, testInfo, "02-projects-preview-modal-wide");
  });
});

test.describe("03 — client portal", () => {
  test.use({ storageState: "tests/.auth/portal.json" });

  test("English widescreen live milestones and financial tracker", async ({ page }, testInfo) => {
    const feed = page.waitForResponse(
      (response) => response.url().includes("/api/portal/projects") && response.ok(),
    );
    await page.goto(englishUrl("/portal"), { waitUntil: "domcontentloaded" });
    await feed;
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await expect(page.getByText("Advanced Industries Complex").first()).toBeVisible();
    await settle(page, 1_100);
    await capture(page, testInfo, "03-client-portal-dashboard-wide");
  });

  test("English widescreen secure contract signing view", async ({ page }, testInfo) => {
    const contractFeed = page.waitForResponse(
      (response) => response.url().includes("/api/portal/contract") && response.ok(),
    );
    await page.goto(englishUrl("/portal/projects"), { waitUntil: "domcontentloaded" });
    await contractFeed;
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();

    const signature = page.locator("#contract-signature");
    if (await signature.count()) {
      await signature.fill("Showcase Client");
      await page.locator('form input[type="checkbox"]').first().check();
      await expect(signature).toBeVisible();
      await signature.scrollIntoViewIfNeeded();
    } else {
      await page.getByText("Contract & digital sign-off").first().scrollIntoViewIfNeeded();
    }
    await settle(page, 900);
    await capture(page, testInfo, "06-contract-signing-view-wide");
  });
});

test.describe("04 — admin control center", () => {
  test.use({ storageState: "tests/.auth/admin.json" });

  test("English widescreen dark luxury KPI overview", async ({ page }, testInfo) => {
    const kpis = page.waitForResponse(
      (response) => response.url().includes("/api/admin/kpis") && response.ok(),
    );
    await page.goto(englishUrl("/admin"), { waitUntil: "domcontentloaded" });
    await kpis;
    await expect(page.getByText("Counted where status is new")).toBeVisible();
    await settle(page, 1_000);
    await capture(page, testInfo, "04-admin-dashboard-wide");
  });

  test("English widescreen projects table and bulk bar", async ({ page }, testInfo) => {
    await page.goto(englishUrl("/admin/projects?view=table"), { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-testid="projects-toolbar"]')).toBeVisible();
    await expect(page.locator('[data-testid="projects-responsive"]')).toBeVisible();
    await settle(page, 900);

    await selectAllProjects(page);
    await expect(page.locator('[data-testid="projects-bulk-bar"]')).toBeVisible();
    await settle(page, 500);
    await capture(page, testInfo, "05-admin-projects-bulk-bar-wide");
  });
});
