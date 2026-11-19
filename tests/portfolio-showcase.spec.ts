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

async function gotoEnglish(page: Page, target: string, apiFragment?: string) {
  const response = apiFragment
    ? page.waitForResponse(
        (candidate) => candidate.url().includes(apiFragment) && candidate.ok(),
        { timeout: 30_000 },
      )
    : undefined;
  await page.goto(englishUrl(target), { waitUntil: "domcontentloaded" });
  if (response) await response;
  await enforceEnglishLandscape(page);
}

async function settle(page: Page, delay = 750) {
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

async function waitForAdminShell(page: Page) {
  await expect(page.locator("main").first()).toBeVisible();
  await expect(page.locator('main[aria-busy="true"]')).toHaveCount(0);
}

async function scrollToText(page: Page, text: string) {
  const target = page.getByText(text, { exact: false }).first();
  await expect(target).toBeVisible();
  await target.scrollIntoViewIfNeeded();
}

async function selectAllProjects(page: Page) {
  // Wait for the table rows before toggling "select all": clicking while the
  // paged list is still empty leaves the controlled checkbox unchecked.
  const boxes = page.locator('[data-testid="project-select"]');
  await expect(boxes.first()).toBeVisible();

  const header = page.locator('[data-testid="select-all"]');
  if ((await header.count()) > 0 && (await header.isVisible())) {
    await header.check();
    await expect(header).toBeChecked();
    return;
  }

  const total = await boxes.count();
  expect(total).toBeGreaterThan(0);
  for (let index = 0; index < total; index += 1) {
    await boxes.nth(index).evaluate((element) => {
      const input = element as HTMLInputElement;
      if (!input.checked) input.click();
    });
  }
}

test.describe("01 — public marketing and experience", () => {
  test("English widescreen homepage hero and cinematic 3D section", async ({ page }, testInfo) => {
    await gotoEnglish(page, "/");
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    // The R3F canvas is dynamically imported and must be present in the hero.
    await expect(page.locator("canvas").first()).toBeVisible({ timeout: 30_000 });
    await settle(page, 1_500);
    await capture(page, testInfo, "01-public-homepage-hero-wide");
  });

  test("English widescreen interactive projects catalog and filters", async ({ page }, testInfo) => {
    await gotoEnglish(page, "/projects");
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    const firstProject = page.getByRole("button", { name: /View project|Project details/ }).first();
    await expect(firstProject).toBeVisible();
    await firstProject.scrollIntoViewIfNeeded();
    await settle(page, 1_000);
    await capture(page, testInfo, "01-public-projects-catalog-filters-wide");
  });

  test("English widescreen project preview modal", async ({ page }, testInfo) => {
    await gotoEnglish(page, "/projects");
    const trigger = page.getByRole("button", { name: /View project|Project details/ }).first();
    await expect(trigger).toBeVisible();
    await trigger.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await settle(page, 900);
    await capture(page, testInfo, "01-public-project-preview-modal-wide");
  });

  test("English widescreen project detail deep dive", async ({ page }, testInfo) => {
    await gotoEnglish(page, "/projects/advanced-industries");
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await expect(page.getByText("Advanced Industries Complex").first()).toBeVisible();
    await settle(page, 1_000);
    await capture(page, testInfo, "01-public-project-detail-wide");
  });

  test("English widescreen public consultation and bid form", async ({ page }, testInfo) => {
    await gotoEnglish(page, "/contact");
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    const form = page.locator("form").first();
    await expect(form).toBeVisible();
    await form.scrollIntoViewIfNeeded();
    await settle(page, 900);
    await capture(page, testInfo, "01-public-contact-bid-form-wide");
  });

  test("English widescreen executive consultation booking", async ({ page }, testInfo) => {
    await gotoEnglish(page, "/consultation");
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    const form = page.locator("form").first();
    await expect(form).toBeVisible();
    await form.scrollIntoViewIfNeeded();
    await settle(page, 900);
    await capture(page, testInfo, "01-public-consultation-booking-wide");
  });
});

test.describe("02 — client transparency portal", () => {
  test.use({ storageState: "tests/.auth/portal.json" });

  test("English widescreen portal overview with live metrics", async ({ page }, testInfo) => {
    await gotoEnglish(page, "/portal", "/api/portal/projects");
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await expect(page.getByText("Advanced Industries Complex").first()).toBeVisible();
    await settle(page, 1_100);
    await capture(page, testInfo, "02-portal-overview-metrics-wide");
  });

  test("English widescreen projects assigned to the client", async ({ page }, testInfo) => {
    await gotoEnglish(page, "/portal/projects", "/api/portal/projects");
    await expect(page.getByText("Project tracking").first()).toBeVisible();
    await expect(page.getByText("Advanced Industries Complex").first()).toBeVisible();
    await settle(page, 1_000);
    await capture(page, testInfo, "02-portal-assigned-projects-wide");
  });

  test("English widescreen live milestones and progress tracker", async ({ page }, testInfo) => {
    await gotoEnglish(page, "/portal/projects", "/api/portal/projects");
    await scrollToText(page, "Timeline");
    await settle(page, 900);
    await capture(page, testInfo, "02-portal-milestones-progress-wide");
  });

  test("English widescreen financial breakdown, invoices and payment statuses", async (
    { page },
    testInfo,
  ) => {
    await gotoEnglish(page, "/portal/financials");
    await expect(page.getByText("Financials & invoices").first()).toBeVisible();
    await expect(page.getByText("Contract value").first()).toBeVisible();
    await settle(page, 1_000);
    await capture(page, testInfo, "02-portal-financials-invoices-wide");
  });

  test("English widescreen secure contract signing with cryptographic digest", async (
    { page },
    testInfo,
  ) => {
    await gotoEnglish(page, "/portal/projects", "/api/portal/contract");
    await expect(page.getByText("Contract & digital sign-off").first()).toBeVisible();

    const signature = page.locator("#contract-signature");
    if (await signature.count()) {
      await signature.fill("Showcase Client");
      await page.locator('form input[type="checkbox"]').first().check();
      const signed = page.waitForResponse(
        (response) =>
          response.url().includes("/api/portal/contract") &&
          response.request().method() === "POST" &&
          response.ok(),
      );
      await page
        .getByRole("button", { name: /Sign contract digitally|Re-sign updated contract/ })
        .click();
      await signed;
    }

    await expect(page.getByText("Contract digest", { exact: false }).first()).toBeVisible({
      timeout: 20_000,
    });
    await scrollToText(page, "Contract & digital sign-off");
    await settle(page, 1_000);
    await capture(page, testInfo, "02-portal-contract-signing-digest-wide");
  });
});

test.describe("03 — independent admin shell and control center", () => {
  test.use({ storageState: "tests/.auth/admin.json" });

  test("English widescreen admin dashboard KPIs and budget health", async ({ page }, testInfo) => {
    await gotoEnglish(page, "/admin", "/api/admin/kpis");
    await waitForAdminShell(page);
    await expect(page.getByText("Counted where status is new")).toBeVisible();
    await settle(page, 1_000);
    await capture(page, testInfo, "03-admin-dashboard-kpis-wide");
  });

  test("English ultra-wide full projects management table", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 2560, height: 1440 });
    await gotoEnglish(page, "/admin/projects?view=table");
    await waitForAdminShell(page);
    await expect(page.locator('[data-testid="projects-toolbar"]')).toBeVisible();
    await expect(page.locator('[data-testid="projects-responsive"]')).toBeVisible();
    await settle(page, 1_000);
    await capture(page, testInfo, "03-admin-projects-table-full-wide");
  });

  test("English widescreen projects bulk actions bar", async ({ page }, testInfo) => {
    await gotoEnglish(page, "/admin/projects?view=table");
    await waitForAdminShell(page);
    await expect(page.locator('[data-testid="projects-toolbar"]')).toBeVisible();
    await selectAllProjects(page);
    await expect(page.locator('[data-testid="projects-bulk-bar"]')).toBeVisible();
    await settle(page, 600);
    await capture(page, testInfo, "03-admin-projects-bulk-actions-wide");
  });

  test("English compact widescreen projects status filters", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await gotoEnglish(page, "/admin/projects?view=table");
    await waitForAdminShell(page);
    const chips = page.locator('[data-testid="projects-status-chips"]');
    await expect(chips).toBeVisible();
    await chips.getByRole("button", { name: /Ongoing/ }).click();
    await settle(page, 800);
    await capture(page, testInfo, "03-admin-projects-status-filters-wide");
  });

  const sections = [
    { path: "/admin/milestones", label: "Milestones", name: "03-admin-milestones-management-wide" },
    { path: "/admin/contracts", label: "Contracts", name: "03-admin-contracts-management-wide" },
    {
      path: "/admin/consultations",
      label: "Consultations",
      name: "03-admin-consultations-management-wide",
    },
    { path: "/admin/inquiries", label: "Inquiries", name: "03-admin-inquiries-management-wide" },
    { path: "/admin/financials", label: "Financials", name: "03-admin-financials-wide" },
    { path: "/admin/site-content", label: "Content", name: "03-admin-content-management-wide" },
    { path: "/admin/media", label: "Media", name: "03-admin-media-library-wide" },
    { path: "/admin/audit", label: "Audit trail", name: "03-admin-audit-trail-wide" },
    { path: "/admin/maintenance", label: "Maintenance", name: "03-admin-maintenance-wide" },
  ];

  for (const section of sections) {
    test(`English widescreen ${section.label.toLowerCase()} management view`, async (
      { page },
      testInfo,
    ) => {
      await gotoEnglish(page, section.path);
      await waitForAdminShell(page);
      await expect(page.getByText(section.label, { exact: false }).first()).toBeVisible();
      await settle(page, 950);
      await capture(page, testInfo, section.name);
    });
  }
});
