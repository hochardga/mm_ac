import "server-only";

import { randomUUID } from "node:crypto";

import { and, desc, eq } from "drizzle-orm";

import {
  analyticsEvents,
  notes,
  objectiveSubmissions,
  playerCaseObjectives,
  playerCases,
  reportDrafts,
  reportSubmissions,
} from "@/db/schema";
import { buildCaseContinuity } from "@/features/cases/case-continuity";
import {
  loadAnyCaseManifest,
  type LoadedCaseManifest,
  type LoadedStagedCaseManifest,
} from "@/features/cases/load-case-manifest";
import { ensureCaseDefinition } from "@/features/cases/sync-case-definitions";
import { writeAnalyticsEvent } from "@/lib/analytics";
import { getDb, type AppTransaction } from "@/lib/db";

async function buildResumeTarget(
  tx: AppTransaction,
  playerCase: typeof playerCases.$inferSelect,
  caseSlug: string,
) {
  const [savedNote, savedDraft, latestSubmission, objectiveStates, objectiveSubmissionRows] =
    await Promise.all([
    tx.query.notes.findFirst({
      where: eq(notes.playerCaseId, playerCase.id),
    }),
    tx.query.reportDrafts.findFirst({
      where: eq(reportDrafts.playerCaseId, playerCase.id),
    }),
    tx.query.reportSubmissions.findFirst({
      where: eq(reportSubmissions.playerCaseId, playerCase.id),
      orderBy: [desc(reportSubmissions.attemptNumber)],
    }),
    tx.query.playerCaseObjectives.findMany({
      where: eq(playerCaseObjectives.playerCaseId, playerCase.id),
    }),
    tx.query.objectiveSubmissions.findMany({
      where: eq(objectiveSubmissions.playerCaseId, playerCase.id),
      orderBy: [desc(objectiveSubmissions.createdAt)],
    }),
  ]);
  const continuity = buildCaseContinuity({
    caseSlug,
    status: playerCase.status as
      | "new"
      | "in_progress"
      | "completed"
      | "closed_unsolved",
    lastViewedEvidenceId: playerCase.lastViewedEvidenceId,
    lastViewedEvidenceAt: playerCase.lastViewedEvidenceAt,
    note: savedNote,
    draft: savedDraft,
    latestSubmission,
    objectiveStates,
    objectiveSubmissions: objectiveSubmissionRows,
    playerCaseUpdatedAt: playerCase.updatedAt,
  });

  return {
    caseSlug,
    section: continuity.section,
    label: continuity.label,
    description: continuity.description,
    href: continuity.href,
    noteBody: savedNote?.body ?? "",
    draft: savedDraft
      ? {
          suspectId: savedDraft.suspectId,
          motiveId: savedDraft.motiveId,
          methodId: savedDraft.methodId,
        }
      : null,
    lastActivityAt: continuity.lastActivityAt ?? playerCase.updatedAt,
  };
}

function isStagedManifest(
  manifest: LoadedCaseManifest,
): manifest is LoadedStagedCaseManifest {
  return "stages" in manifest;
}

export async function openCase(input: { userId: string; caseSlug: string }) {
  const db = await getDb();

  return db.transaction(async (tx) => {
    const definition = await ensureCaseDefinition(tx, input.caseSlug);

    if (!definition || !definition.currentPublishedRevision) {
      throw new Error("Case is not currently available");
    }

    const existingPlayerCase = await tx.query.playerCases.findFirst({
      where: and(
        eq(playerCases.userId, input.userId),
        eq(playerCases.caseDefinitionId, definition.id),
      ),
    });

    if (existingPlayerCase) {
      const [existingEvent] = await tx
        .select()
        .from(analyticsEvents)
        .where(
          and(
            eq(analyticsEvents.playerId, input.userId),
            eq(analyticsEvents.caseDefinitionId, definition.id),
            eq(analyticsEvents.name, "Case started"),
          ),
        )
        .limit(1);
      const resumeTarget = await buildResumeTarget(
        tx,
        existingPlayerCase,
        input.caseSlug,
      );

      return {
        playerCase: existingPlayerCase,
        resumeTarget,
        analyticsEvent:
          existingEvent ??
          (await writeAnalyticsEvent(tx, {
            name: "Case started",
            playerId: input.userId,
            sessionId: randomUUID(),
            caseDefinitionId: definition.id,
            caseRevision: existingPlayerCase.caseRevision,
          })),
      };
    }

    const [createdPlayerCase] = await tx
      .insert(playerCases)
      .values({
        id: randomUUID(),
        userId: input.userId,
        caseDefinitionId: definition.id,
        caseRevision: definition.currentPublishedRevision,
        status: "in_progress",
      })
      .returning();

    const manifest = await loadAnyCaseManifest(input.caseSlug, {
      expectedRevision: definition.currentPublishedRevision,
    });

    if (isStagedManifest(manifest)) {
      const objectiveRows = manifest.stages.flatMap((stage) =>
        stage.objectives.map((objective) => ({
          id: randomUUID(),
          playerCaseId: createdPlayerCase.id,
          stageId: stage.id,
          objectiveId: objective.id,
          status: stage.startsUnlocked ? "active" : "locked",
        })),
      );

      if (objectiveRows.length > 0) {
        await tx.insert(playerCaseObjectives).values(objectiveRows);
      }
    }

    const analyticsEvent = await writeAnalyticsEvent(tx, {
      name: "Case started",
      playerId: input.userId,
      sessionId: randomUUID(),
      caseDefinitionId: definition.id,
      caseRevision: definition.currentPublishedRevision,
    });
    const resumeTarget = await buildResumeTarget(
      tx,
      createdPlayerCase,
      input.caseSlug,
    );

    return {
      playerCase: createdPlayerCase,
      resumeTarget,
      analyticsEvent,
    };
  });
}
