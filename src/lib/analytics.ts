import { randomUUID } from "node:crypto";

import { analyticsEvents } from "@/db/schema";
import { getDb } from "@/lib/db";

type DbClient = Awaited<ReturnType<typeof getDb>>;
type TransactionClient = Parameters<DbClient["transaction"]>[0] extends (
  tx: infer T,
  ...args: never[]
) => Promise<unknown>
  ? T
  : never;

type AnalyticsWriter = DbClient | TransactionClient;

export type AnalyticsEventInput = {
  name: string;
  playerId: string;
  sessionId: string;
  caseDefinitionId?: string;
  caseRevision?: string;
};

export async function writeAnalyticsEvent(
  db: AnalyticsWriter,
  input: AnalyticsEventInput,
) {
  const [record] = await db
    .insert(analyticsEvents)
    .values({
      id: randomUUID(),
      name: input.name,
      playerId: input.playerId,
      sessionId: input.sessionId,
      caseDefinitionId: input.caseDefinitionId,
      caseRevision: input.caseRevision,
    })
    .returning();

  return record;
}
