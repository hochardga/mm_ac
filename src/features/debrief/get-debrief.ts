import "server-only";

import { eq } from "drizzle-orm";

import { playerCases } from "@/db/schema";
import { getDb } from "@/lib/db";

export async function getDebrief(input: { playerCaseId: string }) {
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

  return {
    title: playerCase.terminalDebriefTitle,
    summary: playerCase.terminalDebriefSummary,
  };
}
