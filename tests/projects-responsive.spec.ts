import { expect, test, type Page, type TestInfo } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const WIDTHS = [390, 768, 1024, 1280, 1440] as const;
const SHOTS = path.resolve(process.cwd(), "screenshots/projects-responsive");

async function readProjectsState(page: Page) {
  return page.evaluate(() => {
    const wrapper = document.querySelector<HTMLElement>('[data-testid="projects-responsive"]');
    const tableCard = document.querySelector<HTMLElement>('[data-testid="projects-table"]');
    const cardsGrid = document.querySelector<HTMLElement>('[data-testid="projects-cards"]');
    const main = document.querySelector<HTMLElement>('[data-scroll-root="main"]');
    const aside = document.querySelector<HTMLElement>("aside[data-collapsed]");

    const rows = tableCard
      ? [...tableCard.querySelectorAll<HTMLTableRowElement>("tbody tr")]
      : [];
    const firstRow = rows[0] ?? null;
    const headerCells = tableCard
      ? [...tableCard.querySelectorAll<HTMLTableCellElement>("thead th")]
      : [];
    const table = tableCard?.querySelector("table") ?? null;
    const scroller = tableCard?.firstElementChild as HTMLElement | null;
    const projectCell = firstRow?.querySelector<HTMLElement>('td:nth-child(2)') ?? null;
    const name = projectCell?.querySelector<HTMLElement>('[data-testid="project-name"]') ?? null;
    const city = projectCell?.querySelector<HTMLElement>('[data-testid="project-city"]') ?? null;
    const inlineCategory = projectCell?.querySelector<HTMLElement>('[data-testid="project-category-inline"]') ?? null;
    const valueCell = firstRow?.querySelector<HTMLElement>('[data-testid="project-value"]') ?? null;
    const card = cardsGrid?.querySelector<HTMLElement>('[data-testid="projects-card"]') ?? null;
    const cardImage = card
      ? [...card.querySelectorAll<HTMLElement>("*")].find((element) => {
          const rect = element.getBoundingClientRect();
          return Math.abs(rect.width - 64) < 1 && Math.abs(rect.height - 48) < 1;
        }) ?? null
      : null;
    const cardPills = card
      ? [...card.querySelectorAll<HTMLElement>("span")].filter((element) =>
          element.className.includes("rounded-[999px]"),
        )
      : [];
    const cardPercent = card
      ? [...card.querySelectorAll<HTMLElement>("span")].find((element) =>
          /^\d+%$/.test(element.textContent?.trim() ?? ""),
        ) ?? null
      : null;

    const mode = tableCard
      ? headerCells[2]?.textContent?.trim() === "Category"
        ? "full"
        : "compact"
      : cardsGrid
        ? "cards"
        : "none";

    const overflowCells = tableCard
      ? [...tableCard.querySelectorAll<HTMLElement>("thead th, tbody td")]
          .filter((element) => {
            const row = element.closest("tr");
            const index = row ? [...row.children].indexOf(element) : -1;
            // The project column intentionally truncates the name and is checked below.
            return index > 1;
          })
          .filter((element) => element.scrollWidth > element.clientWidth + 2)
          .map((element) => ({
            tag: element.tagName,
            text: (element.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 40),
            scrollWidth: element.scrollWidth,
            clientWidth: element.clientWidth,
          }))
      : [];

    return {
      innerWidth: window.innerWidth,
      docScrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      mainScrollWidth: main?.scrollWidth ?? null,
      mainClientWidth: main?.clientWidth ?? null,
      wrapperWidth: wrapper ? Math.round(wrapper.getBoundingClientRect().width) : null,
      asideWidth: aside ? Math.round(aside.getBoundingClientRect().width) : 0,
      mode,
      rows: rows.length,
      headerText: headerCells.map((cell) => (cell.textContent ?? "").replace(/\s+/g, " ").trim()),
      tableScrollWidth: table?.scrollWidth ?? null,
      tableClientWidth: table?.clientWidth ?? null,
      tableCardRadius: tableCard ? getComputedStyle(tableCard).borderRadius : null,
      tableCardOverflow: tableCard ? getComputedStyle(tableCard).overflow : null,
      scrollerOverflowX: scroller ? getComputedStyle(scroller).overflowX : null,
      scrollerOverflowY: scroller ? getComputedStyle(scroller).overflowY : null,
      stickyHeader: tableCard?.querySelector("thead")
        ? getComputedStyle(tableCard.querySelector("thead")!).position
        : null,
      rowHeight: firstRow ? Math.round(firstRow.getBoundingClientRect().height) : null,
      nameText: name?.textContent?.trim() ?? null,
      nameTitle: name?.getAttribute("title") ?? null,
      nameWhiteSpace: name ? getComputedStyle(name).whiteSpace : null,
      nameTextOverflow: name ? getComputedStyle(name).textOverflow : null,
      cityText: city?.textContent?.trim() ?? null,
      inlineCategory: inlineCategory?.textContent?.trim() ?? null,
      categoryText:
        firstRow?.querySelector<HTMLElement>('[data-testid="project-category"]')?.textContent?.trim() ?? null,
      statusText:
        firstRow?.querySelector<HTMLElement>('[data-testid="project-status"]')?.textContent?.trim() ?? null,
      healthText:
        firstRow?.querySelector<HTMLElement>('[data-testid="project-health"]')?.textContent?.trim() ?? null,
      progressText:
        firstRow
          ?.querySelector<HTMLElement>('[data-testid="project-progress"]')
          ?.textContent?.replace(/\s+/g, " ")
          .trim() ?? null,
      valueText: valueCell?.textContent?.trim() ?? null,
      valueAlign: valueCell ? getComputedStyle(valueCell).textAlign : null,
      valueNumeric: valueCell ? getComputedStyle(valueCell).fontVariantNumeric : null,
      actionsCount:
        firstRow?.querySelectorAll('[data-testid="project-actions"] button').length ?? 0,
      overflowCells,
      cardCount: cardsGrid?.querySelectorAll('[data-testid="projects-card"]').length ?? 0,
      cardScrollWidth: card?.scrollWidth ?? null,
      cardClientWidth: card?.clientWidth ?? null,
      cardImage: cardImage
        ? {
            width: Math.round(cardImage.getBoundingClientRect().width),
            height: Math.round(cardImage.getBoundingClientRect().height),
          }
        : null,
      cardPillTexts: cardPills.map((element) => element.textContent?.trim() ?? ""),
      cardPillWrap: cardPills.map((element) => getComputedStyle(element).whiteSpace),
      cardPercent: cardPercent?.textContent?.trim() ?? null,
      cardHasCheckbox: Boolean(card?.querySelector('input[type="checkbox"]')),
      cardHasKebab: Boolean(card?.querySelector('[data-testid="project-actions"]')),
      cardName: card?.querySelector<HTMLElement>('[data-testid="project-name"]')?.textContent?.trim() ?? null,
      cardCity: card?.querySelector<HTMLElement>('[data-testid="project-city"]')?.textContent?.trim() ?? null,
      cardValue: card?.querySelector<HTMLElement>('[data-testid="project-value"]')?.textContent?.trim() ?? null,
      cardProgressWidth:
        card?.querySelector<HTMLElement>('[data-testid="project-progress"]')?.getBoundingClientRect().width ?? null,
    };
  });
}

