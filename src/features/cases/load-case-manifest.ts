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

type ManifestWithLoadedEvidence<
  TManifest extends LegacyCaseManifest | StagedCaseManifest,
> = TManifest extends LegacyCaseManifest | StagedCaseManifest
  ? Omit<TManifest, "evidence"> & {
      evidence: CaseEvidence[];
    }
  : never;

export type LoadedLegacyCaseManifest = ManifestWithLoadedEvidence<LegacyCaseManifest>;
export type LoadedStagedCaseManifest = ManifestWithLoadedEvidence<StagedCaseManifest>;
export type LoadedCaseManifest = ManifestWithLoadedEvidence<
  LegacyCaseManifest | StagedCaseManifest
>;

function withLoadedEvidence<
  TManifest extends LegacyCaseManifest | StagedCaseManifest,
>(
  manifest: TManifest,
  evidence: CaseEvidence[],
): ManifestWithLoadedEvidence<TManifest> {
  // TypeScript does not reduce the conditional manifest type across this generic spread,
  // but the runtime shape is exact once the evidence payloads are loaded.
  return {
    ...manifest,
    evidence,
  } as unknown as ManifestWithLoadedEvidence<TManifest>;
}

async function loadManifestData<
  TManifest extends LegacyCaseManifest | StagedCaseManifest,
>(
  slug: string,
  options: LoadCaseManifestOptions | undefined,
  parser: (payload: unknown) => TManifest,
): Promise<ManifestWithLoadedEvidence<TManifest>> {
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

  return withLoadedEvidence(manifest, evidence);
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
