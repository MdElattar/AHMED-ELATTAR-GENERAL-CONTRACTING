import { expect, test } from "@playwright/test";

test("public portfolio feeds advertise shared caching", async ({ request }) => {
  for (const path of ["/api/projects", "/api/content"]) {
    const response = await request.get(path);
    expect(response.ok(), `${path} failed: ${response.status()}`).toBeTruthy();
    const cacheControl = response.headers()["cache-control"] ?? "";
    expect(cacheControl).toContain("public");
    expect(cacheControl).toContain("s-maxage=3600");
    expect(cacheControl).toContain("stale-while-revalidate=86400");
  }
});

test("admin feeds are never cacheable", async ({ request }) => {
  const response = await request.get("/api/admin/projects", {
    headers: { Origin: "http://localhost:3000" },
  });
  expect([401, 403]).toContain(response.status());
  expect(response.headers()["cache-control"] ?? "").toContain("no-store");
});
