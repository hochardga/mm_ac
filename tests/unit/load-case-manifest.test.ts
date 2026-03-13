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
