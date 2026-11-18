import { expect, test, type APIRequestContext, type Cookie, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_AUTH = "tests/.auth/admin.json";
const ARTIFACTS = "artifacts/theme";
const THEMES = ["dark", "light"] as const;
const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
] as const;
const ROUTES = ["/sign-in", "/admin", "/portal"] as const;

type Theme = (typeof THEMES)[number];

const canAuthenticate = Boolean(ADMIN_EMAIL && ADMIN_PASSWORD) || fs.existsSync(ADMIN_AUTH);

fs.mkdirSync(ARTIFACTS, { recursive: true });

async function setTheme(page: Page, theme: Theme) {
  await page.addInitScript((value) => {
    try {
      window.localStorage.setItem("alattar-theme", value);
    } catch {
      // Storage may be blocked; the inline bootstrap falls back to system.
    }
  }, theme);
}

async function authenticate(page: Page, request: APIRequestContext): Promise<boolean> {
  try {
    if (fs.existsSync(ADMIN_AUTH)) {
      const state = JSON.parse(fs.readFileSync(ADMIN_AUTH, "utf8")) as {
        cookies?: Cookie[];
      };
      if (state.cookies?.length) {
        await page.context().addCookies(state.cookies);
        return true;
      }
    }

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return false;
    const response = await request.post(`${BASE_URL}/api/auth/sign-in`, {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, remember: true },
      headers: {
        Origin: BASE_URL,
        Referer: `${BASE_URL}/sign-in`,
        "X-Real-IP": `198.51.100.${Math.floor(Math.random() * 200) + 20}`,
      },
    });
    if (!response.ok()) return false;

    const state = await request.storageState();
    if (state.cookies.length > 0) {
      await page.context().addCookies(state.cookies);
      return true;
    }
  } catch {
    // Missing files or a transient sign-in failure: skip authenticated routes.
  }
  return false;
}

type AxeViolations = Awaited<
  ReturnType<InstanceType<typeof AxeBuilder>["analyze"]>
>["violations"];

function describeViolations(violations: AxeViolations) {
  return violations
    .map((violation) =>
      [
        `${violation.id} (${violation.impact ?? "unknown"}):`,
        ...violation.nodes.map(
          (node) => `  ${node.target.join(" ")} — ${node.failureSummary ?? "see axe report"}`,
        ),
      ].join("\n"),
    )
    .join("\n");
}

for (const theme of THEMES) {
  for (const viewport of VIEWPORTS) {
    test.describe(`${theme} theme @ ${viewport.width}px`, () => {
      test.use({ viewport });

      for (const route of ROUTES) {
        test(`${route} has no color-contrast violations`, async ({ page, request }) => {
          if (route !== "/sign-in") {
            test.skip(!canAuthenticate, "Set ADMIN_EMAIL / ADMIN_PASSWORD to test authenticated routes.");
            const authenticated = await authenticate(page, request);
            test.skip(!authenticated, "Admin session could not be established.");
          }

          await setTheme(page, theme);
          await page.goto(route);
          await expect(page.locator("html")).toHaveAttribute("data-theme", theme);

          const results = await new AxeBuilder({ page })
            .withRules(["color-contrast"])
            .analyze();
          expect(
            results.violations,
            `${route} (${theme}, ${viewport.width}px):\n${describeViolations(results.violations)}`,
          ).toEqual([]);
        });
      }
    });
  }
}

test.describe("theme screenshot artifacts (best effort)", () => {
  test.use({ viewport: VIEWPORTS[0] });

  for (const theme of THEMES) {
    test(`capture ${theme} surfaces`, async ({ page }) => {
      await setTheme(page, theme);

      await page.goto("/sign-in");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(750);
      await page.screenshot({ path: `${ARTIFACTS}/${theme}-login-1440.png`, fullPage: true });

      const authenticated = await authenticate(page, page.request);
      if (!authenticated) return;

      await page.goto("/admin");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(750);
      await page.screenshot({ path: `${ARTIFACTS}/${theme}-overview-1440.png`, fullPage: true });

      await page.goto("/admin/projects");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(750);
      await page.screenshot({ path: `${ARTIFACTS}/${theme}-projects-1440.png`, fullPage: true });

      // Ctrl+K opens the admin command palette modal. Capture it when present.
      try {
        await page.keyboard.press("Control+k");
        await page.locator('[role="dialog"]').first().waitFor({ state: "visible", timeout: 5_000 });
        await page.screenshot({ path: `${ARTIFACTS}/${theme}-modal-1440.png` });
      } catch {
        // The palette is not available in this build — screenshots stay best effort.
      }
    });
  }
});
