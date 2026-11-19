import { expect, test, type Page } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

async function useEnglish(page: Page) {
  await page.context().addCookies([{ name: "alattar-locale", value: "en", url: BASE_URL }]);
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem("alattar-locale", "en");
    } catch {
      // Cookie bootstrap is the SSR source of truth; storage is best effort.
    }
  });
}

test.describe("branding and estimator presentation", () => {
  test("public pages use the new company identity and sole Dammam headquarters", async ({
    page,
  }) => {
    await useEnglish(page);
    await page.goto("/contact");

    await expect(page.getByText("AHMED ALATTAR").first()).toBeVisible();
    await expect(page.getByText("alattar@aalattar.com").first()).toBeVisible();
    await expect(page.getByText("Sole headquarters · no other branches").first()).toBeVisible();
    await expect(page.getByText("Dammam, Saudi Arabia").first()).toBeVisible();
    await expect(page.getByText(/Ahmed Elattar/i)).toHaveCount(0);
    await expect(page.getByText(/Riyadh · Jeddah · Dubai/i)).toHaveCount(0);
  });

  test("estimator controls, slider, and figures use high-contrast lining numerals", async ({
    page,
  }) => {
    await useEnglish(page);
    await page.goto("/");
    const estimator = page.locator("#estimator");
    await estimator.scrollIntoViewIfNeeded();

    const unselectedLabels = [
      "Luxury residential",
      "Essential",
      "Jeddah",
      "Fast",
    ] as const;
    for (const label of unselectedLabels) {
      const style = await estimator.getByRole("button", { name: label }).evaluate((element) => {
        const computed = getComputedStyle(element);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          borderColor: computed.borderTopColor,
          borderWidth: computed.borderTopWidth,
        };
      });
      expect(style.borderWidth, `${label} border width`).not.toBe("0px");
      expect(style.color, `${label} text color`).toBe("rgb(14, 16, 23)");
      expect(style.backgroundColor, `${label} surface fill`).not.toBe("rgba(0, 0, 0, 0)");
      expect(style.borderColor, `${label} border color`).not.toBe("rgba(0, 0, 0, 0)");
    }

    const sliderBackground = await estimator
      .locator("#estimator-area")
      .evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(sliderBackground).not.toBe("rgba(0, 0, 0, 0)");

    const priceNumerals = await estimator
      .locator(".estimator-price")
      .evaluate((element) => getComputedStyle(element).fontVariantNumeric);
    expect(priceNumerals).toContain("lining-nums");
    expect(priceNumerals).toContain("tabular-nums");

    const kpiNumerals = await page
      .locator(".tabular")
      .first()
      .evaluate((element) => getComputedStyle(element).fontVariantNumeric);
    expect(kpiNumerals).toContain("lining-nums");
    expect(kpiNumerals).toContain("tabular-nums");
  });
});
