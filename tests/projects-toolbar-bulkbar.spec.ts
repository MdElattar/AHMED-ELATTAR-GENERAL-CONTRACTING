import { expect, test, type Page, type TestInfo } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const WIDTHS = [390, 560, 768, 900, 1024, 1280, 1440] as const;
const SHOTS = path.resolve(process.cwd(), "screenshots/projects-toolbar-bulkbar");
const CAPTURE_WIDTHS = new Set([390, 768, 1024, 1440]);

type Rect = { x: number; y: number; width: number; height: number; right: number; bottom: number };

type Box = {
  text: string;
  hasText: boolean;
  role: string | null;
  rect: Rect;
  nowrap: boolean;
  scrollWidth: number;
  clientWidth: number;
  scrollHeight: number;
  clientHeight: number;
};

type Layout = {
  viewport: number;
  documentWidth: number;
  root: Rect;
  scrollWidth: number;
  clientWidth: number;
  descendants: Rect[];
  controls: Box[];
  overlaps: { a: string; b: string; width: number; height: number }[];
};

function overlapCount(rects: Rect[]) {
  const overlaps: { a: string; b: string; width: number; height: number }[] = [];
  for (let i = 0; i < rects.length; i += 1) {
    for (let j = i + 1; j < rects.length; j += 1) {
      const a = rects[i];
      const b = rects[j];
      const width = Math.min(a.right, b.right) - Math.max(a.x, b.x);
      const height = Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y);
      if (width > 1 && height > 1) {
        overlaps.push({
          a: `${Math.round(a.x)},${Math.round(a.y)}`,
          b: `${Math.round(b.x)},${Math.round(b.y)}`,
          width: Math.round(width),
          height: Math.round(height),
        });
      }
    }
  }
  return overlaps;
}

async function readElementLayout(page: Page, testId: string): Promise<Layout> {
  return page.evaluate((id) => {
    const root = document.querySelector<HTMLElement>(`[data-testid="${id}"]`);
    if (!root) throw new Error(`Missing [data-testid="${id}"]`);

    const isVisible = (element: Element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        Number(style.opacity) > 0
      );
    };

    const rectOf = (element: Element): Rect => {
      const rect = element.getBoundingClientRect();
      return {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        right: rect.right,
        bottom: rect.bottom,
      };
    };

    const controls = [
      ...root.querySelectorAll<HTMLElement>(
        'input, button, [role="radio"], [role="combobox"], [data-testid="bulk-count"]',
      ),
    ]
      .filter(isVisible)
      .map((element) => {
        const style = getComputedStyle(element);
        const visibleText = (element.textContent || "").replace(/\s+/g, " ").trim();
        return {
          text: visibleText || (element.getAttribute("aria-label") || "").trim(),
          hasText: visibleText.length > 0,
          role: element.getAttribute("role"),
          rect: rectOf(element),
          nowrap: style.whiteSpace === "nowrap",
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth,
          scrollHeight: element.scrollHeight,
          clientHeight: element.clientHeight,
        };
      });

    const descendants = [...root.querySelectorAll<HTMLElement>("*")]
      .filter(isVisible)
      .map(rectOf);

    return {
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      root: rectOf(root),
      scrollWidth: root.scrollWidth,
      clientWidth: root.clientWidth,
      descendants,
      controls,
      overlaps: [],
    };
  }, testId)
    .then((layout) => ({
      ...layout,
      overlaps: overlapCount(layout.controls.map((control) => control.rect)),
    }));
}

async function loginState(page: Page, collapsed: boolean) {
  await page.addInitScript(
    ({ collapsed: isCollapsed }) => {
      try {
        localStorage.setItem("alattar-locale", "en");
        localStorage.setItem("admin-sidebar-collapsed", isCollapsed ? "1" : "0");
      } catch {
        // about:blank has no storage; the script runs again on the app origin.
      }
    },
    { collapsed },
  );
}

async function openProjects(page: Page, width: number, collapsed: boolean) {
  await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
  await loginState(page, collapsed);
  await page.goto("/admin/projects?view=table", { waitUntil: "domcontentloaded" });
  await page.locator('[data-testid="projects-toolbar"]').waitFor({ state: "visible" });
  await expect(page.locator('[data-testid="projects-responsive"]')).toBeVisible();
  await page.waitForTimeout(500);
}

async function selectAllProjects(page: Page) {
  const boxes = page.locator('[data-testid="project-select"]');
  const total = await boxes.count();
  expect(total).toBeGreaterThan(0);

  const header = page.locator('[data-testid="select-all"]');
  if ((await header.count()) > 0 && (await header.isVisible())) {
    await header.check();
  } else {
    // Cards have no header checkbox. Click each input directly so the fixed
    // mobile bulk bar can never intercept the click.
    for (let index = 0; index < total; index += 1) {
      await boxes.nth(index).evaluate((element) => {
        const input = element as HTMLInputElement;
        if (!input.checked) input.click();
      });
      await page.waitForTimeout(20);
    }
  }

  const bar = page.locator('[data-testid="projects-bulk-bar"]');
  await expect(bar).toBeVisible();
  await expect(page.locator('[data-testid="bulk-count"]')).toHaveCount(1);
  await expect(page.locator('[data-testid="bulk-count"]')).toHaveText(`${total} selected`);
  await expect(page.locator('[data-testid="bulk-select-all"]')).toHaveCount(0);
  await expect(bar).not.toContainText(`All ${total} selected`);
  await page.waitForTimeout(350);
}

