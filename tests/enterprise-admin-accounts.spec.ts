import { expect, test } from "@playwright/test";
import { isSyntheticTestAccount } from "../src/lib/admin-access";
import {
  indexSignature,
  missingRequiredIndexes,
  REQUIRED_DB_INDEXES,
} from "../src/lib/db-indexes";

test("synthetic test accounts are detected without matching real domains", () => {
  expect(isSyntheticTestAccount("QA.User@Example.com")).toBe(true);
  expect(isSyntheticTestAccount(" ops@example.com ")).toBe(true);
  expect(isSyntheticTestAccount("client@company.example.com")).toBe(false);
  expect(isSyntheticTestAccount("admin@alattar.sa")).toBe(false);
});

test("the index contract covers the paginated account directory", () => {
  const users = REQUIRED_DB_INDEXES.filter((index) => index.collection === "users");
  expect(users.some((index) => index.unique && indexSignature(index.keys) === "email:1")).toBe(true);

  const paginated = users.find(
    (index) => indexSignature(index.keys) === "role:1,createdAt:-1",
  );
  expect(paginated).toBeDefined();

  const missing = missingRequiredIndexes(
    users.map((index) => ({ key: index.keys, unique: index.unique })),
    users,
  );
  expect(missing).toEqual([]);
});
