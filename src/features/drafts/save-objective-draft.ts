import "server-only";

import { and, eq } from "drizzle-orm";

import { playerCaseObjectives } from "@/db/schema";
import type { ObjectiveAnswerPayload } from "@/features/cases/objective-payload";
import { getDb } from "@/lib/db";

export type SaveObjectiveDraftInput = {
  playerCaseId: string;
  objectiveId: string;
  payload: ObjectiveAnswerPayload;
};

export async function saveObjectiveDraft(input: SaveObjectiveDraftInput) {
  const db = await getDb();
  const objective = await db.query.playerCaseObjectives.findFirst({
    where: and(
      eq(playerCaseObjectives.playerCaseId, input.playerCaseId),
      eq(playerCaseObjectives.objectiveId, input.objectiveId),
    ),
  });

  if (!objective) {
    throw new Error("Objective row was not found");
  }

  if (objective.status !== "active") {
    throw new Error("Only active objectives can be drafted");
  }

  const [updated] = await db
    .update(playerCaseObjectives)
    .set({
      draftPayload: input.payload,
      updatedAt: new Date(),
    })
    .where(eq(playerCaseObjectives.id, objective.id))
    .returning();

  if (!updated) {
    throw new Error("Objective draft update failed");
  }

  return updated;
}
