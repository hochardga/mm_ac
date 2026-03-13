import { readFile } from "node:fs/promises";

import { caseManifestSourceSchema } from "@/features/cases/case-schema";
import { loadEvidenceSource } from "@/features/cases/evidence/load-evidence-source";
import { resolveCaseFilePath, resolveCasesRoot } from "@/features/cases/paths";

export async function loadCaseManifest(
  slug: string,
  options?: { casesRoot?: string },
) {
  const casesRoot = resolveCasesRoot(options?.casesRoot);
  const { filePath } = resolveCaseFilePath(slug, "manifest.json", {
    casesRoot,
  });
  const raw = await readFile(filePath, "utf8");
  const manifest = caseManifestSourceSchema.parse(JSON.parse(raw));
  const evidence = await Promise.all(
    manifest.evidence.map((entry) =>
      loadEvidenceSource({
        caseSlug: slug,
        casesRoot,
        entry,
      }),
    ),
  );

  return {
    ...manifest,
    evidence,
  };
}
