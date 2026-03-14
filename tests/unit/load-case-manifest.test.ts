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

test("the shipped cases load successfully under the text-first evidence model", async () => {
  const [briar, bishop, harbor] = await Promise.all([
    loadCaseManifest("briar-ledger"),
    loadCaseManifest("hollow-bishop"),
    loadCaseManifest("red-harbor"),
  ]);

  expect(briar.evidence.some((item) => item.family === "document")).toBe(true);
  expect(bishop.evidence.some((item) => item.family === "thread")).toBe(true);
  expect(harbor.evidence.some((item) => item.family === "record")).toBe(true);
});
