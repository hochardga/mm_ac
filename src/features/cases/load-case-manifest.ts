import { readFile } from "node:fs/promises";

import {
  caseManifestSourceSchema,
  legacyCaseManifestSourceSchema,
  stagedCaseManifestSourceSchema,
  type LegacyCaseManifest,
  type StagedCaseManifest,
} from "@/features/cases/case-schema";
import type { CaseEvidence } from "@/features/cases/evidence/schema";
import { loadEvidenceSource } from "@/features/cases/evidence/load-evidence-source";
import { resolveCaseFilePath, resolveCasesRoot } from "@/features/cases/paths";

type LoadCaseManifestOptions = {
  casesRoot?: string;
  expectedRevision?: string;
};

export type LoadedLegacyCaseManifest = Omit<LegacyCaseManifest, "evidence"> & {
  evidence: CaseEvidence[];
};
export type LoadedStagedCaseManifest = Omit<StagedCaseManifest, "evidence"> & {
  evidence: CaseEvidence[];
};
export type LoadedCaseManifest =
  | LoadedLegacyCaseManifest
  | LoadedStagedCaseManifest;

async function loadManifestData<
  TManifest extends LegacyCaseManifest | StagedCaseManifest,
>(
  slug: string,
  options: LoadCaseManifestOptions | undefined,
  parser: (payload: unknown) => TManifest,
): Promise<Omit<TManifest, "evidence"> & { evidence: CaseEvidence[] }> {
  const casesRoot = resolveCasesRoot(options?.casesRoot);
  const { filePath } = resolveCaseFilePath(slug, "manifest.json", {
    casesRoot,
  });
  const raw = await readFile(filePath, "utf8");
  const parsed = JSON.parse(raw);
  const manifest = parser(parsed);

  if (
    options?.expectedRevision &&
    manifest.revision !== options.expectedRevision
  ) {
    throw new Error(
      `Manifest revision ${manifest.revision} does not match expected revision ${options.expectedRevision}`,
    );
  }

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

export async function loadCaseManifest(
  slug: string,
  options?: LoadCaseManifestOptions,
): Promise<LoadedLegacyCaseManifest> {
  return loadManifestData(
    slug,
    options,
    legacyCaseManifestSourceSchema.parse,
  );
}

export async function loadStagedCaseManifest(
  slug: string,
  options?: LoadCaseManifestOptions,
): Promise<LoadedStagedCaseManifest> {
  return loadManifestData(
    slug,
    options,
    stagedCaseManifestSourceSchema.parse,
  );
}

export async function loadAnyCaseManifest(
  slug: string,
  options?: LoadCaseManifestOptions,
): Promise<LoadedCaseManifest> {
  return loadManifestData(
    slug,
    options,
    caseManifestSourceSchema.parse,
  );
}
