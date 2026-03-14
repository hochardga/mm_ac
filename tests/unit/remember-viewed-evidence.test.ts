import { randomUUID } from "node:crypto";

import { caseDefinitions, playerCases, users } from "@/db/schema";
import { rememberViewedEvidence } from "@/features/cases/remember-viewed-evidence";
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
    slug: "red-harbor",
    title: "Signal at Red Harbor",
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

test("stores remembered evidence on the player case", async () => {
  const db = await getDb();
  const { playerCaseId } = await createPlayerCase();

  const remembered = await rememberViewedEvidence({
    playerCaseId,
    evidenceId: "dispatch-log",
  });

  const savedPlayerCase = await db.query.playerCases.findFirst({
    where: (playerCase, { eq }) => eq(playerCase.id, playerCaseId),
  });

  expect(remembered.lastViewedEvidenceId).toBe("dispatch-log");
  expect(remembered.lastViewedEvidenceAt).toBeInstanceOf(Date);
  expect(savedPlayerCase?.lastViewedEvidenceId).toBe("dispatch-log");
  expect(savedPlayerCase?.lastViewedEvidenceAt).toBeInstanceOf(Date);
});

test("throws when the player case does not exist", async () => {
  await expect(
    rememberViewedEvidence({
      playerCaseId: randomUUID(),
      evidenceId: "dispatch-log",
    }),
  ).rejects.toThrow("Player case not found");
});
