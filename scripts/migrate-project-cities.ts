import { listProjects, upsertProject } from "../src/lib/db";

type Localized = { ar?: unknown; en?: unknown };

const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const explicitDryRun = args.has("--dry-run");
const unknown = [...args].filter((arg) => arg !== "--apply" && arg !== "--dry-run");

if (unknown.length) {
  console.error(`[migrate-cities] Unknown flag(s): ${unknown.join(", ")}`);
  console.error("Usage: npm run migrate:cities -- [--dry-run|--apply]");
  process.exit(1);
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function splitLocation(value: string) {
  const [city = "", ...rest] = value.split(/\s*[—–]\s*/);
  return {
    city: city.replace(/\s+/g, " ").trim(),
    district: rest.join(" — ").replace(/\s+/g, " ").trim(),
  };
}

function localized(value: unknown): Localized {
  return typeof value === "object" && value !== null ? (value as Localized) : {};
}

function cityParts(value: unknown) {
  return splitLocation(text(value));
}

async function main() {
  const projects = await listProjects();
  const changes: Array<{
    slug: string;
    before: { city: string; district: string; locationEn: string; locationAr: string };
    after: { city: string; district: string; cityAr: string; districtAr: string };
  }> = [];

  for (const project of projects) {
    if (project.slug.startsWith("__")) continue;
    const payload = project.payload;
    const location = localized(payload.location);
    const locationEn = text(location.en);
    const locationAr = text(location.ar);
    const fromLocationEn = cityParts(locationEn);
    const fromLocationAr = cityParts(locationAr);

    const currentCity = text(payload.city);
    const currentDistrict = text(payload.district);
    const currentCityAr = text(payload.cityAr);
    const currentDistrictAr = text(payload.districtAr);

    const nextCity = fromLocationEn.city || cityParts(currentCity).city;
    const hasLocationDistrict = /[—–]/.test(locationEn);
    const nextDistrict = hasLocationDistrict ? fromLocationEn.district : currentDistrict;
    const nextCityAr = fromLocationAr.city || currentCityAr;
    const nextDistrictAr = /[—–]/.test(locationAr) ? fromLocationAr.district : currentDistrictAr;

    const alreadyNormalized =
      Boolean(nextCity) &&
      currentCity === nextCity &&
      currentDistrict === nextDistrict &&
      (!nextCityAr || currentCityAr === nextCityAr) &&
      (!nextDistrictAr || currentDistrictAr === nextDistrictAr);

    if (alreadyNormalized) continue;
    if (!nextCity) continue;

    changes.push({
      slug: project.slug,
      before: {
        city: currentCity,
        district: currentDistrict,
        locationEn,
        locationAr,
      },
      after: {
        city: nextCity,
        district: nextDistrict,
        cityAr: nextCityAr,
        districtAr: nextDistrictAr,
      },
    });

    if (apply) {
      await upsertProject(project.slug, {
        ...payload,
        city: nextCity,
        district: nextDistrict,
        ...(nextCityAr ? { cityAr: nextCityAr } : {}),
        ...(nextDistrictAr ? { districtAr: nextDistrictAr } : {}),
      });
    }
  }

  if (!changes.length) {
    console.log("[migrate-cities] No changes needed. City fields are already normalized.");
    return;
  }

  console.log(
    `[migrate-cities] ${apply ? "Applying" : "DRY RUN — no writes"} ${changes.length} change(s).`,
  );
  for (const change of changes) {
    console.log(
      JSON.stringify({
        slug: change.slug,
        city: { from: change.before.city || "(missing)", to: change.after.city },
        district: { from: change.before.district || "(missing)", to: change.after.district || "(none)" },
        locationEn: change.before.locationEn,
        locationAr: change.before.locationAr,
      }),
    );
  }

  if (!apply) {
    console.log("[migrate-cities] Re-run with --apply to write these changes.");
    if (explicitDryRun) console.log("[migrate-cities] Explicit --dry-run confirmed.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(
      "[migrate-cities] failed",
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  });
