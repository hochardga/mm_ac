import {
  loadAnyCaseManifest,
  type LoadedCaseManifest,
  type LoadedStagedCaseManifest,
} from "@/features/cases/load-case-manifest";
import { loadAnyProtectedCase } from "@/features/cases/load-protected-case";

export async function validateCasePackage(
  slug: string,
  options?: { casesRoot?: string },
) {
  const [manifest, protectedCase] = await Promise.all([
    loadAnyCaseManifest(slug, options),
    loadAnyProtectedCase(slug, options),
  ]);

  if (isStagedManifest(manifest)) {
    validateStagedUnlocks(manifest);
  }

  return {
    slug: manifest.slug,
    revision: manifest.revision,
    evidenceCount: manifest.evidence.length,
    protectedCase,
  };
}

function isStagedManifest(
  manifest: LoadedCaseManifest,
): manifest is LoadedStagedCaseManifest {
  return "stages" in manifest;
}

function validateStagedUnlocks(manifest: LoadedStagedCaseManifest) {
  const stageById = new Map(manifest.stages.map((stage) => [stage.id, stage]));
  const evidenceIds = new Set(manifest.evidence.map((entry) => entry.id));
  const initiallyUnlockedStageIds = manifest.stages
    .filter((stage) => stage.startsUnlocked)
    .map((stage) => stage.id);

  if (initiallyUnlockedStageIds.length === 0) {
    throw new Error("no stage starts unlocked");
  }

  const adjacency = new Map<string, string[]>();

  for (const stage of manifest.stages) {
    for (const evidenceId of stage.evidenceIds) {
      if (!evidenceIds.has(evidenceId)) {
        throw new Error(`unknown evidence id ${evidenceId}`);
      }
    }

    const references: string[] = [];

    for (const objective of stage.objectives) {
      for (const target of objective.successUnlocks.stageIds) {
        if (!stageById.has(target)) {
          throw new Error(`unknown stage ${target} referenced by ${stage.id}`);
        }
        references.push(target);
      }
    }

    adjacency.set(stage.id, references);
  }

  const visited = new Set<string>();
  const stack = new Set<string>();

  function visit(stageId: string) {
    if (stack.has(stageId)) {
      throw new Error(`cycle detected starting at stage ${stageId}`);
    }

    if (visited.has(stageId)) {
      return;
    }

    visited.add(stageId);
    stack.add(stageId);

    for (const neighbor of adjacency.get(stageId) ?? []) {
      visit(neighbor);
    }

    stack.delete(stageId);
  }

  for (const stage of manifest.stages) {
    visit(stage.id);
  }

  const reachableStageIds = new Set<string>(initiallyUnlockedStageIds);
  const queue = [...initiallyUnlockedStageIds];

  while (queue.length > 0) {
    const currentStageId = queue.shift();

    if (!currentStageId) {
      continue;
    }

    for (const neighbor of adjacency.get(currentStageId) ?? []) {
      if (reachableStageIds.has(neighbor)) {
        continue;
      }

      reachableStageIds.add(neighbor);
      queue.push(neighbor);
    }
  }

  const unreachableStages = manifest.stages
    .map((stage) => stage.id)
    .filter((stageId) => !reachableStageIds.has(stageId));

  if (unreachableStages.length > 0) {
    throw new Error(`unreachable stages: ${unreachableStages.join(", ")}`);
  }
}
