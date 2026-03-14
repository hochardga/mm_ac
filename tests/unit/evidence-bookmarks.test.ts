import { randomUUID } from "node:crypto";

import * as schema from "@/db/schema";
import {
  caseDefinitions,
  playerCaseEvidenceBookmarks,
  playerCases,
  users,
} from "@/db/schema";
import {
  listEvidenceBookmarks,
  toggleEvidenceBookmark,
} from "@/features/cases/evidence-bookmarks";
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
    email: "bookmark-agent@example.com",
    passwordHash: "hashed-password",
    alias: "Agent Bookmark",
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

  return { playerCaseId };
}

test("exports a player-case evidence bookmarks table", () => {
  expect("playerCaseEvidenceBookmarks" in schema).toBe(true);
});

test("adds a bookmark row the first time evidence is pinned", async () => {
  const db = await getDb();
  const { playerCaseId } = await createPlayerCase();

  const result = await toggleEvidenceBookmark({
    playerCaseId,
    evidenceId: "vestry-interview",
  });
  const storedBookmarks = await db.select().from(playerCaseEvidenceBookmarks);

  expect(result.bookmarked).toBe(true);
  expect(result.bookmarks.map((bookmark) => bookmark.evidenceId)).toEqual([
    "vestry-interview",
  ]);
  expect(storedBookmarks.map((bookmark) => bookmark.evidenceId)).toEqual([
    "vestry-interview",
  ]);
});

test("removes the bookmark row when the same evidence is toggled again", async () => {
  const db = await getDb();
  const { playerCaseId } = await createPlayerCase();

  await toggleEvidenceBookmark({
    playerCaseId,
    evidenceId: "vestry-interview",
  });

  const result = await toggleEvidenceBookmark({
    playerCaseId,
    evidenceId: "vestry-interview",
  });
  const storedBookmarks = await db.select().from(playerCaseEvidenceBookmarks);

  expect(result.bookmarked).toBe(false);
  expect(result.bookmarks).toHaveLength(0);
  expect(storedBookmarks).toHaveLength(0);
});

test("lists bookmarks in created order for a player case", async () => {
  const { playerCaseId } = await createPlayerCase();

  await toggleEvidenceBookmark({
    playerCaseId,
    evidenceId: "vestry-interview",
  });
  await toggleEvidenceBookmark({
    playerCaseId,
    evidenceId: "dispatch-log",
  });

  const result = await listEvidenceBookmarks({ playerCaseId });

  expect(result.map((bookmark) => bookmark.evidenceId)).toEqual([
    "vestry-interview",
    "dispatch-log",
  ]);
});
