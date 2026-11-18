import { expect, test, type APIRequestContext } from "@playwright/test";

async function fetchManifest(request: APIRequestContext) {
  for (const path of ["/manifest.webmanifest", "/manifest.json"]) {
    const response = await request.get(path);
    if (response.ok()) return { response, data: (await response.json()) as Record<string, unknown> };
  }
  throw new Error("PWA manifest was not served");
}

test.describe("PWA shell", () => {
  test("manifest is installable and links real icons", async ({ request }) => {
    const { response, data } = await fetchManifest(request);
    expect(response.headers()["content-type"]).toContain("application/manifest+json");
    expect(data.display).toBe("standalone");
    expect(data.start_url).toBe("/");
    expect(data.theme_color).toBeTruthy();

    const icons = data.icons as { src: string; sizes: string }[];
    expect(icons.length).toBeGreaterThanOrEqual(2);
    for (const icon of icons) {
      const asset = await request.get(icon.src);
      expect(asset.ok(), `${icon.src} is missing`).toBe(true);
      expect(asset.headers()["content-type"]).toContain("image/png");
    }
  });

  test("service worker is served with a no-cache policy and safe scope", async ({ request }) => {
    const response = await request.get("/sw.js");
    expect(response.ok()).toBe(true);
    expect(response.headers()["service-worker-allowed"]).toBe("/");
    expect(response.headers()["cache-control"]).toContain("must-revalidate");
    const source = await response.text();
    expect(source).toContain('path.startsWith("/api/")');
    expect(source).toContain('path.startsWith("/admin")');
    expect(source).toContain('path.startsWith("/portal")');
  });

  test("offline fallback is a public, server-rendered page", async ({ page }) => {
    const response = await page.goto("/offline", { waitUntil: "domcontentloaded" });
    expect(response?.ok()).toBe(true);
    await expect(page.locator("main#main h1")).toBeVisible();
    await expect(page.getByRole("link", { name: /Return home|العودة إلى الرئيسية/ })).toBeVisible();
  });

  test("styled public routes keep theme and locale tokens in the shell", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const shell = await page.evaluate(() => {
      const root = document.documentElement;
      return {
        theme: root.dataset.theme,
        locale: root.dataset.locale,
        bodyBackground: getComputedStyle(document.body).backgroundColor,
      };
    });
    expect(["light", "dark"]).toContain(shell.theme);
    expect(["ar", "en"]).toContain(shell.locale);
    expect(shell.bodyBackground).not.toBe("rgba(0, 0, 0, 0)");
  });
});
