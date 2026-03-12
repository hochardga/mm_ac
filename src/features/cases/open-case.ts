import "server-only";

import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";

import { analyticsEvents, notes, playerCases, reportDrafts } from "@/db/schema";
import { ensureCaseDefinition } from "@/features/cases/sync-case-definitions";
import { writeAnalyticsEvent } from "@/lib/analytics";
import { getDb, type AppTransaction } from "@/lib/db";

async function buildResumeTarget(
  tx: AppTransaction,
  playerCase: typeof playerCases.$inferSelect,
  caseSlug: string,
) {
  const [savedNote, savedDraft] = await Promise.all([
    tx.query.notes.findFirst({
      where: eq(notes.playerCaseId, playerCase.id),
    }),
    tx.query.reportDrafts.findFirst({
      where: eq(reportDrafts.playerCaseId, playerCase.id),
    }),
  ]);

  return {
    caseSlug,
    section: savedDraft ? "report" : savedNote ? "notes" : "evidence",
    noteBody: savedNote?.body ?? "",
    draft: savedDraft
      ? {
          suspectId: savedDraft.suspectId,
          motiveId: savedDraft.motiveId,
          methodId: savedDraft.methodId,
        }
      : null,
    lastActivityAt:
      savedDraft?.updatedAt ?? savedNote?.updatedAt ?? playerCase.updatedAt,
  };
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
