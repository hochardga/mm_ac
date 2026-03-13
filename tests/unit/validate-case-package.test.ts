import path from "node:path";

import { validateCasePackage } from "@/features/cases/validate-case-package";

const fixturesRoot = path.join(process.cwd(), "tests", "fixtures", "cases");

test("accepts a valid text-first case package", async () => {
  await expect(
    validateCasePackage("text-first-valid", {
      casesRoot: fixturesRoot,
    }),
  ).resolves.toMatchObject({ slug: "text-first-valid" });
});

test("throws when an evidence source path is missing", async () => {
  await expect(
    validateCasePackage("text-first-missing-source", {
      casesRoot: fixturesRoot,
    }),
  ).rejects.toThrow(/missing-source/i);
});
