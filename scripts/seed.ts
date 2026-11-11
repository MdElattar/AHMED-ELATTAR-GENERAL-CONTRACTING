import { seedDatabase } from "../src/lib/db";

async function main() {
  const result = await seedDatabase();
  console.log(
    `[seed] Super-admin ready: ${result.admin}\n[seed] Projects upserted: ${result.projects}\n[seed] Site content: ${result.content ? "ready" : "skipped"}`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error("[seed] failed", error instanceof Error ? error.message : error);
    process.exit(1);
  });
