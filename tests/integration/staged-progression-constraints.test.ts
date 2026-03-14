import { randomUUID } from "node:crypto";

import { expect, test } from "vitest";

import {
  caseDefinitions,
  objectiveSubmissions,
  playerCaseObjectives,
  playerCases,
  users,
} from "@/db/schema";
import { closeDb, getDb } from "@/lib/db";

afterEach(async () => {
  await closeDb();
});

async function seedPlayerCase() {
  const db = await getDb();
  const userId = randomUUID();
  const caseDefinitionId = randomUUID();
  const playerCaseId = randomUUID();

  await db.insert(users).values({
    id: userId,
    email: `${userId}@example.com`,
    passwordHash: "hashed-password",
    alias: "Agent Constraint",
  });
  await db.insert(caseDefinitions).values({
    id: caseDefinitionId,
    slug: "constraint-case",
    title: "Constraint Case",
    currentPublishedRevision: "rev-1",
  });
  await db.insert(playerCases).values({
    id: playerCaseId,
    userId,
    caseDefinitionId,
    caseRevision: "rev-1",
    status: "in_progress",
  });

  return { db, playerCaseId };
}

test("rejects duplicate objective state rows for the same player case objective", async () => {
  const { db, playerCaseId } = await seedPlayerCase();

  await db.insert(playerCaseObjectives).values({
    id: randomUUID(),
    playerCaseId,
    stageId: "briefing",
    objectiveId: "pick-suspect",
    status: "active",
  });

  await expect(
    db.insert(playerCaseObjectives).values({
      id: randomUUID(),
      playerCaseId,
      stageId: "briefing",
      objectiveId: "pick-suspect",
      status: "locked",
    }),
  ).rejects.toThrow();
});

test("rejects duplicate attempt numbers for the same objective", async () => {
  const { db, playerCaseId } = await seedPlayerCase();

  await db.insert(objectiveSubmissions).values({
    id: randomUUID(),
    playerCaseId,
    objectiveId: "pick-suspect",
    submissionToken: `token-${randomUUID()}`,
    answerPayload: {
      type: "single_choice",
      choiceId: "bookkeeper",
    },
    isCorrect: false,
    feedback: "Incorrect",
    nextStatus: "in_progress",
    attemptNumber: 1,
  });

  await expect(
    db.insert(objectiveSubmissions).values({
      id: randomUUID(),
      playerCaseId,
      objectiveId: "pick-suspect",
      submissionToken: `token-${randomUUID()}`,
      answerPayload: {
        type: "single_choice",
        choiceId: "groundskeeper",
      },
      isCorrect: false,
      feedback: "Incorrect again",
      nextStatus: "in_progress",
      attemptNumber: 1,
    }),
  ).rejects.toThrow();
});
