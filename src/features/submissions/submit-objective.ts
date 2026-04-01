import "server-only";

import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";

import {
  caseDefinitions,
  objectiveSubmissions,
  playerCaseObjectives,
  playerCases,
} from "@/db/schema";
import { loadStagedCaseManifest } from "@/features/cases/load-case-manifest";
import { loadStagedProtectedCase } from "@/features/cases/load-protected-case";
import type { ObjectiveAnswerPayload } from "@/features/cases/objective-payload";
import { evaluateObjectiveSubmission } from "@/features/submissions/evaluate-objective-submission";
import { getDb } from "@/lib/db";

type SubmitObjectiveInput = {
  playerCaseId: string;
  objectiveId: string;
  submissionToken: string;
  payload: ObjectiveAnswerPayload;
};

type SubmitObjectiveResult = {
  id: string;
  attemptNumber: number;
  isCorrect: boolean;
  nextStatus: "in_progress" | "completed" | "closed_unsolved";
  feedback: string;
};

function isSamePayload(left: unknown, right: ObjectiveAnswerPayload) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export async function submitObjective(
  input: SubmitObjectiveInput,
): Promise<SubmitObjectiveResult> {
  const db = await getDb();

  for (let retryCount = 0; retryCount < 3; retryCount += 1) {
    try {
      return await db.transaction(async (tx) => {
        const existingSubmission = await tx.query.objectiveSubmissions.findFirst({
          where: eq(objectiveSubmissions.submissionToken, input.submissionToken),
        });

        if (existingSubmission) {
          if (!isSamePayload(existingSubmission.answerPayload, input.payload)) {
            throw new Error(
              "Submission token is already bound to a different payload",
            );
          }

          return {
            id: existingSubmission.id,
            attemptNumber: existingSubmission.attemptNumber,
            isCorrect: existingSubmission.isCorrect,
            nextStatus:
              existingSubmission.nextStatus as SubmitObjectiveResult["nextStatus"],
            feedback: existingSubmission.feedback,
          };
        }

        const playerCase = await tx.query.playerCases.findFirst({
          where: eq(playerCases.id, input.playerCaseId),
        });

        if (!playerCase) {
          throw new Error("Player case not found");
        }

        if (playerCase.status !== "in_progress") {
          throw new Error("Case no longer accepts submissions");
        }

        const objectiveRow = await tx.query.playerCaseObjectives.findFirst({
          where: and(
            eq(playerCaseObjectives.playerCaseId, input.playerCaseId),
            eq(playerCaseObjectives.objectiveId, input.objectiveId),
          ),
        });

        if (!objectiveRow) {
          throw new Error("Objective row was not found");
        }

        if (objectiveRow.status === "locked") {
          throw new Error("Objective is currently locked");
        }

        if (objectiveRow.status === "solved") {
          throw new Error("Objective has already been solved");
        }

        const caseDefinition = await tx.query.caseDefinitions.findFirst({
          where: eq(caseDefinitions.id, playerCase.caseDefinitionId),
        });

        if (!caseDefinition) {
          throw new Error("Case definition not found");
        }

        const [manifest, protectedCase] = await Promise.all([
          loadStagedCaseManifest(caseDefinition.slug, {
            expectedRevision: playerCase.caseRevision,
          }),
          loadStagedProtectedCase(caseDefinition.slug, {
            expectedRevision: playerCase.caseRevision,
          }),
        ]);

        let objective:
          | (typeof manifest.stages)[number]["objectives"][number]
          | undefined;

        for (const stage of manifest.stages) {
          for (const stageObjective of stage.objectives) {
            if (stageObjective.id === input.objectiveId) {
              objective = stageObjective;
              break;
            }
          }

          if (objective) {
            break;
          }
        }

        if (!objective) {
          throw new Error(
            `Objective ${input.objectiveId} is not authored in manifest`,
          );
        }

        const canonicalAnswer = protectedCase.canonicalAnswers[input.objectiveId];

        if (!canonicalAnswer) {
          throw new Error(
            `Objective ${input.objectiveId} is missing a protected canonical answer`,
          );
        }

        const objectiveAttemptHistory =
          await tx.query.objectiveSubmissions.findMany({
            where: and(
              eq(objectiveSubmissions.playerCaseId, input.playerCaseId),
              eq(objectiveSubmissions.objectiveId, input.objectiveId),
            ),
          });
        const attemptNumber = objectiveAttemptHistory.length + 1;

        const evaluation = evaluateObjectiveSubmission({
          objective,
          canonicalAnswer,
          payload: input.payload,
          gradedFailureCount: playerCase.gradedFailureCount,
          maxGradedFailures: protectedCase.grading.maxGradedFailures,
        });
        const now = new Date();

        const [savedSubmission] = await tx
          .insert(objectiveSubmissions)
          .values({
            id: randomUUID(),
            playerCaseId: input.playerCaseId,
            objectiveId: input.objectiveId,
            submissionToken: input.submissionToken,
            answerPayload: input.payload,
            isCorrect: evaluation.isCorrect,
            feedback: evaluation.feedback,
            nextStatus: evaluation.caseStatus,
            attemptNumber,
          })
          .returning();

        if (evaluation.isCorrect) {
          await tx
            .update(playerCaseObjectives)
            .set({
              status: "solved",
              draftPayload: null,
              solvedAt: now,
              updatedAt: now,
            })
            .where(eq(playerCaseObjectives.id, objectiveRow.id));

          for (const unlockedStageId of evaluation.unlockedStageIds) {
            await tx
              .update(playerCaseObjectives)
              .set({
                status: "active",
                updatedAt: now,
              })
              .where(
                and(
                  eq(playerCaseObjectives.playerCaseId, input.playerCaseId),
                  eq(playerCaseObjectives.stageId, unlockedStageId),
                  eq(playerCaseObjectives.status, "locked"),
                ),
              );
          }
        } else {
          await tx
            .update(playerCaseObjectives)
            .set({
              draftPayload: input.payload,
              updatedAt: now,
            })
            .where(eq(playerCaseObjectives.id, objectiveRow.id));
        }

        const gradedFailureIncrement =
          !evaluation.isCorrect && objective.stakes === "graded" ? 1 : 0;
        const nextGradedFailureCount =
          playerCase.gradedFailureCount + gradedFailureIncrement;

        await tx
          .update(playerCases)
          .set({
            gradedFailureCount: nextGradedFailureCount,
            status: evaluation.caseStatus,
            terminalDebriefTitle:
              evaluation.caseStatus === "completed"
                ? protectedCase.debriefs.solved.title
                : evaluation.caseStatus === "closed_unsolved"
                  ? protectedCase.debriefs.closed_unsolved.title
                  : null,
            terminalDebriefSummary:
              evaluation.caseStatus === "completed"
                ? protectedCase.debriefs.solved.summary
                : evaluation.caseStatus === "closed_unsolved"
                  ? protectedCase.debriefs.closed_unsolved.summary
                  : null,
            updatedAt: now,
          })
          .where(eq(playerCases.id, input.playerCaseId));

        return {
          id: savedSubmission.id,
          attemptNumber,
          isCorrect: evaluation.isCorrect,
          nextStatus: evaluation.caseStatus,
          feedback: evaluation.feedback,
        };
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "23505"
      ) {
        if (retryCount === 2) {
          throw new Error("Objective submission conflicted. Please retry.");
        }

        continue;
      }

      throw error;
    }
  }

  throw new Error("Objective submission conflicted. Please retry.");
}
