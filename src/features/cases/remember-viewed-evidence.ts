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
  const [updatedPlayerCase] = await db
    .update(playerCases)
    .set({
      lastViewedEvidenceId: input.evidenceId,
      lastViewedEvidenceAt: new Date(),
    })
    .where(eq(playerCases.id, input.playerCaseId))
    .returning();

  if (!updatedPlayerCase) {
    throw new Error("Player case not found");
  }

  return updatedPlayerCase;
}
