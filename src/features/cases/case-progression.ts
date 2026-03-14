import type { playerCaseObjectives } from "@/db/schema";
import type { LoadedStagedCaseManifest } from "@/features/cases/load-case-manifest";

type ObjectiveState = Pick<
  typeof playerCaseObjectives.$inferSelect,
  "objectiveId" | "stageId" | "status"
>;

type ProgressObjective = LoadedStagedCaseManifest["stages"][number]["objectives"][number] & {
  stageId: string;
};

type BuildCaseProgressionInput = {
  manifest: LoadedStagedCaseManifest;
  objectiveStates: ObjectiveState[];
};

type CaseProgression = {
  activeObjectives: ProgressObjective[];
  solvedObjectives: ProgressObjective[];
  visibleEvidence: LoadedStagedCaseManifest["evidence"];
  visibleHandlerPrompts: string[];
  completed: boolean;
};

export function buildCaseProgression(
  input: BuildCaseProgressionInput,
): CaseProgression {
  const objectiveStateById = new Map(
    input.objectiveStates.map((state) => [state.objectiveId, state]),
  );
  const visibleStageIds = new Set(
    input.manifest.stages
      .filter((stage) => stage.startsUnlocked)
      .map((stage) => stage.id),
  );

  for (const stage of input.manifest.stages) {
    for (const objective of stage.objectives) {
      if (objectiveStateById.get(objective.id)?.status === "solved") {
        for (const unlockedStageId of objective.successUnlocks.stageIds) {
          visibleStageIds.add(unlockedStageId);
        }
      }
    }
  }

  const visibleStages = input.manifest.stages.filter((stage) =>
    visibleStageIds.has(stage.id),
  );
  const visibleEvidenceIds = new Set(
    visibleStages.flatMap((stage) => stage.evidenceIds),
  );
  const activeObjectives: ProgressObjective[] = [];
  const solvedObjectives: ProgressObjective[] = [];

  for (const stage of visibleStages) {
    for (const objective of stage.objectives) {
      const state = objectiveStateById.get(objective.id);

      if (!state) {
        continue;
      }

      if (state.status === "active") {
        activeObjectives.push({
          ...objective,
          stageId: stage.id,
        });
      }

      if (state.status === "solved") {
        solvedObjectives.push({
          ...objective,
          stageId: stage.id,
        });
      }
    }
  }

  return {
    activeObjectives,
    solvedObjectives,
    visibleEvidence: input.manifest.evidence.filter((entry) =>
      visibleEvidenceIds.has(entry.id),
    ),
    visibleHandlerPrompts: visibleStages.flatMap((stage) => stage.handlerPrompts),
    completed: input.manifest.stages.every((stage) =>
      stage.objectives.every(
        (objective) => objectiveStateById.get(objective.id)?.status === "solved",
      ),
    ),
  };
}
