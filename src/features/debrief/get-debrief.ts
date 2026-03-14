import "server-only";

import { asc, eq } from "drizzle-orm";

import {
  caseDefinitions,
  objectiveSubmissions,
  playerCases,
  reportSubmissions,
} from "@/db/schema";
import type {
  LegacyProtectedCase,
  ProtectedCase,
  StagedProtectedCase,
} from "@/features/cases/case-schema";
import type {
  LoadedCaseManifest,
  LoadedLegacyCaseManifest,
  LoadedStagedCaseManifest,
} from "@/features/cases/load-case-manifest";
import { loadAnyCaseManifest } from "@/features/cases/load-case-manifest";
import { loadAnyProtectedCase } from "@/features/cases/load-protected-case";
import type { ObjectiveAnswerPayload } from "@/features/cases/objective-payload";
import { getDb } from "@/lib/db";

export type DebriefStatus = "completed" | "closed_unsolved";
export type DebriefAttemptStatus = "in_progress" | DebriefStatus;

export type DebriefEntry = {
  label: string;
  playerValue?: string;
  solutionValue: string;
};

export type DebriefAttempt = {
  attemptNumber: number;
  nextStatus: DebriefAttemptStatus;
  feedback: string;
  entries: DebriefEntry[];
};

export type DebriefSummary = {
  title: string;
  summary: string;
  status: DebriefStatus;
  finalReport?: {
    eyebrow?: string;
    entries: DebriefEntry[];
  };
  solution: DebriefEntry[];
  attempts: DebriefAttempt[];
};

type LegacySelection = {
  suspect: string;
  motive: string;
  method: string;
};

function isLegacyManifest(
  manifest: LoadedCaseManifest,
): manifest is LoadedLegacyCaseManifest {
  return "reportOptions" in manifest;
}

function isStagedManifest(
  manifest: LoadedCaseManifest,
): manifest is LoadedStagedCaseManifest {
  return "stages" in manifest;
}

function isLegacyProtectedCase(
  protectedCase: ProtectedCase,
): protectedCase is LegacyProtectedCase {
  return "feedbackTemplates" in protectedCase;
}

