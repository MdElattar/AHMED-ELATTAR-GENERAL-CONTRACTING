import mongoose from "mongoose";
import {
  indexSignature,
  missingRequiredIndexes,
  REQUIRED_DB_INDEXES,
  type RequiredIndex,
} from "../src/lib/db-indexes";

function createOptions(index: RequiredIndex) {
  return {
    ...(index.unique ? { unique: true } : {}),
    ...(index.expireAfterSeconds !== undefined
      ? { expireAfterSeconds: index.expireAfterSeconds }
      : {}),
  };
}

function label(index: RequiredIndex) {
  return `${index.collection}(${indexSignature(index.keys)})`;
}

async function main() {
  const uri = (process.env.MONGODB_URI ?? process.env.MONGODB_URL)?.trim();
  if (!uri) {
    console.log(
      `[indexes] No MONGODB_URI configured; checked ${REQUIRED_DB_INDEXES.length} declarative schema indexes.`,
    );
    return;
  }

  const ensure = process.argv.includes("--ensure");
  await mongoose.connect(uri, {
    ...(process.env.MONGODB_DB ? { dbName: process.env.MONGODB_DB } : {}),
    maxPoolSize: 2,
    serverSelectionTimeoutMS: 8_000,
  });

  try {
    const db = mongoose.connection.db;
    if (!db) throw new Error("MongoDB connection has no database handle");

    const byCollection = new Map<string, RequiredIndex[]>();
    for (const index of REQUIRED_DB_INDEXES) {
      const list = byCollection.get(index.collection) ?? [];
      list.push(index);
      byCollection.set(index.collection, list);
    }

    let missingCount = 0;
    for (const [collectionName, required] of byCollection) {
      const collection = db.collection(collectionName);
      const actual = await collection.indexes();
      let absent = missingRequiredIndexes(actual, required);

      if (ensure && absent.length) {
        for (const index of absent) {
          await collection.createIndex(index.keys, createOptions(index));
          console.log(`[indexes] created ${label(index)}`);
        }
        absent = missingRequiredIndexes(await collection.indexes(), required);
      }

      if (absent.length) {
        missingCount += absent.length;
        for (const index of absent) {
          console.error(`[indexes] MISSING ${label(index)}`);
        }
      }
    }

    if (missingCount) {
      throw new Error(
        `${missingCount} required index(es) missing. Re-run with --ensure or npm run seed.`,
      );
    }

    console.log(
      `[indexes] All ${REQUIRED_DB_INDEXES.length} required indexes are present.`,
    );
  } finally {
    await mongoose.disconnect();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error("[indexes] failed", error instanceof Error ? error.message : error);
    process.exit(1);
  });
