import { expect, test } from "@playwright/test";
import {
  canAccessAdmin,
  canManageAccess,
  hasPermission,
} from "../src/lib/auth/permissions";

test("the shared permission matrix keeps roles consistent", () => {
  expect(canAccessAdmin("client")).toBe(false);
  expect(canAccessAdmin("manager")).toBe(true);
  expect(canAccessAdmin("admin")).toBe(true);
  expect(canManageAccess("manager")).toBe(false);
  expect(canManageAccess("admin")).toBe(true);
  expect(hasPermission("client", "admin:projects:write")).toBe(false);
  expect(hasPermission("admin", "admin:projects:write")).toBe(true);
  expect(hasPermission(null, "portal:access")).toBe(false);
});

test("admin APIs still refuse a client session", async ({ request }) => {
  const response = await request.get("/api/admin/projects", {
    headers: { Origin: "http://localhost:3000" },
  });
  expect([401, 403]).toContain(response.status());
});

test("contract load failure shows a blocked state with retry, never the sign form", async ({
  page,
}) => {
  await page.route("**/api/portal/contract?**", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: "{}",
    }),
  );

  await page.goto("/portal/projects", { waitUntil: "domcontentloaded" });
  const alert = page.getByRole("alert").filter({
    hasText: /could not be loaded|تعذّر تحميل حالة العقد/,
  });
  await expect(alert).toBeVisible();
  await expect(page.getByRole("button", { name: /Try again|إعادة المحاولة/ })).toBeVisible();

  // The signing form must not be exposed when the status request failed.
  await expect(page.locator("#contract-signature")).toHaveCount(0);
});
