import assert from "node:assert/strict";
import { getBudgetHealth, buildAlerts, byCity, needsAttention, formatSAR, type Project } from "../src/lib/project-metrics";

const base = (p: Partial<Project>): Project => ({
  id: "p",
  nameEn: "Project",
  city: "Riyadh",
  category: "commercial",
  status: "ongoing",
  progress: 0,
  value: 0,
  budget: 0,
  spent: 0,
  profit: 0,
  ...p,
});

// Real project values (workspace units as stored)
const solar = base({ id: "solar-energy-park", nameEn: "Solar Energy Park", city: "Tabuk", status: "ongoing", progress: 54, value: 2300, budget: 2300, spent: 1564, profit: 391 });
const advanced = base({ id: "advanced-industries", nameEn: "Advanced Industries", city: "Al Jubail", status: "ongoing", progress: 68, value: 1100, budget: 1100, spent: 748, profit: 176 });
const aurora = base({ id: "aurora-tower", nameEn: "Aurora Tower", city: "Riyadh", status: "completed", progress: 100, value: 1400, budget: 1400, spent: 1260, profit: 238 });
const marina = base({ id: "marina-quarter", nameEn: "Marina Quarter", city: "Jeddah", status: "upcoming", progress: 12, value: 1800, budget: 1800, spent: 216, profit: 324 });

(function testRealProjects() {
  // solar: spent/budget = ~68%, progress 54% => gap ~14 => over
  const hSolar = getBudgetHealth(solar);
  assert.equal(hSolar.key, "over");
  if (hSolar.key === "over") assert.ok(Math.round(hSolar.gap) === 14);

  // advanced: 68% spent vs 68% progress => on_track
  assert.equal(getBudgetHealth(advanced).key, "on_track");

  // marina upcoming: 12% spent vs 12% progress => on_track
  assert.equal(getBudgetHealth(marina).key, "on_track");

  // aurora completed and saved
  const hAurora = getBudgetHealth(aurora);
  assert.equal(hAurora.key, "saved");
  if (hAurora.key === "saved") assert.equal(hAurora.amount, 140);

  assert.equal(needsAttention(solar), true);
  assert.equal(needsAttention(advanced), false);
  assert.equal(needsAttention(aurora), false);
})();

(function testCases() {
  assert.deepEqual(getBudgetHealth(base({ budget: 0, spent: 0, progress: 10 })), { key: "no_data" });
  assert.equal(getBudgetHealth(base({ status: "completed", budget: 100, spent: 120 })).key, "overrun");
  assert.equal(getBudgetHealth(base({ status: "ongoing", budget: 100, spent: 57, progress: 50 })).key, "watch");
  assert.equal(getBudgetHealth(base({ status: "ongoing", budget: 100, spent: 50, progress: 50 })).key, "on_track");
})();

(function testAggregates() {
  const projects = [solar, advanced, aurora, marina];
  const alerts = buildAlerts(projects);
  assert.ok(alerts.some((a) => a.projectId === solar.id && a.type === "budget_ahead"));
  const cities = byCity(projects);
  assert.ok(cities.length >= 1);
  assert.ok(formatSAR(9490, "en").includes("SAR"));
  assert.ok(formatSAR(9490, "ar").includes("مليار"));
})();

console.log("project-metrics tests passed");
