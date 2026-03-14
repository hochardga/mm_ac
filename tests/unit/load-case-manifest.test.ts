import path from "node:path";

import { loadCaseManifest } from "@/features/cases/load-case-manifest";

const fixturesRoot = path.join(process.cwd(), "tests", "fixtures", "cases");

test("loads normalized evidence from per-item source files", async () => {
  const manifest = await loadCaseManifest("text-first-valid", {
    casesRoot: fixturesRoot,
  });

  expect(manifest.evidence).toHaveLength(3);
  expect(manifest.evidence[0]).toMatchObject({
    family: "document",
    title: "Ledger Extract",
  });
  expect(manifest.evidence[1]).toMatchObject({ family: "record" });
  expect(manifest.evidence[2]).toMatchObject({ family: "thread" });
});

test("manifest loader excludes canonical answers", async () => {
  const manifest = await loadCaseManifest("text-first-valid", {
    casesRoot: fixturesRoot,
  });

  expect(manifest).not.toHaveProperty("canonicalAnswers");
});

test("loads staged manifests with complexity and objectives", async () => {
  const manifest = await loadCaseManifest("staged-valid", {
    casesRoot: fixturesRoot,
  });

  expect(manifest.complexity).toBe("standard");
  expect(manifest.stages).toHaveLength(1);
  expect(manifest.stages[0]).toMatchObject({
    id: "briefing",
    startsUnlocked: true,
  });
  expect(manifest.stages[0].objectives[0]).toMatchObject({
    id: "pick-suspect",
    type: "single_choice",
  });
});

test("rejects case slugs that escape the cases root", async () => {
  await expect(
    loadCaseManifest("../cases/text-first-valid", {
      casesRoot: fixturesRoot,
    }),
  ).rejects.toThrow(/slug/i);
});

test("rejects evidence source paths that escape the case directory", async () => {
  await expect(
    loadCaseManifest("text-first-traversal-source", {
      casesRoot: fixturesRoot,
    }),
  ).rejects.toThrow(/source path/i);
});

test("loads photo evidence from a payload file and keeps date optional", async () => {
  const manifest = await loadCaseManifest("photo-valid", {
    casesRoot: fixturesRoot,
  });

  expect(manifest.evidence).toHaveLength(1);
  expect(manifest.evidence[0]).toMatchObject({
    family: "photo",
    subtype: "scene_photo",
    image: "evidence/scene-photo.png",
    caption: "The vestry desk and fallen chalice.",
    sourceLabel: "Fixture archive",
    date: undefined,
  });
});

test("rejects photo assets that escape the case directory", async () => {
  await expect(
    loadCaseManifest("photo-traversal-asset", {
      casesRoot: fixturesRoot,
    }),
  ).rejects.toThrow(/image path/i);
});

test("rejects manifest loads when the expected revision does not match", async () => {
  await expect(
    loadCaseManifest("text-first-valid", {
      casesRoot: fixturesRoot,
      expectedRevision: "rev-does-not-exist",
    }),
  ).rejects.toThrow(/revision/i);
});

test("fixture cases load successfully with photo evidence included", async () => {
  const [textFirst, photo] = await Promise.all([
    loadCaseManifest("text-first-valid", { casesRoot: fixturesRoot }),
    loadCaseManifest("photo-valid", { casesRoot: fixturesRoot }),
  ]);

  expect(textFirst.evidence.some((item) => item.family === "document")).toBe(true);
  expect(photo.evidence.some((item) => item.family === "photo")).toBe(true);
});
