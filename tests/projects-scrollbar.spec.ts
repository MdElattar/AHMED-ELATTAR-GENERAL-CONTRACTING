import { expect, test } from "@playwright/test";

/** The admin content scroller must not paint a right-edge line on first load. */
test("admin main scrollbar is hidden until deliberate hover", async ({ page }) => {
  await page.goto("/admin/projects", { waitUntil: "domcontentloaded" });
  const main = page.locator('[data-scroll-root="main"]');
  await main.waitFor({ state: "visible" });

  // The shell focuses <main> programmatically; that must not reveal the thumb.
  const color = await main.evaluate(
    (element) => getComputedStyle(element).scrollbarColor,
  );
  expect(color).toBe("rgba(0, 0, 0, 0) rgba(0, 0, 0, 0)");
});
