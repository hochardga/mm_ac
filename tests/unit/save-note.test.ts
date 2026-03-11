import { randomUUID } from "node:crypto";

import { notes, caseDefinitions, playerCases, users } from "@/db/schema";
import { saveNote } from "@/features/notes/save-note";
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

test("saves note text for a player case", async () => {
  const { playerCaseId } = await createPlayerCase();
  const note = await saveNote({
    playerCaseId,
    body: "Check the receipts.",
  });

  expect(note.body).toContain("receipts");
});

test("updates the existing note instead of duplicating it", async () => {
  const db = await getDb();
  const { playerCaseId } = await createPlayerCase();

  await saveNote({
    playerCaseId,
    body: "Check the church receipts.",
  });
  await saveNote({
    playerCaseId,
    body: "Cross-reference the church receipts with the ledger.",
  });

  const savedNotes = await db.select().from(notes);

  expect(savedNotes).toHaveLength(1);
  expect(savedNotes[0]?.body).toContain("Cross-reference");
});
