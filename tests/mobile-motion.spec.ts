import { expect, test } from "@playwright/test";

const VIEWPORTS = [
  { width: 320, height: 700 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
] as const;
const ROUTES = ["/", "/projects", "/services", "/contact", "/sign-in"] as const;
const TOUCH_MIN = 44;
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

test.describe("mobile spacing & motion contract", () => {
  for (const viewport of VIEWPORTS) {
    test.describe(`${viewport.width}px`, () => {
      test.use({ viewport, hasTouch: true, isMobile: viewport.width < 768 });

      for (const route of ROUTES) {
        test(`${route} has no horizontal overflow`, async ({ page }) => {
          await page.goto(route, { waitUntil: "domcontentloaded" });
          await page.waitForTimeout(300);
          const overflow = await page.evaluate(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
          }));
          expect(
            overflow.scrollWidth,
            `${route} overflows by ${overflow.scrollWidth - overflow.clientWidth}px`,
          ).toBeLessThanOrEqual(overflow.clientWidth + 1);
        });
      }

      test("primary controls are fingertip sized", async ({ page }) => {
        await page.goto("/", { waitUntil: "domcontentloaded" });
        const menu = page.locator('button[aria-controls="mobile-navigation"]');
        if (await menu.isVisible()) {
          const box = await menu.boundingBox();
          expect(box?.width ?? 0).toBeGreaterThanOrEqual(TOUCH_MIN);
          expect(box?.height ?? 0).toBeGreaterThanOrEqual(TOUCH_MIN);
        }

        const language = page.locator('button[aria-label]:visible').first();
        if (await language.count()) {
          const box = await language.boundingBox();
          expect(box?.width ?? 0).toBeGreaterThanOrEqual(TOUCH_MIN);
          expect(box?.height ?? 0).toBeGreaterThanOrEqual(TOUCH_MIN);
        }
      });

      test("direction is mirrored and numeric content stays LTR", async ({ page }) => {
        await page.goto("/", { waitUntil: "domcontentloaded" });
        await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

        await page.goto("/?lang=en", { waitUntil: "domcontentloaded" });
        await expect(page.locator("html")).toHaveAttribute("dir", "ltr");

        const direction = await page.evaluate(
          () => getComputedStyle(document.body).direction,
        );
        expect(direction).toBe("ltr");
      });
    });
  }

  test("reduced motion disables timelines and reveals content", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);

    const state = await page.evaluate(() => {
      const animated = document.querySelector<HTMLElement>(".hero-line > span");
      const reveal = document.querySelector<HTMLElement>(".reveal, .reveal-left, .reveal-scale");
      return {
        duration: animated ? getComputedStyle(animated).animationDuration : "0s",
        revealOpacity: reveal ? getComputedStyle(reveal).opacity : "1",
        revealTransform: reveal ? getComputedStyle(reveal).transform : "none",
      };
    });

    expect(parseFloat(state.duration)).toBeLessThan(0.01);
    expect(parseFloat(state.revealOpacity)).toBe(1);
    expect(state.revealTransform === "none" || state.revealTransform === "matrix(1, 0, 0, 1, 0, 0)").toBe(true);
  });

  test("motion preference changes are honoured without reload", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const node = document.querySelector<HTMLElement>(".hero-line > span");
          return node ? parseFloat(getComputedStyle(node).animationDuration) : 0;
        }),
      )
      .toBeLessThan(0.01);
  });

  test("mobile projects content is centered between navbar and footer", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/projects", { waitUntil: "domcontentloaded" });

    const layout = await page.evaluate(() => {
      const main = document.querySelector<HTMLElement>("main#main");
      const content = main?.querySelector<HTMLElement>(".container-lux");
      const header = document.querySelector<HTMLElement>("header");
      const footer = document.querySelector<HTMLElement>("footer");
      if (!content || !header || !footer) return null;
      const box = content.getBoundingClientRect();
      return {
        left: box.left,
        right: window.innerWidth - box.right,
        top: box.top,
        bottom: box.bottom,
        headerBottom: header.getBoundingClientRect().bottom,
        footerTop: footer.getBoundingClientRect().top,
      };
    });

    expect(layout, "projects content, header and footer must exist").not.toBeNull();
    expect(Math.abs(layout!.left - layout!.right)).toBeLessThanOrEqual(2);
    expect(layout!.top).toBeGreaterThanOrEqual(layout!.headerBottom - 1);
    expect(layout!.footerTop).toBeGreaterThanOrEqual(layout!.bottom - 1);
  });

  test("locale cookie is resolved by the server before hydration", async ({ context }) => {
    await context.addCookies([{ name: "alattar-locale", value: "en", url: BASE_URL }]);
    const response = await context.request.get(`${BASE_URL}/`);
    expect(response.ok()).toBeTruthy();
    const html = await response.text();
    expect(html).toMatch(/<html[^>]*\blang="en"[^>]*\bdir="ltr"[^>]*\bdata-locale="en"/);
  });
});
