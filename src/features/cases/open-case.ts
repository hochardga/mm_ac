import "server-only";

import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";

import { analyticsEvents, playerCases } from "@/db/schema";
import { ensureCaseDefinition } from "@/features/cases/sync-case-definitions";
import { writeAnalyticsEvent } from "@/lib/analytics";
import { getDb } from "@/lib/db";

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

      return {
        playerCase: existingPlayerCase,
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

    return {
      playerCase: createdPlayerCase,
      analyticsEvent,
    };
  });
}
