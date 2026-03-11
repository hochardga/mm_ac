import "server-only";

import { randomUUID } from "node:crypto";

import { reportDrafts } from "@/db/schema";
import { getDb } from "@/lib/db";

export type SaveReportDraftInput = {
  playerCaseId: string;
  suspectId: string;
  motiveId: string;
  methodId: string;
};

export async function saveReportDraft(input: SaveReportDraftInput) {
  const db = await getDb();
  const [draft] = await db
    .insert(reportDrafts)
    .values({
      id: randomUUID(),
      playerCaseId: input.playerCaseId,
      suspectId: input.suspectId,
      motiveId: input.motiveId,
      methodId: input.methodId,
      attemptCount: 0,
    })
    .onConflictDoUpdate({
      target: reportDrafts.playerCaseId,
      set: {
        suspectId: input.suspectId,
        motiveId: input.motiveId,
        methodId: input.methodId,
        updatedAt: new Date(),
      },
    })
    .returning();

  return draft;
}
