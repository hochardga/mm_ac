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

test("rejects photo assets with unsupported extensions", async () => {
  await expect(
    validateCasePackage("photo-bad-extension", {
      casesRoot: fixturesRoot,
    }),
  ).rejects.toThrow(/extension/i);
});

test("throws when a photo asset file is missing", async () => {
  await expect(
    validateCasePackage("photo-missing-asset", {
      casesRoot: fixturesRoot,
    }),
  ).rejects.toThrow(/scene-photo\.png/i);
});

test("rejects photo assets that escape the case directory through symlinks", async () => {
  await expect(
    validateCasePackage("photo-symlink-asset", {
      casesRoot: fixturesRoot,
    }),
  ).rejects.toThrow(/image path/i);
});

test("rejects staged packages whose unlocks reference an unknown stage", async () => {
  await expect(
    validateCasePackage("staged-bad-unlock", {
      casesRoot: fixturesRoot,
    }),
  ).rejects.toThrow(/unknown stage/i);
});

test("rejects staged packages whose unlock graph contains a cycle", async () => {
  await expect(
    validateCasePackage("staged-cycle", {
      casesRoot: fixturesRoot,
    }),
  ).rejects.toThrow(/cycle/i);
});

test("accepts a staged package when its unlocks are valid", async () => {
  await expect(
    validateCasePackage("staged-valid", {
      casesRoot: fixturesRoot,
    }),
  ).resolves.toMatchObject({ slug: "staged-valid", revision: "rev-2" });
});
