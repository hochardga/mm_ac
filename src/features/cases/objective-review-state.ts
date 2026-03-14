import type { objectiveSubmissions } from "@/db/schema";
import { formatStagedAnswer } from "@/features/cases/format-staged-answer";
import type { LoadedStagedCaseManifest } from "@/features/cases/load-case-manifest";
import type { ObjectiveAnswerPayload } from "@/features/cases/objective-payload";

type ObjectiveSubmissionRow = typeof objectiveSubmissions.$inferSelect;

type ObjectiveAttemptReview = {
  attemptNumber: number;
  answerLabel: string;
  feedback: string;
  isGraded: boolean;
  statusLabel: string;
};

export type ObjectiveReviewState = {
  failureBudget: {
    spent: number;
    max: number;
    remaining: number;
    summaryLabel: string;
  };
  latestGradedFeedback: {
    attemptNumber: number;
    feedback: string;
    objectiveId: string;
  } | null;
  attemptsByObjective: Map<string, ObjectiveAttemptReview[]>;
};

function getStatusLabel(input: {
  isCorrect: boolean;
  nextStatus: string;
  stakes: "advisory" | "graded";
}) {
  if (input.isCorrect) {
    return input.nextStatus === "completed" ? "Case Resolved" : "Objective Solved";
  }

  if (input.nextStatus === "closed_unsolved") {
    return "Case Closed";
  }

  return input.stakes === "graded" ? "Incorrect" : "Keep Investigating";
}

function getSummaryLabel(remaining: number) {
  if (remaining === 1) {
    return "1 safe graded submission remains";
  }

  return `${remaining} safe graded submissions remain`;
}

export function buildObjectiveReviewState(input: {
  manifest: Pick<LoadedStagedCaseManifest, "stages">;
  objectiveSubmissions: ObjectiveSubmissionRow[];
  gradedFailureCount: number;
  maxGradedFailures: number;
}): ObjectiveReviewState {
  const objectiveMap = new Map<
    string,
    LoadedStagedCaseManifest["stages"][number]["objectives"][number]
  >();

  for (const stage of input.manifest.stages) {
    for (const objective of stage.objectives) {
      objectiveMap.set(objective.id, objective);
    }
  }

  const attemptsByObjective = new Map<string, ObjectiveAttemptReview[]>();

  for (const submission of [...input.objectiveSubmissions].sort(
    (left, right) => left.attemptNumber - right.attemptNumber,
  )) {
    const objective = objectiveMap.get(submission.objectiveId);

    if (!objective) {
      continue;
    }

    const currentAttempts = attemptsByObjective.get(submission.objectiveId) ?? [];
    currentAttempts.push({
      attemptNumber: submission.attemptNumber,
      answerLabel: formatStagedAnswer(
        objective,
        submission.answerPayload as ObjectiveAnswerPayload,
      ),
      feedback: submission.feedback,
      isGraded: objective.stakes === "graded",
      statusLabel: getStatusLabel({
        isCorrect: submission.isCorrect,
        nextStatus: submission.nextStatus,
        stakes: objective.stakes,
      }),
    });
    attemptsByObjective.set(submission.objectiveId, currentAttempts);
  }

  const latestGradedSubmission = [...input.objectiveSubmissions]
    .filter((submission) => objectiveMap.get(submission.objectiveId)?.stakes === "graded")
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())[0];
  const remaining = Math.max(input.maxGradedFailures - input.gradedFailureCount, 0);

  return {
    failureBudget: {
      spent: input.gradedFailureCount,
      max: input.maxGradedFailures,
      remaining,
      summaryLabel: getSummaryLabel(remaining),
    },
    latestGradedFeedback: latestGradedSubmission
      ? {
          attemptNumber: latestGradedSubmission.attemptNumber,
          feedback: latestGradedSubmission.feedback,
          objectiveId: latestGradedSubmission.objectiveId,
        }
      : null,
    attemptsByObjective,
  };
}
