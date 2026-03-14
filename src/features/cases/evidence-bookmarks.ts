import "server-only";

import { randomUUID } from "node:crypto";

import { and, asc, eq } from "drizzle-orm";

import { playerCaseEvidenceBookmarks } from "@/db/schema";
import { getDb } from "@/lib/db";

export type ListEvidenceBookmarksInput = {
  playerCaseId: string;
};

export async function listEvidenceBookmarks(
  input: ListEvidenceBookmarksInput,
) {
  const db = await getDb();

  return db.query.playerCaseEvidenceBookmarks.findMany({
    where: eq(playerCaseEvidenceBookmarks.playerCaseId, input.playerCaseId),
    orderBy: [asc(playerCaseEvidenceBookmarks.createdAt)],
  });
}

export type ToggleEvidenceBookmarkInput = {
  playerCaseId: string;
  evidenceId: string;
};

export async function toggleEvidenceBookmark(
  input: ToggleEvidenceBookmarkInput,
) {
  const db = await getDb();
  const existingBookmark = await db.query.playerCaseEvidenceBookmarks.findFirst({
    where: and(
      eq(playerCaseEvidenceBookmarks.playerCaseId, input.playerCaseId),
      eq(playerCaseEvidenceBookmarks.evidenceId, input.evidenceId),
    ),
  });

  if (existingBookmark) {
    await db
      .delete(playerCaseEvidenceBookmarks)
      .where(eq(playerCaseEvidenceBookmarks.id, existingBookmark.id));

    return {
      bookmarked: false,
      bookmarks: await listEvidenceBookmarks({
        playerCaseId: input.playerCaseId,
      }),
    };
  }

  await db.insert(playerCaseEvidenceBookmarks).values({
    id: randomUUID(),
    playerCaseId: input.playerCaseId,
    evidenceId: input.evidenceId,
  });

  return {
    bookmarked: true,
    bookmarks: await listEvidenceBookmarks({
      playerCaseId: input.playerCaseId,
    }),
  };
}
