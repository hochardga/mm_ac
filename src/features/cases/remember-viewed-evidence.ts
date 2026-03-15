import "server-only";

import { eq } from "drizzle-orm";

import { playerCases } from "@/db/schema";
import { getDb } from "@/lib/db";

export type RememberViewedEvidenceInput = {
  playerCaseId: string;
  evidenceId: string;
};

export async function rememberViewedEvidence(
  input: RememberViewedEvidenceInput,
) {
  const db = await getDb();
  const playerCase = await db.query.playerCases.findFirst({
    where: eq(playerCases.id, input.playerCaseId),
  });

  if (!playerCase) {
    throw new Error("Player case not found");
  }

  const viewedEvidenceIds = Array.from(
    new Set([...(playerCase.viewedEvidenceIds ?? []), input.evidenceId]),
  );
  const [updatedPlayerCase] = await db
    .update(playerCases)
    .set({
      lastViewedEvidenceId: input.evidenceId,
      lastViewedEvidenceAt: new Date(),
      viewedEvidenceIds,
    })
    .where(eq(playerCases.id, input.playerCaseId))
    .returning();

  if (!updatedPlayerCase) {
    throw new Error("Player case not found");
  }

  return updatedPlayerCase;
}