async function screenshot(page: Page, testInfo: TestInfo, name: string) {
  fs.mkdirSync(SHOTS, { recursive: true });
  const target = path.join(SHOTS, `${name}.png`);
  await page.screenshot({ path: target, animations: "disabled" });
  await testInfo.attach(name, { path: target, contentType: "image/png" });
}

test.describe("admin projects table · container responsive", () => {
  for (const width of WIDTHS) {
    for (const collapsed of [false, true]) {
      test(`${width}px · sidebar ${collapsed ? "collapsed" : "expanded"}`, async ({ page }, testInfo) => {
        await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
        await page.addInitScript(
          ({ collapsed }) => {
            try {
              localStorage.setItem("alattar-locale", "en");
              localStorage.setItem("admin-sidebar-collapsed", collapsed ? "1" : "0");
            } catch {
              // about:blank has no storage; the script runs again on the app origin.
            }
          },
          { collapsed },
        );

        await page.goto("/admin/projects?view=table", { waitUntil: "domcontentloaded" });
        await page.locator('[data-testid="projects-responsive"]').waitFor({ state: "visible" });
        await expect(page.locator('[data-testid="projects-table"], [data-testid="projects-cards"]').first()).toBeVisible();
        await page.waitForTimeout(500);

        const state = await readProjectsState(page);
        expect(state.docScrollWidth, "the page must never scroll horizontally").toBeLessThanOrEqual(state.innerWidth);
        expect(state.bodyScrollWidth, "the body must never be wider than the viewport").toBeLessThanOrEqual(
          state.innerWidth,
        );
        if (state.mainScrollWidth !== null && state.mainClientWidth !== null) {
          expect(state.mainScrollWidth).toBeLessThanOrEqual(state.mainClientWidth + 1);
        }

        if (width < 1024) {
          expect(state.asideWidth).toBe(0);
        } else if (width < 1280) {
          // 1024–1279 is always the icon rail, regardless of the stored preference.
          expect(state.asideWidth).toBe(76);
        } else {
          expect(state.asideWidth).toBe(collapsed ? 76 : 264);
        }

        const expectedMode = state.wrapperWidth! >= 1100 ? "full" : state.wrapperWidth! >= 760 ? "compact" : "cards";
        expect(state.mode).toBe(expectedMode);
        if (width === 1024) expect(state.mode).toBe("compact");
        if (width === 1280) expect(state.mode).toBe(collapsed ? "full" : "compact");
        if (width === 1440) expect(state.mode).toBe("full");

        if (state.mode === "cards") {
          expect(state.cardCount).toBeGreaterThan(0);
          expect(state.cardHasCheckbox).toBe(true);
          expect(state.cardHasKebab).toBe(true);
          expect(state.cardImage).toEqual({ width: 64, height: 48 });
          expect(state.cardName).toBeTruthy();
          expect(state.cardCity).toBeTruthy();
          expect(state.cardPillTexts.length).toBeGreaterThanOrEqual(2);
          expect(state.cardPillWrap.every((value) => value === "nowrap")).toBe(true);
          expect(state.cardPercent).toMatch(/^\d+%$/);
          expect(state.cardValue).toMatch(/(SAR|ر\.س)/);
          expect(state.cardProgressWidth).toBeGreaterThan(200);
          expect(state.cardScrollWidth).toBeLessThanOrEqual(state.cardClientWidth! + 1);
        } else {
          expect(state.rows).toBeGreaterThan(0);
          expect(state.tableScrollWidth).toBeLessThanOrEqual(state.tableClientWidth! + 1);
          expect(state.overflowCells).toEqual([]);
          expect(state.rowHeight).toBeGreaterThanOrEqual(63);
          expect(state.rowHeight).toBeLessThanOrEqual(65);
          expect(state.nameText).toBeTruthy();
          expect(state.nameTitle).toBe(state.nameText);
          expect(state.nameWhiteSpace).toBe("nowrap");
          expect(state.nameTextOverflow).toBe("ellipsis");
          expect(state.cityText).toBeTruthy();
          expect(state.statusText).toBeTruthy();
          expect(state.healthText).toBeTruthy();
          expect(state.progressText).toMatch(/\d+%/);
          expect(state.valueText).toMatch(/(SAR|ر\.س)/);
          expect(["end", "right"]).toContain(state.valueAlign);
          expect(state.valueNumeric).toContain("tabular-nums");
          expect(state.actionsCount).toBe(1);
          expect(state.tableCardRadius).toBe("20px");
          expect(state.tableCardOverflow).toBe("hidden");
          expect(state.scrollerOverflowX).toBe("hidden");
          expect(state.scrollerOverflowY).toBe("auto");
          expect(state.stickyHeader).toBe("sticky");
          expect(state.headerText).toContain("Project");
          expect(state.headerText).toContain("Status");
          expect(state.headerText).toContain("Budget health");
          expect(state.headerText).toContain("Progress");
          expect(state.headerText).toContain("Value");
          expect(state.headerText).toContain("Actions");
          if (state.mode === "full") {
            expect(state.headerText).toContain("Category");
            expect(state.categoryText).toBeTruthy();
            expect(state.inlineCategory).toBeNull();
          } else {
            expect(state.headerText).not.toContain("Category");
            expect(state.inlineCategory).toBeTruthy();
          }
        }

        await screenshot(page, testInfo, `${width}-${collapsed ? "collapsed" : "expanded"}`);

        // The bulk bar must be usable without introducing horizontal overflow.
        await page.locator('[data-testid="project-select"]').first().click();
        const bar = page.locator('[data-testid="projects-bulk-bar"]');
        await expect(bar).toBeVisible();
        await expect(bar).toContainText("1 selected");
        await expect(bar.getByRole("button", { name: "Export Excel" })).toBeVisible();
        await expect(bar.getByRole("button", { name: "Archive", exact: true })).toBeVisible();
        if (width >= 900) {
          await expect(bar.getByText("Move to", { exact: true })).toBeVisible();
          await expect(bar.getByRole("radio")).toHaveCount(3);
        } else if (width >= 520) {
          await expect(bar.getByText("Move to", { exact: true })).toHaveCount(0);
          await expect(bar.getByRole("radio")).toHaveCount(3);
        } else {
          await expect(bar.getByRole("button", { name: "Change status" })).toBeVisible();
          await expect(bar.getByRole("radio")).toHaveCount(0);
        }
        if (width < 768) {
          const box = await bar.boundingBox();
          expect(box).not.toBeNull();
          expect(box!.y + box!.height).toBeLessThanOrEqual(844 - 64);
        }
        const barWidths = await page.evaluate(() => ({
          document: document.documentElement.scrollWidth,
          viewport: window.innerWidth,
        }));
        expect(barWidths.document).toBeLessThanOrEqual(barWidths.viewport);

        if (width === 390 || width === 1440) {
          await screenshot(page, testInfo, `${width}-${collapsed ? "collapsed" : "expanded"}-bulk`);
        }

        await page.keyboard.press("Escape");
        await expect(bar).toBeHidden();
      });
    }
  }

  test("bulk bar range selection and archive confirmation", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      try {
        localStorage.setItem("alattar-locale", "en");
        localStorage.setItem("admin-sidebar-collapsed", "0");
      } catch {
        // about:blank has no storage.
      }
    });
    await page.goto("/admin/projects?view=table", { waitUntil: "domcontentloaded" });
    await page.locator('[data-testid="projects-table"]').waitFor({ state: "visible" });

    const boxes = page.locator('[data-testid="project-select"]');
    await boxes.nth(0).click();
    await boxes.nth(2).click({ modifiers: ["Shift"] });
    const bar = page.locator('[data-testid="projects-bulk-bar"]');
    await expect(bar).toContainText("3 selected");
    await screenshot(page, testInfo, "1440-range-selection");
    await expect(bar.getByRole("radio")).toHaveCount(3);

    await bar.getByRole("button", { name: "Archive", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Archive 3 projects?");
    await screenshot(page, testInfo, "1440-archive-confirmation");
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();
    await expect(bar).toBeVisible();

    await bar.getByRole("button", { name: "Clear selection" }).click();
    await expect(bar).toBeHidden();
  });
});
