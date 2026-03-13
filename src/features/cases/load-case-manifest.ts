import { readFile } from "node:fs/promises";
import path from "node:path";

import { caseManifestSourceSchema } from "@/features/cases/case-schema";
import { loadEvidenceSource } from "@/features/cases/evidence/load-evidence-source";

function getCasesRoot(customRoot?: string) {
  return customRoot ?? path.join(process.cwd(), "content", "cases");
}

function getManifestPath(casesRoot: string, slug: string) {
  return path.join(casesRoot, slug, "manifest.json");
}

export async function loadCaseManifest(
  slug: string,
  options?: { casesRoot?: string },
) {
  const casesRoot = getCasesRoot(options?.casesRoot);
  const raw = await readFile(getManifestPath(casesRoot, slug), "utf8");
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
