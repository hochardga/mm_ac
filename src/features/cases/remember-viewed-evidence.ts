import "server-only";

import { eq, sql } from "drizzle-orm";

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
      viewedEvidenceIds: sql<string[]>`
        coalesce(
          (
            select jsonb_agg(deduped.evidence_id order by deduped.first_seen)
            from (
              select seen.evidence_id, min(seen.ordinality) as first_seen
              from jsonb_array_elements_text(
                coalesce(${playerCases.viewedEvidenceIds}, '[]'::jsonb) || jsonb_build_array(${input.evidenceId}::text)
              ) with ordinality as seen(evidence_id, ordinality)
              group by seen.evidence_id
            ) as deduped
          ),
          '[]'::jsonb
        )
      `,
    })
    .where(eq(playerCases.id, input.playerCaseId))
    .returning();

  if (!updatedPlayerCase) {
    throw new Error("Player case not found");
  }

  return updatedPlayerCase;
}
