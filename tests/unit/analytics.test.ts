import { randomUUID } from "node:crypto";

import { analyticsEvents, caseDefinitions, users } from "@/db/schema";
import { closeDb, getDb } from "@/lib/db";
import { writeAnalyticsEvent } from "@/lib/analytics";

afterEach(async () => {
  await closeDb();
});

test("persists a case lifecycle event with revision metadata", async () => {
  const db = await getDb();
  const playerId = randomUUID();
  const caseDefinitionId = randomUUID();

  await db.insert(users).values({
    id: playerId,
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

  const event = await writeAnalyticsEvent(db, {
    name: "Case started",
    playerId,
    sessionId: "session-1",
    caseDefinitionId,
    caseRevision: "rev-1",
  });

  const records = await db.select().from(analyticsEvents);

  expect(event.name).toBe("Case started");
  expect(records).toHaveLength(1);
  expect(records[0]?.caseRevision).toBe("rev-1");
});
