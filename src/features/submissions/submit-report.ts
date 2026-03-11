import "server-only";

import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import { caseDefinitions, playerCases, reportDrafts, reportSubmissions } from "@/db/schema";
import { evaluateReport } from "@/features/submissions/evaluate-report";
import { getDb } from "@/lib/db";

type SubmitReportInput = {
  playerCaseId: string;
  submissionToken: string;
  answers: {
    suspectId: string;
    motiveId: string;
    methodId: string;
  };
};

export async function submitReport(input: SubmitReportInput) {
  const db = await getDb();

  return db.transaction(async (tx) => {
    const existingSubmission = await tx.query.reportSubmissions.findFirst({
      where: eq(reportSubmissions.submissionToken, input.submissionToken),
    });

    if (existingSubmission) {
      return {
        id: existingSubmission.id,
        attemptNumber: existingSubmission.attemptNumber,
        nextStatus: existingSubmission.nextStatus,
        feedback: existingSubmission.feedback,
      };
    }

    const playerCase = await tx.query.playerCases.findFirst({
      where: eq(playerCases.id, input.playerCaseId),
    });

    if (!playerCase) {
      throw new Error("Player case not found");
    }

    const caseDefinition = await tx.query.caseDefinitions.findFirst({
      where: eq(caseDefinitions.id, playerCase.caseDefinitionId),
    });

    if (!caseDefinition) {
      throw new Error("Case definition not found");
    }

    const existingAttempts = await tx.query.reportSubmissions.findMany({
      where: eq(reportSubmissions.playerCaseId, input.playerCaseId),
    });
    const attemptNumber = existingAttempts.length + 1;
    const evaluation = await evaluateReport({
      answers: input.answers,
      attemptNumber,
      protectedCaseSlug: caseDefinition.slug,
    });

    const [savedSubmission] = await tx
      .insert(reportSubmissions)
      .values({
        id: randomUUID(),
        playerCaseId: input.playerCaseId,
        submissionToken: input.submissionToken,
        suspectId: input.answers.suspectId,
        motiveId: input.answers.motiveId,
        methodId: input.answers.methodId,
        attemptNumber,
        nextStatus: evaluation.nextStatus,
        feedback: evaluation.feedback,
      })
      .returning();

    await tx
      .update(playerCases)
      .set({
        status: evaluation.nextStatus,
        terminalDebriefTitle: evaluation.debrief?.title ?? null,
        terminalDebriefSummary: evaluation.debrief?.summary ?? null,
        updatedAt: new Date(),
      })
      .where(eq(playerCases.id, input.playerCaseId));

    await tx
      .update(reportDrafts)
      .set({
        attemptCount: attemptNumber,
        updatedAt: new Date(),
      })
      .where(eq(reportDrafts.playerCaseId, input.playerCaseId));

    return {
      id: savedSubmission.id,
      attemptNumber,
      nextStatus: evaluation.nextStatus,
      feedback: evaluation.feedback,
    };
  });
}
