import { expect, test } from "@playwright/test";

test("hero renders a clean construction photo with no logo or graphic overlays", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/");

  const hero = page.locator("section").first();
  const photo = hero.locator("img").first();
  await expect(photo).toBeVisible();
  await expect(photo).toHaveAttribute("src", /photo-1485083269755-a7b559a4fe5e/);

  // No 3D canvas, logo mark, emblem, or decorative gradient shape on the photo.
  await expect(hero.locator("canvas")).toHaveCount(0);
  await expect(hero.locator('img[src*="logo"], img[src*="brand"]')).toHaveCount(0);
  await expect(hero.locator(".hero-aurora, .atmo-glow, [data-hero-scene-fallback]")).toHaveCount(0);
  await expect(hero.locator('div[class*="bg-[radial-gradient"]')).toHaveCount(0);

  // Hero copy and CTAs remain in place above the restrained dark scrim.
  await expect(hero.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(hero.getByRole("link")).toHaveCount(2);
  expect(pageErrors).toEqual([]);
});
