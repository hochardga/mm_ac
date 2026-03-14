import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";

import {
  caseDefinitions,
  playerCaseObjectives,
  playerCases,
  users,
} from "@/db/schema";
import { saveObjectiveDraft } from "@/features/drafts/save-objective-draft";
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

test("stores draft payload on an active objective row", async () => {
  const db = await getDb();
  const { playerCaseId } = await createPlayerCase();
  const objectiveRowId = randomUUID();

  await db.insert(playerCaseObjectives).values({
    id: objectiveRowId,
    playerCaseId,
    stageId: "briefing",
    objectiveId: "pick-suspect",
    status: "active",
  });

  const updated = await saveObjectiveDraft({
    playerCaseId,
    objectiveId: "pick-suspect",
    payload: {
      type: "single_choice",
      choiceId: "bookkeeper",
    },
  });

  expect(updated.id).toBe(objectiveRowId);
  expect(updated.draftPayload).toEqual({
    type: "single_choice",
    choiceId: "bookkeeper",
  });

  const [stored] = await db
    .select()
    .from(playerCaseObjectives)
    .where(
      and(
        eq(playerCaseObjectives.playerCaseId, playerCaseId),
        eq(playerCaseObjectives.objectiveId, "pick-suspect"),
      ),
    );

  expect(stored?.draftPayload).toEqual({
    type: "single_choice",
    choiceId: "bookkeeper",
  });
});

test("rejects missing objective rows", async () => {
  const { playerCaseId } = await createPlayerCase();

  await expect(
    saveObjectiveDraft({
      playerCaseId,
      objectiveId: "missing-objective",
      payload: {
        type: "boolean",
        value: true,
      },
    }),
  ).rejects.toThrow(/objective/i);
});

test("rejects objective rows that are not active", async () => {
  const db = await getDb();
  const { playerCaseId } = await createPlayerCase();

  await db.insert(playerCaseObjectives).values({
    id: randomUUID(),
    playerCaseId,
    stageId: "confrontation",
    objectiveId: "enter-code",
    status: "locked",
  });

  await expect(
    saveObjectiveDraft({
      playerCaseId,
      objectiveId: "enter-code",
      payload: {
        type: "code_entry",
        value: "VESPER-17",
      },
    }),
  ).rejects.toThrow(/active/i);
});
