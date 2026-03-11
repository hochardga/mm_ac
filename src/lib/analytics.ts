import { randomUUID } from "node:crypto";

import { z } from "zod";

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

const analyticsEventSchema = z
  .object({
    name: z.string(),
    playerId: z.string().min(1),
    sessionId: z.string().min(1),
    caseDefinitionId: z.string().optional(),
    caseRevision: z.string().optional(),
    submissionToken: z.string().optional(),
  })
  .superRefine((event, context) => {
    if (
      event.name === "Graded report submitted" &&
      !event.submissionToken
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Submission token is required for graded report events",
      });
    }
  });

export type AnalyticsEventInput = {
  name: string;
  playerId: string;
  sessionId: string;
  caseDefinitionId?: string;
  caseRevision?: string;
  submissionToken?: string;
};

export function buildAnalyticsEvent(
  name: string,
  input: Omit<AnalyticsEventInput, "name">,
) {
  return analyticsEventSchema.parse({
    name,
    ...input,
  });
}

export async function writeAnalyticsEvent(
  db: AnalyticsWriter,
  input: AnalyticsEventInput,
) {
  const event = buildAnalyticsEvent(input.name, {
    playerId: input.playerId,
    sessionId: input.sessionId,
    caseDefinitionId: input.caseDefinitionId,
    caseRevision: input.caseRevision,
    submissionToken: input.submissionToken,
  });
  const [record] = await db
    .insert(analyticsEvents)
    .values({
      id: randomUUID(),
      name: event.name,
      playerId: event.playerId,
      sessionId: event.sessionId,
      caseDefinitionId: event.caseDefinitionId,
      caseRevision: event.caseRevision,
      submissionToken: event.submissionToken,
    })
    .returning();

  return record;
}
