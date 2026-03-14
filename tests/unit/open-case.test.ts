import { randomUUID } from "node:crypto";

import { openCase } from "@/features/cases/open-case";
import {
  analyticsEvents,
  caseDefinitions,
  playerCaseObjectives,
  playerCases,
  users,
} from "@/db/schema";
import * as caseManifestLoader from "@/features/cases/load-case-manifest";
import type { LoadedStagedCaseManifest } from "@/features/cases/load-case-manifest";
import { closeDb, getDb } from "@/lib/db";

afterEach(async () => {
  vi.restoreAllMocks();
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
    currentPublishedRevision: "rev-1",
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
  const objectiveRows = await db.select().from(playerCaseObjectives);
  const trackedEvents = await db.select().from(analyticsEvents);

  expect(first.playerCase.status).toBe("in_progress");
  expect(first.playerCase.caseRevision).toBe("rev-1");
  expect(first.analyticsEvent.name).toBe("Case started");
  expect(second.playerCase.id).toBe(first.playerCase.id);
  expect(second.analyticsEvent.id).toBe(first.analyticsEvent.id);
  expect(openedCases).toHaveLength(1);
  expect(objectiveRows.map((row) => `${row.objectiveId}:${row.status}`)).toEqual([
    "chalice-relevance:active",
    "identify-poisoner:locked",
  ]);
  expect(trackedEvents).toHaveLength(1);
});

test("creates the case definition from authored content when the database is empty", async () => {
  const db = await getDb();
  const userId = randomUUID();

  await db.insert(users).values({
    id: userId,
    email: "agent@example.com",
    passwordHash: "hashed-password",
    alias: "Agent Ash",
  });

  const result = await openCase({
    userId,
    caseSlug: "hollow-bishop",
  });
  const definitions = await db.select().from(caseDefinitions);

  expect(result.playerCase.caseRevision).toBe("rev-1");
  expect(definitions.some((definition) => definition.slug === "hollow-bishop")).toBe(
    true,
  );
});

test("seeds staged objective rows on first open with active and locked statuses", async () => {
  const db = await getDb();
  const userId = randomUUID();
  const caseDefinitionId = randomUUID();

  await db.insert(users).values({
    id: userId,
    email: "staged-agent@example.com",
    passwordHash: "hashed-password",
    alias: "Agent Stage",
  });

  await db.insert(caseDefinitions).values({
    id: caseDefinitionId,
    slug: "hollow-bishop",
    title: "The Hollow Bishop",
    currentPublishedRevision: "rev-1",
  });

  const stagedManifest: LoadedStagedCaseManifest = {
    slug: "hollow-bishop",
    revision: "rev-1",
    title: "The Hollow Bishop",
    summary: "A staged rewrite.",
    complexity: "standard",
    evidence: [
      {
        id: "ledger",
        title: "Ledger Extract",
        family: "document",
        subtype: "financial_ledger",
        summary: "A damaged ledger.",
        source: "evidence/ledger.md",
        body: "Ledger body",
        meta: {},
      },
    ],
    stages: [
      {
        id: "briefing",
        startsUnlocked: true,
        title: "Briefing",
        summary: "Start here.",
        handlerPrompts: ["Start with the ledger."],
        evidenceIds: ["ledger"],
        objectives: [
          {
            id: "pick-suspect",
            prompt: "Who doctored the books?",
            type: "single_choice",
            stakes: "graded",
            options: [{ id: "bookkeeper", label: "Bookkeeper Mara Quinn" }],
            successUnlocks: { stageIds: ["confrontation"], resolvesCase: false },
          },
        ],
      },
      {
        id: "confrontation",
        startsUnlocked: false,
        title: "Confrontation",
        summary: "Finish the case.",
        handlerPrompts: ["Enter the final code."],
        evidenceIds: ["ledger"],
        objectives: [
          {
            id: "enter-code",
            prompt: "Enter the lock code.",
            type: "code_entry",
            stakes: "graded",
            successUnlocks: { stageIds: [], resolvesCase: true },
          },
        ],
      },
    ],
  };

  const loadAnyCaseManifestSpy = vi
    .spyOn(caseManifestLoader, "loadAnyCaseManifest")
    .mockResolvedValue(stagedManifest);

  const first = await openCase({
    userId,
    caseSlug: "hollow-bishop",
  });
  await openCase({
    userId,
    caseSlug: "hollow-bishop",
  });

  const objectiveRows = await db.select().from(playerCaseObjectives);
  const seededRows = objectiveRows
    .filter((row) => row.playerCaseId === first.playerCase.id)
    .sort((left, right) => left.objectiveId.localeCompare(right.objectiveId));

  expect(loadAnyCaseManifestSpy).toHaveBeenCalledWith("hollow-bishop", {
    expectedRevision: "rev-1",
  });
  expect(seededRows).toHaveLength(2);
  expect(seededRows.map((row) => `${row.objectiveId}:${row.status}`)).toEqual([
    "enter-code:locked",
    "pick-suspect:active",
  ]);
});
