import "server-only";

import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import { notes } from "@/db/schema";
import { getDb } from "@/lib/db";

export type SaveNoteInput = {
  playerCaseId: string;
  body: string;
};

export async function saveNote(input: SaveNoteInput) {
  const db = await getDb();
  const existingNote = await db.query.notes.findFirst({
    where: eq(notes.playerCaseId, input.playerCaseId),
  });

  if (existingNote) {
    const [updatedNote] = await db
      .update(notes)
      .set({
        body: input.body,
        updatedAt: new Date(),
      })
      .where(eq(notes.id, existingNote.id))
      .returning();

    return updatedNote;
  }

  const [createdNote] = await db
    .insert(notes)
    .values({
      id: randomUUID(),
      playerCaseId: input.playerCaseId,
      body: input.body,
    })
    .returning();

  return createdNote;
}