function isStagedProtectedCase(
  protectedCase: ProtectedCase,
): protectedCase is StagedProtectedCase {
  return !("feedbackTemplates" in protectedCase);
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

function buildOptionLabelMap(options: LoadedLegacyCaseManifest["reportOptions"]) {
  return {
    suspect: new Map(options.suspect.map((option) => [option.id, option.label])),
    motive: new Map(options.motive.map((option) => [option.id, option.label])),
    method: new Map(options.method.map((option) => [option.id, option.label])),
  };
}

function toLegacySelectionEntries(
  selection: LegacySelection,
  labels: ReturnType<typeof buildOptionLabelMap>,
): DebriefEntry[] {
  return [
    {
      label: "Suspect",
      playerValue: labels.suspect.get(selection.suspect) ?? selection.suspect,
      solutionValue: labels.suspect.get(selection.suspect) ?? selection.suspect,
    },
    {
      label: "Motive",
      playerValue: labels.motive.get(selection.motive) ?? selection.motive,
      solutionValue: labels.motive.get(selection.motive) ?? selection.motive,
    },
    {
      label: "Method",
      playerValue: labels.method.get(selection.method) ?? selection.method,
      solutionValue: labels.method.get(selection.method) ?? selection.method,
    },
  ];
}

function toLegacySolutionEntries(
  selection: LegacySelection,
  labels: ReturnType<typeof buildOptionLabelMap>,
): DebriefEntry[] {
  return [
    {
      label: "Suspect",
      solutionValue: labels.suspect.get(selection.suspect) ?? selection.suspect,
    },
    {
      label: "Motive",
      solutionValue: labels.motive.get(selection.motive) ?? selection.motive,
    },
    {
      label: "Method",
      solutionValue: labels.method.get(selection.method) ?? selection.method,
    },
  ];
}

function getStagedObjectiveMap(manifest: LoadedStagedCaseManifest) {
  const objectiveMap = new Map<
    string,
    LoadedStagedCaseManifest["stages"][number]["objectives"][number]
  >();

  for (const stage of manifest.stages) {
    for (const objective of stage.objectives) {
      objectiveMap.set(objective.id, objective);
    }
  }

  return objectiveMap;
}

function formatStagedAnswer(
  objective: LoadedStagedCaseManifest["stages"][number]["objectives"][number],
  payload:
    | ObjectiveAnswerPayload
    | StagedProtectedCase["canonicalAnswers"][string],
) {
  switch (objective.type) {
    case "single_choice":
      if (payload.type !== "single_choice") {
        throw new Error(
          `Objective ${objective.id} expected single_choice payload but received ${payload.type}`,
        );
      }

      return (
        objective.options.find((option) => option.id === payload.choiceId)?.label ??
        payload.choiceId
      );
    case "multi_choice":
      if (payload.type !== "multi_choice") {
        throw new Error(
          `Objective ${objective.id} expected multi_choice payload but received ${payload.type}`,
        );
      }

      return payload.choiceIds
        .map(
          (choiceId) =>
            objective.options.find((option) => option.id === choiceId)?.label ??
            choiceId,
        )
        .join(", ");
    case "boolean":
      if (payload.type !== "boolean") {
        throw new Error(
          `Objective ${objective.id} expected boolean payload but received ${payload.type}`,
        );
      }

      return payload.value ? "Yes" : "No";
    case "code_entry":
      if (payload.type !== "code_entry") {
        throw new Error(
          `Objective ${objective.id} expected code_entry payload but received ${payload.type}`,
        );
      }

      return payload.value;
  }
}

function buildLegacyDebrief(
  manifest: LoadedLegacyCaseManifest,
  protectedCase: LegacyProtectedCase,
  attempts: typeof reportSubmissions.$inferSelect[],
) {
  const labels = buildOptionLabelMap(manifest.reportOptions);
  const finalAttempt = attempts.at(-1);

  return {
    finalReport: finalAttempt
      ? {
          eyebrow: `Attempt ${finalAttempt.attemptNumber}`,
          entries: toLegacySelectionEntries(
            {
              suspect: finalAttempt.suspectId,
              motive: finalAttempt.motiveId,
              method: finalAttempt.methodId,
            },
            labels,
          ).map((entry) => ({
            ...entry,
            solutionValue: entry.playerValue ?? entry.solutionValue,
          })),
        }
      : undefined,
    solution: toLegacySolutionEntries(
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
      feedback: attempt.feedback,
      entries: [
        {
          label: "Suspect",
          playerValue:
            labels.suspect.get(attempt.suspectId) ?? attempt.suspectId,
          solutionValue:
            labels.suspect.get(protectedCase.canonicalAnswers.suspect) ??
            protectedCase.canonicalAnswers.suspect,
        },
        {
          label: "Motive",
          playerValue:
            labels.motive.get(attempt.motiveId) ?? attempt.motiveId,
          solutionValue:
            labels.motive.get(protectedCase.canonicalAnswers.motive) ??
            protectedCase.canonicalAnswers.motive,
        },
        {
          label: "Method",
          playerValue:
            labels.method.get(attempt.methodId) ?? attempt.methodId,
          solutionValue:
            labels.method.get(protectedCase.canonicalAnswers.method) ??
            protectedCase.canonicalAnswers.method,
        },
      ],
    })),
  };
}

