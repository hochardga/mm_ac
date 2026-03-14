import type { playerCaseObjectives } from "@/db/schema";
import type { LoadedStagedCaseManifest } from "@/features/cases/load-case-manifest";

type ObjectiveState = Pick<
  typeof playerCaseObjectives.$inferSelect,
  "objectiveId" | "stageId" | "status"
>;

type ProgressObjective = LoadedStagedCaseManifest["stages"][number]["objectives"][number] & {
  stageId: string;
};

export type CaseProgressSnapshot = {
  focusStage: {
    id: string;
    title: string;
    summary: string;
    position: number;
  };
  visibleStageCount: number;
  totalStageCount: number;
  solvedObjectiveCount: number;
  totalObjectiveCount: number;
  visibleEvidenceCount: number;
  nextObjectivePrompt?: string;
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
  snapshot: CaseProgressSnapshot;
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
  const visibleEvidence = input.manifest.evidence.filter((entry) =>
    visibleEvidenceIds.has(entry.id),
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

  const focusStage =
    visibleStages.find((stage) =>
      activeObjectives.some((objective) => objective.stageId === stage.id),
    ) ?? visibleStages.at(-1);

  if (!focusStage) {
    throw new Error("Staged case progression requires at least one visible stage");
  }

  return {
    activeObjectives,
    solvedObjectives,
    visibleEvidence,
    visibleHandlerPrompts: visibleStages.flatMap((stage) => stage.handlerPrompts),
    snapshot: {
      focusStage: {
        id: focusStage.id,
        title: focusStage.title,
        summary: focusStage.summary,
        position:
          input.manifest.stages.findIndex((stage) => stage.id === focusStage.id) + 1,
      },
      visibleStageCount: visibleStages.length,
      totalStageCount: input.manifest.stages.length,
      solvedObjectiveCount: solvedObjectives.length,
      totalObjectiveCount: input.manifest.stages.reduce(
        (count, stage) => count + stage.objectives.length,
        0,
      ),
      visibleEvidenceCount: visibleEvidence.length,
      nextObjectivePrompt: activeObjectives[0]?.prompt,
    },
    completed: input.manifest.stages.every((stage) =>
      stage.objectives.every(
        (objective) => objectiveStateById.get(objective.id)?.status === "solved",
      ),
    ),
  };
}
