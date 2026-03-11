import { randomUUID } from "node:crypto";

import { openCase } from "@/features/cases/open-case";
import { analyticsEvents, caseDefinitions, playerCases, users } from "@/db/schema";
import { closeDb, getDb } from "@/lib/db";

afterEach(async () => {
  await closeDb();
});

test("pins the latest revision on first open and emits case_started once", async () => {
  const db = await getDb();
  const userId = randomUUID();
  const caseDefinitionId = randomUUID();

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
    currentPublishedRevision: "rev-3",
  });

  const first = await openCase({
    userId,
    caseSlug: "hollow-bishop",
  });
  const second = await openCase({
    userId,
    caseSlug: "hollow-bishop",
  });

  const openedCases = await db.select().from(playerCases);
  const trackedEvents = await db.select().from(analyticsEvents);

  expect(first.playerCase.status).toBe("in_progress");
  expect(first.playerCase.caseRevision).toBe("rev-3");
  expect(first.analyticsEvent.name).toBe("Case started");
  expect(second.playerCase.id).toBe(first.playerCase.id);
  expect(second.analyticsEvent.id).toBe(first.analyticsEvent.id);
  expect(openedCases).toHaveLength(1);
  expect(trackedEvents).toHaveLength(1);
});