function buildStagedDebrief(
  manifest: LoadedStagedCaseManifest,
  protectedCase: StagedProtectedCase,
  attempts: typeof objectiveSubmissions.$inferSelect[],
) {
  const objectiveMap = getStagedObjectiveMap(manifest);
  const gradedObjectives = manifest.stages.flatMap((stage) =>
    stage.objectives.filter((objective) => objective.stakes === "graded"),
  );
  const latestSubmissionByObjective = new Map<string, (typeof attempts)[number]>();

  for (const attempt of attempts) {
    latestSubmissionByObjective.set(attempt.objectiveId, attempt);
  }

  const solution = gradedObjectives.map((objective) => {
    const canonicalAnswer = protectedCase.canonicalAnswers[objective.id];

    if (!canonicalAnswer) {
      throw new Error(`Canonical answer missing for objective ${objective.id}`);
    }

    return {
      label: objective.prompt,
      solutionValue: formatStagedAnswer(objective, canonicalAnswer),
    } satisfies DebriefEntry;
  });

  const finalEntries = gradedObjectives.flatMap((objective) => {
    const canonicalAnswer = protectedCase.canonicalAnswers[objective.id];
    const latestSubmission = latestSubmissionByObjective.get(objective.id);

    if (!canonicalAnswer || !latestSubmission) {
      return [];
    }

    return [
      {
        label: objective.prompt,
        playerValue: formatStagedAnswer(
          objective,
          latestSubmission.answerPayload as ObjectiveAnswerPayload,
        ),
        solutionValue: formatStagedAnswer(objective, canonicalAnswer),
      } satisfies DebriefEntry,
    ];
  });

  return {
    finalReport:
      finalEntries.length > 0
        ? {
            eyebrow: "Latest graded answers",
            entries: finalEntries,
          }
        : undefined,
    solution,
    attempts: attempts.flatMap((attempt) => {
      const objective = objectiveMap.get(attempt.objectiveId);
      const canonicalAnswer = protectedCase.canonicalAnswers[attempt.objectiveId];

      if (!objective || objective.stakes !== "graded" || !canonicalAnswer) {
        return [];
      }

      return [
        {
          attemptNumber: attempt.attemptNumber,
          nextStatus: toDebriefAttemptStatus(attempt.nextStatus),
          feedback: attempt.feedback,
          entries: [
            {
              label: objective.prompt,
              playerValue: formatStagedAnswer(
                objective,
                attempt.answerPayload as ObjectiveAnswerPayload,
              ),
              solutionValue: formatStagedAnswer(objective, canonicalAnswer),
            },
          ],
        } satisfies DebriefAttempt,
      ];
    }),
  };
}

export async function getDebrief(
  input: { playerCaseId: string },
): Promise<DebriefSummary> {
  const db = await getDb();
  const playerCase = await db.query.playerCases.findFirst({
    where: eq(playerCases.id, input.playerCaseId),
  });

  if (!playerCase?.terminalDebriefTitle || !playerCase.terminalDebriefSummary) {
    throw new Error("Debrief is not available");
  }

  if (playerCase.status !== "completed" && playerCase.status !== "closed_unsolved") {
    throw new Error("Debrief is not available");
  }
  const status = toDebriefStatus(playerCase.status);

  const caseDefinition = await db.query.caseDefinitions.findFirst({
    where: eq(caseDefinitions.id, playerCase.caseDefinitionId),
  });

  if (!caseDefinition) {
    throw new Error("Debrief is not available");
  }

  const [manifest, protectedCase] = await Promise.all([
    loadAnyCaseManifest(caseDefinition.slug, {
      expectedRevision: playerCase.caseRevision,
    }),
    loadAnyProtectedCase(caseDefinition.slug, {
      expectedRevision: playerCase.caseRevision,
    }),
  ]);

  if (isLegacyManifest(manifest) && isLegacyProtectedCase(protectedCase)) {
    const attempts = await db.query.reportSubmissions.findMany({
      where: eq(reportSubmissions.playerCaseId, input.playerCaseId),
      orderBy: [asc(reportSubmissions.attemptNumber)],
    });
    const legacy = buildLegacyDebrief(manifest, protectedCase, attempts);

    return {
      title: playerCase.terminalDebriefTitle,
      summary: playerCase.terminalDebriefSummary,
      status,
      finalReport: legacy.finalReport,
      solution: legacy.solution,
      attempts: legacy.attempts,
    };
  }

  if (isStagedManifest(manifest) && isStagedProtectedCase(protectedCase)) {
    const attempts = await db.query.objectiveSubmissions.findMany({
      where: eq(objectiveSubmissions.playerCaseId, input.playerCaseId),
      orderBy: [asc(objectiveSubmissions.createdAt)],
    });
    const staged = buildStagedDebrief(manifest, protectedCase, attempts);

    return {
      title: playerCase.terminalDebriefTitle,
      summary: playerCase.terminalDebriefSummary,
      status,
      finalReport: staged.finalReport,
      solution: staged.solution,
      attempts: staged.attempts,
    };
  }

  throw new Error("Manifest and protected case types do not match");
}
