import { randomUUID } from "node:crypto";

import { caseDefinitions, playerCases, reportDrafts, users } from "@/db/schema";
import { saveReportDraft } from "@/features/drafts/save-report-draft";
import { closeDb, getDb } from "@/lib/db";

afterEach(async () => {
  await closeDb();
});

async function createPlayerCase() {
  const db = await getDb();
  const userId = randomUUID();
  const caseDefinitionId = randomUUID();
  const playerCaseId = randomUUID();

  await db.insert(users).values({
    id: userId,
    email: "agent@example.com",
    passwordHash: "hashed-password",
    alias: "Agent Ash",
  });
  await db.insert(caseDefinitions).values({
    id: caseDefinitionId,
    slug: "hollow-bishop",
    title: "The Hollow Bishop",
    currentPublishedRevision: "rev-1",
  });
  await db.insert(playerCases).values({
    id: playerCaseId,
    userId,
    caseDefinitionId,
    caseRevision: "rev-1",
    status: "in_progress",
  });

  return {
    playerCaseId,
  };
}

test("saves draft answers without grading them", async () => {
  const { playerCaseId } = await createPlayerCase();
  const draft = await saveReportDraft({
    playerCaseId,
    suspectId: "s1",
    motiveId: "m2",
    methodId: "w1",
  });

  expect(draft.attemptCount).toBe(0);
});

test("updates the existing draft for the same player case", async () => {
  const db = await getDb();
  const { playerCaseId } = await createPlayerCase();

  await saveReportDraft({
    playerCaseId,
    suspectId: "s1",
    motiveId: "m2",
    methodId: "w1",
  });
  const revisedDraft = await saveReportDraft({
    playerCaseId,
    suspectId: "s3",
    motiveId: "m1",
    methodId: "w2",
  });

  const drafts = await db.select().from(reportDrafts);

  expect(drafts).toHaveLength(1);
  expect(revisedDraft.suspectId).toBe("s3");
  expect(revisedDraft.attemptCount).toBe(0);
});
