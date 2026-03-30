import path from "node:path";

import {
  loadAnyCaseManifest,
  loadCaseManifest,
  loadStagedCaseManifest,
} from "@/features/cases/load-case-manifest";

const fixturesRoot = path.join(process.cwd(), "tests", "fixtures", "cases");

test("loads normalized evidence from per-item source files", async () => {
  const manifest = await loadStagedCaseManifest("text-first-valid", {
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
  const manifest = await loadStagedCaseManifest("text-first-valid", {
    casesRoot: fixturesRoot,
  });

  expect(manifest).not.toHaveProperty("canonicalAnswers");
});

test("loads staged manifests with complexity and objectives", async () => {
  const manifest = await loadStagedCaseManifest("staged-valid", {
    casesRoot: fixturesRoot,
  });

  expect(manifest.complexity).toBe("standard");
  expect(manifest.stages).toHaveLength(1);
  expect(manifest.stages[0]).toMatchObject({
    id: "briefing",
    startsUnlocked: true,
  });
  expect(manifest.stages[0].objectives.map((objective) => objective.type)).toEqual(
    expect.arrayContaining([
      "single_choice",
      "multi_choice",
      "boolean",
      "code_entry",
    ]),
  );
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
    loadStagedCaseManifest("text-first-traversal-source", {
      casesRoot: fixturesRoot,
    }),
  ).rejects.toThrow(/source path/i);
});

test("loads photo evidence from a payload file and keeps date optional", async () => {
  const manifest = await loadStagedCaseManifest("photo-valid", {
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
    loadStagedCaseManifest("photo-traversal-asset", {
      casesRoot: fixturesRoot,
    }),
  ).rejects.toThrow(/image path/i);
});

test("loads audio, diagram, and webpage evidence from payload files", async () => {
  const manifest = await loadStagedCaseManifest("media-family-valid", {
    casesRoot: fixturesRoot,
  });

  expect(manifest.evidence.map((entry) => entry.family)).toEqual([
    "audio",
    "diagram",
    "webpage",
  ]);
});

test("rejects audio assets that escape the case directory", async () => {
  await expect(
    loadStagedCaseManifest("audio-traversal-asset", {
      casesRoot: fixturesRoot,
    }),
  ).rejects.toThrow(/audio asset path/i);
});

test("rejects unsupported diagram element types", async () => {
  await expect(
    loadStagedCaseManifest("diagram-invalid-element", {
      casesRoot: fixturesRoot,
    }),
  ).rejects.toThrow(/type/i);
});

test("rejects unsupported webpage block types", async () => {
  await expect(
    loadStagedCaseManifest("webpage-invalid-block", {
      casesRoot: fixturesRoot,
    }),
  ).rejects.toThrow(/type/i);
});

test("rejects manifest loads when the expected revision does not match", async () => {
  await expect(
    loadStagedCaseManifest("text-first-valid", {
      casesRoot: fixturesRoot,
      expectedRevision: "rev-does-not-exist",
    }),
  ).rejects.toThrow(/revision/i);
});

test("fixture cases load successfully with photo evidence included", async () => {
  const [textFirst, photo, media] = await Promise.all([
    loadStagedCaseManifest("text-first-valid", { casesRoot: fixturesRoot }),
    loadStagedCaseManifest("photo-valid", { casesRoot: fixturesRoot }),
    loadStagedCaseManifest("media-family-valid", { casesRoot: fixturesRoot }),
  ]);

  expect(textFirst.evidence.some((item) => item.family === "document")).toBe(true);
  expect(photo.evidence.some((item) => item.family === "photo")).toBe(true);
  expect(media.evidence.some((item) => item.family === "audio")).toBe(true);
});

test("the shipped cases load successfully with photo evidence included", async () => {
  const [briar, bishop, harbor] = await Promise.all([
    loadAnyCaseManifest("briar-ledger"),
    loadAnyCaseManifest("hollow-bishop"),
    loadAnyCaseManifest("red-harbor"),
  ]);

  expect(briar.evidence.some((item) => item.family === "document")).toBe(true);
  expect(bishop.evidence.some((item) => item.family === "photo")).toBe(true);
  expect(harbor.evidence.some((item) => item.family === "record")).toBe(true);
  expect("complexity" in briar && briar.complexity).toBe("deep");
  expect("complexity" in bishop && bishop.complexity).toBe("standard");
  expect("complexity" in harbor && harbor.complexity).toBe("light");
});

test("the shipped showcase case loads every supported evidence family", async () => {
  const manifest = await loadAnyCaseManifest("evidence-variety-showcase");

  expect(new Set(manifest.evidence.map((entry) => entry.family))).toEqual(
    new Set([
      "document",
      "record",
      "thread",
      "photo",
      "audio",
      "diagram",
      "webpage",
    ]),
  );
});
