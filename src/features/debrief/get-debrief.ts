import "server-only";

import { asc, eq } from "drizzle-orm";

import { caseDefinitions, playerCases, reportSubmissions } from "@/db/schema";
import { loadCaseManifest } from "@/features/cases/load-case-manifest";
import { loadProtectedCase } from "@/features/cases/load-protected-case";
import { getDb } from "@/lib/db";

export type DebriefStatus = "completed" | "closed_unsolved";
export type DebriefAttemptStatus = "in_progress" | DebriefStatus;

type DebriefSelection = {
  suspect: string;
  motive: string;
  method: string;
};

export type DebriefAttempt = DebriefSelection & {
  attemptNumber: number;
  nextStatus: DebriefAttemptStatus;
  feedback: string;
};

export type DebriefSummary = {
  title: string;
  summary: string;
  status: DebriefStatus;
  finalReport?: DebriefSelection & {
    attemptNumber: number;
  };
  solution: DebriefSelection;
  attempts: DebriefAttempt[];
};

function buildOptionLabelMap(
  options: Awaited<ReturnType<typeof loadCaseManifest>>["reportOptions"],
) {
  return {
    suspect: new Map(options.suspect.map((option) => [option.id, option.label])),
    motive: new Map(options.motive.map((option) => [option.id, option.label])),
    method: new Map(options.method.map((option) => [option.id, option.label])),
  };
}

function toSelectionLabels(
  selection: DebriefSelection,
  labels: ReturnType<typeof buildOptionLabelMap>,
) {
  return {
    suspect: labels.suspect.get(selection.suspect) ?? selection.suspect,
    motive: labels.motive.get(selection.motive) ?? selection.motive,
    method: labels.method.get(selection.method) ?? selection.method,
  };
}

function toDebriefStatus(status: string): DebriefStatus {
  if (status === "completed" || status === "closed_unsolved") {
    return status;
  }

  throw new Error("Debrief is not available");
}

function toDebriefAttemptStatus(status: string): DebriefAttemptStatus {
  if (
    status === "in_progress" ||
    status === "completed" ||
    status === "closed_unsolved"
  ) {
    return status;
  }

  throw new Error(`Unsupported debrief attempt status: ${status}`);
}

export async function getDebrief(
  input: { playerCaseId: string },
): Promise<DebriefSummary> {
  const db = await getDb();
  const playerCase = await db.query.playerCases.findFirst({
    where: eq(playerCases.id, input.playerCaseId),
  });

  if (
    !playerCase?.terminalDebriefTitle ||
    !playerCase.terminalDebriefSummary
  ) {
    throw new Error("Debrief is not available");
  }

  if (
    playerCase.status !== "completed" &&
    playerCase.status !== "closed_unsolved"
  ) {
    throw new Error("Debrief is not available");
  }
  const status = toDebriefStatus(playerCase.status);

  const caseDefinition = await db.query.caseDefinitions.findFirst({
    where: eq(caseDefinitions.id, playerCase.caseDefinitionId),
  });

  if (!caseDefinition) {
    throw new Error("Debrief is not available");
  }

  const [manifest, protectedCase, attempts] = await Promise.all([
    loadCaseManifest(caseDefinition.slug, {
      expectedRevision: playerCase.caseRevision,
    }),
    loadProtectedCase(caseDefinition.slug, {
      expectedRevision: playerCase.caseRevision,
    }),
    db.query.reportSubmissions.findMany({
      where: eq(reportSubmissions.playerCaseId, input.playerCaseId),
      orderBy: [asc(reportSubmissions.attemptNumber)],
    }),
  ]);
  const labels = buildOptionLabelMap(manifest.reportOptions);
  const finalAttempt = attempts.at(-1);

  return {
    title: playerCase.terminalDebriefTitle,
    summary: playerCase.terminalDebriefSummary,
    status,
    finalReport: finalAttempt
      ? {
          ...toSelectionLabels(
            {
              suspect: finalAttempt.suspectId,
              motive: finalAttempt.motiveId,
              method: finalAttempt.methodId,
            },
            labels,
          ),
          attemptNumber: finalAttempt.attemptNumber,
        }
      : undefined,
    solution: toSelectionLabels(
      {
        suspect: protectedCase.canonicalAnswers.suspect,
        motive: protectedCase.canonicalAnswers.motive,
        method: protectedCase.canonicalAnswers.method,
      },
      labels,
    ),
    attempts: attempts.map((attempt) => ({
      attemptNumber: attempt.attemptNumber,
      nextStatus: toDebriefAttemptStatus(attempt.nextStatus),
      ...toSelectionLabels(
        {
          suspect: attempt.suspectId,
          motive: attempt.motiveId,
          method: attempt.methodId,
        },
        labels,
      ),
      feedback: attempt.feedback,
    })),
  };
}
