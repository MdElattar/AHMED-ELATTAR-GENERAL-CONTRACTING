import { expect, test } from "@playwright/test";

test("hero renders a static card when WebGL is unavailable", async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleMessages: string[] = [];

  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      consoleMessages.push(message.text());
    }
  });

  await page.addInitScript(`
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (typeof type === "string" && type.indexOf("webgl") !== -1) return null;
      return original.apply(this, [type, ...args]);
    };
  `);

  await page.goto("/");

  await expect(page.locator("[data-hero-scene-fallback]")).toBeVisible();
  expect(pageErrors.filter((message) => /webgl/i.test(message))).toEqual([]);
  expect(consoleMessages.filter((message) => /THREE\.Clock/i.test(message))).toEqual([]);
  expect(
    consoleMessages.filter((message) => /Error creating WebGL context/i.test(message)),
  ).toEqual([]);
});
