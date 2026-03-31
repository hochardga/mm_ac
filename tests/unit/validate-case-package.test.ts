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

test("accepts a valid mixed media case package", async () => {
  await expect(
    validateCasePackage("media-family-valid", {
      casesRoot: fixturesRoot,
    }),
  ).resolves.toMatchObject({ slug: "media-family-valid" });
});

test("rejects audio assets with unsupported extensions", async () => {
  await expect(
    validateCasePackage("audio-bad-extension", {
      casesRoot: fixturesRoot,
    }),
  ).rejects.toThrow(/extension/i);
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

test("rejects staged packages with an unreachable locked stage", async () => {
  await expect(
    validateCasePackage("staged-orphan", {
      casesRoot: fixturesRoot,
    }),
  ).rejects.toThrow(/unreachable|orphan/i);
});

test("accepts a staged package when its unlocks are valid", async () => {
  await expect(
    validateCasePackage("staged-valid", {
      casesRoot: fixturesRoot,
    }),
  ).resolves.toMatchObject({ slug: "staged-valid", revision: "rev-2" });
});

test("accepts the evidence variety showcase package", async () => {
  // Deliberately omit validateCasePackage's casesRoot/fixturesRoot override here
  // so the real evidence-variety-showcase package under content/cases is validated.
  await expect(
    validateCasePackage("evidence-variety-showcase"),
  ).resolves.toMatchObject({
    slug: "evidence-variety-showcase",
  });
});