async function assertInside(rect: Rect, bounds: Rect, label: string) {
  expect(rect.x, `${label} left edge`).toBeGreaterThanOrEqual(bounds.x - 1);
  expect(rect.right, `${label} right edge`).toBeLessThanOrEqual(bounds.right + 1);
  expect(rect.y, `${label} top edge`).toBeGreaterThanOrEqual(bounds.y - 1);
  expect(rect.bottom, `${label} bottom edge`).toBeLessThanOrEqual(bounds.bottom + 1);
}

function assertNoOverlap(layout: Layout) {
  expect(layout.overlaps, "visible controls must not overlap").toEqual([]);
}

function assertElementsInside(layout: Layout, label: string) {
  for (const [index, rect] of layout.descendants.entries()) {
    assertInside(rect, layout.root, `${label} child ${index}`);
  }
}

function assertControlsDoNotWrap(layout: Layout, label: string) {
  for (const control of layout.controls) {
    if (control.hasText) {
      expect(control.nowrap, `${label} control "${control.text}" must use nowrap`).toBe(true);
      expect(
        control.scrollWidth,
        `${label} control "${control.text}" must not clip horizontally`,
      ).toBeLessThanOrEqual(control.clientWidth + 1);
    }
  }
}

async function readToolbar(page: Page) {
  return readElementLayout(page, "projects-toolbar");
}

async function readBulk(page: Page) {
  return readElementLayout(page, "projects-bulk-bar");
}

async function screenshot(page: Page, testInfo: TestInfo, name: string) {
  fs.mkdirSync(SHOTS, { recursive: true });
  const target = path.join(SHOTS, `${name}.png`);
  await page.screenshot({ path: target, animations: "disabled" });
  await testInfo.attach(name, { path: target, contentType: "image/png" });
}

