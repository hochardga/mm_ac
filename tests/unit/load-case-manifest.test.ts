import { loadCaseManifest } from "@/features/cases/load-case-manifest";

test("manifest loader excludes canonical answers", async () => {
  const manifest = await loadCaseManifest("hollow-bishop");

  expect(manifest).not.toHaveProperty("canonicalAnswers");
});
