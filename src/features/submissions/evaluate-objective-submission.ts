import type { StagedProtectedCase } from "@/features/cases/case-schema";
import type { LoadedStagedCaseManifest } from "@/features/cases/load-case-manifest";
import type { ObjectiveAnswerPayload } from "@/features/cases/objective-payload";

type StagedObjective = LoadedStagedCaseManifest["stages"][number]["objectives"][number];
type CanonicalObjectiveAnswer = StagedProtectedCase["canonicalAnswers"][string];

export type EvaluateObjectiveSubmissionInput = {
  objective: StagedObjective;
  canonicalAnswer: CanonicalObjectiveAnswer;
  payload: ObjectiveAnswerPayload;
  gradedFailureCount: number;
  maxGradedFailures: number;
};

export type ObjectiveSubmissionEvaluation = {
  isCorrect: boolean;
  objectiveStatus: "active" | "solved" | "failed";
  caseStatus: "in_progress" | "completed" | "closed_unsolved";
  feedback: string;
  unlockedStageIds: string[];
};

function sortedUnique(values: string[]) {
  return [...new Set(values)].sort();
}

function payloadMatchesCanonical(
  payload: ObjectiveAnswerPayload,
  canonicalAnswer: CanonicalObjectiveAnswer,
) {
  if (payload.type !== canonicalAnswer.type) {
    return false;
  }

  switch (canonicalAnswer.type) {
    case "single_choice":
      return payload.choiceId === canonicalAnswer.choiceId;
    case "multi_choice":
      return (
        JSON.stringify(sortedUnique(payload.choiceIds)) ===
        JSON.stringify(sortedUnique(canonicalAnswer.choiceIds))
      );
    case "boolean":
      return payload.value === canonicalAnswer.value;
    case "code_entry":
      return (
        payload.value.trim().toLowerCase() ===
        canonicalAnswer.value.trim().toLowerCase()
      );
  }
}

export function evaluateObjectiveSubmission(
  input: EvaluateObjectiveSubmissionInput,
): ObjectiveSubmissionEvaluation {
  const isCorrect = payloadMatchesCanonical(input.payload, input.canonicalAnswer);

  if (isCorrect) {
    return {
      isCorrect: true,
      objectiveStatus: "solved",
      caseStatus: input.objective.successUnlocks.resolvesCase
        ? "completed"
        : "in_progress",
      feedback: input.objective.successUnlocks.resolvesCase
        ? "Objective solved. Case resolved."
        : "Objective solved.",
      unlockedStageIds: input.objective.successUnlocks.stageIds,
    };
  }

  if (input.objective.stakes === "advisory") {
    return {
      isCorrect: false,
      objectiveStatus: "active",
      caseStatus: "in_progress",
      feedback: "That answer is not correct yet. Keep investigating.",
      unlockedStageIds: [],
    };
  }

  const nextFailureCount = input.gradedFailureCount + 1;
  const failureBudgetExhausted = nextFailureCount >= input.maxGradedFailures;

  return {
    isCorrect: false,
    objectiveStatus: "failed",
    caseStatus: failureBudgetExhausted ? "closed_unsolved" : "in_progress",
    feedback: failureBudgetExhausted
      ? "Failure budget exhausted. Case closed unsolved."
      : "Incorrect graded objective submission.",
    unlockedStageIds: [],
  };
}