test.describe("admin projects toolbar and bulk bar", () => {
  for (const width of WIDTHS) {
    for (const collapsed of [false, true]) {
      test(`${width}px · sidebar ${collapsed ? "collapsed" : "open"}`, async ({ page }, testInfo) => {
        await openProjects(page, width, collapsed);

        const aside = page.locator("aside[data-collapsed]");
        if (width < 1024) {
          await expect(aside).toBeHidden();
          await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
        } else {
          await expect(aside).toBeVisible();
          const expected = width < 1280 ? 76 : collapsed ? 76 : 264;
          const box = await aside.boundingBox();
          expect(box).not.toBeNull();
          expect(Math.round(box!.width)).toBe(expected);
          const toggle = page.locator('[data-testid="admin-sidebar-toggle"]');
          if (width < 1280) await expect(toggle).toBeHidden();
          else await expect(toggle).toBeVisible();
        }

        if (width < 900) {
          await expect(page.getByRole("button", { name: "Search", exact: true })).toBeVisible();
          await expect(
            page.getByRole("button", { name: /Search projects and contracts/ }),
          ).toBeHidden();
        } else {
          await expect(
            page.getByRole("button", { name: /Search projects and contracts/ }),
          ).toBeVisible();
          await expect(page.getByRole("button", { name: "Search", exact: true })).toBeHidden();
        }

        const toolbar = await readToolbar(page);
        expect(toolbar.documentWidth).toBeLessThanOrEqual(toolbar.viewport);
        expect(toolbar.scrollWidth).toBeLessThanOrEqual(toolbar.clientWidth + 1);
        expect(toolbar.controls.length).toBe(5);
        assertNoOverlap(toolbar);
        assertElementsInside(toolbar, "toolbar");
        assertControlsDoNotWrap(toolbar, "toolbar");
        expect(toolbar.controls.every((control) => control.rect.height <= 44)).toBe(true);
        expect(
          await page.locator('[data-testid="projects-toolbar"] select').count(),
          "the toolbar must use the shared Radix select",
        ).toBe(0);

        const chips = await page.evaluate(() => {
          const row = document.querySelector<HTMLElement>('[data-testid="projects-status-chips"]');
          if (!row) throw new Error("Missing status chips");
          const rowRect = row.getBoundingClientRect();
          const chips = [...row.querySelectorAll<HTMLElement>("button")];
          const active = chips.find((chip) => chip.dataset.active === "true") ?? null;
          const activeRect = active?.getBoundingClientRect() ?? null;
          return {
            flexWrap: getComputedStyle(row).flexWrap,
            mask:
              getComputedStyle(row).maskImage ||
              getComputedStyle(row).getPropertyValue("-webkit-mask-image") ||
              "none",
            tops: chips.map((chip) => Math.round(chip.getBoundingClientRect().top)),
            shrink: chips.map((chip) => getComputedStyle(chip).flexShrink),
            activeVisible: activeRect
              ? activeRect.left >= rowRect.left - 1 && activeRect.right <= rowRect.right + 1
              : false,
            documentWidth: document.documentElement.scrollWidth,
            viewport: window.innerWidth,
          };
        });
        expect(chips.flexWrap).toBe("nowrap");
        expect(chips.mask).not.toBe("none");
        expect(new Set(chips.tops).size).toBe(1);
        expect(chips.shrink.every((value) => value === "0")).toBe(true);
        expect(chips.activeVisible).toBe(true);
        expect(chips.documentWidth).toBeLessThanOrEqual(chips.viewport);

        if (width === 390) {
          await page.getByRole("button", { name: /Archived/ }).click();
          await page.waitForTimeout(450);
          const active = await page.evaluate(() => {
            const row = document.querySelector<HTMLElement>('[data-testid="projects-status-chips"]');
            if (!row) throw new Error("Missing status chips");
            const rowRect = row.getBoundingClientRect();
            const chip = row.querySelector<HTMLElement>('[data-active="true"]');
            const rect = chip?.getBoundingClientRect();
            return {
              scrollLeft: row.scrollLeft,
              inView: rect ? rect.left >= rowRect.left - 1 && rect.right <= rowRect.right + 1 : false,
            };
          });
          expect(active.scrollLeft).toBeGreaterThan(0);
          expect(active.inView).toBe(true);
          await page.getByRole("button", { name: /^All \(/ }).click();
          await page.waitForTimeout(300);
        }

        await selectAllProjects(page);
        const bulk = await readBulk(page);
        expect(bulk.documentWidth).toBeLessThanOrEqual(bulk.viewport);
        expect(bulk.scrollWidth).toBeLessThanOrEqual(bulk.clientWidth + 1);
        expect(bulk.controls.some((control) => control.text.includes("selected"))).toBe(true);
        expect(bulk.controls.filter((control) => control.text.includes("selected"))).toHaveLength(1);
        assertNoOverlap(bulk);
        assertElementsInside(bulk, "bulk bar");
        assertControlsDoNotWrap(bulk, "bulk bar");
        expect(bulk.controls.every((control) => control.rect.height <= 44)).toBe(true);

        if (!collapsed && CAPTURE_WIDTHS.has(width)) {
          await screenshot(page, testInfo, `toolbar-bulk-${width}`);
        }

        await page.keyboard.press("Escape");
        await expect(page.locator('[data-testid="projects-bulk-bar"]')).toBeHidden();
      });
    }
  }

  test("sidebar breakpoints and topbar search", async ({ page }) => {
    await openProjects(page, 780, false);
    const aside = page.locator("aside[data-collapsed]");
    await expect(aside).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(780);

    await page.getByRole("button", { name: "Open menu" }).click();
    const drawer = page.getByRole("dialog", { name: "Navigation menu" });
    await expect(drawer).toBeVisible();
    const drawerBox = await drawer.boundingBox();
    expect(drawerBox).not.toBeNull();
    expect(Math.round(drawerBox!.width)).toBeLessThanOrEqual(300);
    expect(drawerBox!.x + drawerBox!.width).toBeLessThanOrEqual(781);
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();

    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");

    await page.setViewportSize({ width: 1024, height: 900 });
    await page.waitForTimeout(350);
    await expect(aside).toBeVisible();
    const railBox = await aside.boundingBox();
    expect(railBox).not.toBeNull();
    expect(Math.round(railBox!.width)).toBe(76);
    await expect(page.locator('[data-testid="admin-sidebar-toggle"]')).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1024);

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.waitForTimeout(350);
    const expandedBox = await aside.boundingBox();
    expect(expandedBox).not.toBeNull();
    expect(Math.round(expandedBox!.width)).toBe(264);
    await page.locator('[data-testid="admin-sidebar-toggle"]').click();
    await page.waitForTimeout(350);
    const collapsedBox = await aside.boundingBox();
    expect(collapsedBox).not.toBeNull();
    expect(Math.round(collapsedBox!.width)).toBe(76);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1280);
  });

  test("wide bulk bar keeps the partial-selection link inside", async ({ page }) => {
    // 844px viewport → 780px content; this is the exact wide/medium boundary.
    await openProjects(page, 844, false);
    await page.locator('[data-testid="project-select"]').first().click();
    const bar = page.locator('[data-testid="projects-bulk-bar"]');
    await expect(bar).toBeVisible();
    await expect(page.locator('[data-testid="bulk-select-all"]')).toBeVisible();
    await page.waitForTimeout(350);

    const bulk = await readBulk(page);
    assertNoOverlap(bulk);
    assertElementsInside(bulk, "bulk bar");
    assertControlsDoNotWrap(bulk, "bulk bar");
    expect(bulk.controls.every((control) => control.rect.height <= 44)).toBe(true);
    expect(bulk.scrollWidth).toBeLessThanOrEqual(bulk.clientWidth + 1);

    await page.locator('[data-testid="bulk-select-all"]').click();
    await expect(page.locator('[data-testid="bulk-select-all"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="bulk-count"]')).toHaveCount(1);
    await expect(bar).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(844);
  });
});
