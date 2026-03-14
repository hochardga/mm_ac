import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import {
  caseDefinitions,
  objectiveSubmissions,
  playerCaseObjectives,
  playerCases,
  users,
} from "@/db/schema";
import { buildCaseProgression } from "@/features/cases/case-progression";
import * as caseManifestLoader from "@/features/cases/load-case-manifest";
import * as protectedCaseLoader from "@/features/cases/load-protected-case";
import type { StagedProtectedCase } from "@/features/cases/case-schema";
import type { LoadedStagedCaseManifest } from "@/features/cases/load-case-manifest";
import { submitObjective } from "@/features/submissions/submit-objective";
import { closeDb, getDb } from "@/lib/db";

afterEach(async () => {
  vi.restoreAllMocks();
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
    alias: "Agent Seed",
  });

  await db.insert(caseDefinitions).values({
    id: caseDefinitionId,
    slug: "staged-valid",
    title: "Fixture Case",
    currentPublishedRevision: "rev-2",
  });

  await db.insert(playerCases).values({
    id: playerCaseId,
    userId,
    caseDefinitionId,
    caseRevision: "rev-2",
    status: "in_progress",
    gradedFailureCount: 0,
  });

  return { playerCaseId };
}

test("submitting staged objectives unlocks follow-up work and can complete the case", async () => {
  const db = await getDb();
  const { playerCaseId } = await seedPlayerCase();

  const manifest: LoadedStagedCaseManifest = {
    slug: "staged-valid",
    revision: "rev-2",
    title: "Fixture Case",
    summary: "Fixture summary",
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
      {
        id: "letter",
        title: "Letter",
        family: "document",
        subtype: "legal_doc",
        summary: "A handwritten confession.",
        source: "evidence/letter.md",
        body: "Letter body",
        meta: {},
      },
    ],
    stages: [
      {
        id: "briefing",
        startsUnlocked: true,
        title: "Briefing",
        summary: "Start here.",
        handlerPrompts: ["Check the ledger."],
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
        summary: "Final stage.",
        handlerPrompts: ["Use the confession letter."],
        evidenceIds: ["letter"],
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

  const protectedCase: StagedProtectedCase = {
    slug: "staged-valid",
    revision: "rev-2",
    grading: { maxGradedFailures: 3 },
    canonicalAnswers: {
      "pick-suspect": { type: "single_choice", choiceId: "bookkeeper" },
      "enter-code": { type: "code_entry", value: "VESPER-17" },
    },
    debriefs: {
      solved: { title: "Debrief", summary: "Solved summary" },
      closed_unsolved: { title: "Closed", summary: "Closed summary" },
    },
  };

  vi.spyOn(caseManifestLoader, "loadStagedCaseManifest").mockResolvedValue(
    manifest,
  );
  vi.spyOn(protectedCaseLoader, "loadStagedProtectedCase").mockResolvedValue(
    protectedCase,
  );

  await db.insert(playerCaseObjectives).values([
    {
      id: randomUUID(),
      playerCaseId,
      stageId: "briefing",
      objectiveId: "pick-suspect",
      status: "active",
    },
    {
      id: randomUUID(),
      playerCaseId,
      stageId: "confrontation",
      objectiveId: "enter-code",
      status: "locked",
    },
  ]);

  const first = await submitObjective({
    playerCaseId,
    objectiveId: "pick-suspect",
    submissionToken: `token-${randomUUID()}`,
    payload: {
      type: "single_choice",
      choiceId: "bookkeeper",
    },
  });

  expect(first.nextStatus).toBe("in_progress");
  expect(first.attemptNumber).toBe(1);

  const rowsAfterFirst = (
    await db
      .select()
      .from(playerCaseObjectives)
      .where(eq(playerCaseObjectives.playerCaseId, playerCaseId))
  ).sort((left, right) => left.objectiveId.localeCompare(right.objectiveId));
  expect(rowsAfterFirst.map((row) => `${row.objectiveId}:${row.status}`)).toEqual(
    ["enter-code:active", "pick-suspect:solved"],
  );

  const progression = buildCaseProgression({
    manifest,
    objectiveStates: rowsAfterFirst.map((row) => ({
      objectiveId: row.objectiveId,
      stageId: row.stageId,
      status: row.status,
    })),
  });
  expect(progression.visibleEvidence.map((entry) => entry.id)).toEqual([
    "ledger",
    "letter",
  ]);

  const second = await submitObjective({
    playerCaseId,
    objectiveId: "enter-code",
    submissionToken: `token-${randomUUID()}`,
    payload: {
      type: "code_entry",
      value: "VESPER-17",
    },
  });

  expect(second.nextStatus).toBe("completed");
  expect(second.attemptNumber).toBe(1);

  const [savedCase] = await db
    .select()
    .from(playerCases)
    .where(eq(playerCases.id, playerCaseId));
  expect(savedCase?.status).toBe("completed");
  expect(savedCase?.terminalDebriefTitle).toBe("Debrief");
});

test("repeated graded misses exhaust the failure budget and close the case unsolved", async () => {
  const db = await getDb();
  const { playerCaseId } = await seedPlayerCase();

  const manifest: LoadedStagedCaseManifest = {
    slug: "staged-valid",
    revision: "rev-2",
    title: "Fixture Case",
    summary: "Fixture summary",
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
        handlerPrompts: ["Check the ledger."],
        evidenceIds: ["ledger"],
        objectives: [
          {
            id: "pick-suspect",
            prompt: "Who doctored the books?",
            type: "single_choice",
            stakes: "graded",
            options: [{ id: "bookkeeper", label: "Bookkeeper Mara Quinn" }],
            successUnlocks: { stageIds: [], resolvesCase: false },
          },
        ],
      },
    ],
  };

  const protectedCase: StagedProtectedCase = {
    slug: "staged-valid",
    revision: "rev-2",
    grading: { maxGradedFailures: 2 },
    canonicalAnswers: {
      "pick-suspect": { type: "single_choice", choiceId: "bookkeeper" },
    },
    debriefs: {
      solved: { title: "Debrief", summary: "Solved summary" },
      closed_unsolved: { title: "Closed", summary: "Closed summary" },
    },
  };

  vi.spyOn(caseManifestLoader, "loadStagedCaseManifest").mockResolvedValue(
    manifest,
  );
  vi.spyOn(protectedCaseLoader, "loadStagedProtectedCase").mockResolvedValue(
    protectedCase,
  );

  await db.insert(playerCaseObjectives).values({
    id: randomUUID(),
    playerCaseId,
    stageId: "briefing",
    objectiveId: "pick-suspect",
    status: "active",
  });

  const first = await submitObjective({
    playerCaseId,
    objectiveId: "pick-suspect",
    submissionToken: `token-${randomUUID()}`,
    payload: {
      type: "single_choice",
      choiceId: "wrong-choice",
    },
  });
  const second = await submitObjective({
    playerCaseId,
    objectiveId: "pick-suspect",
    submissionToken: `token-${randomUUID()}`,
    payload: {
      type: "single_choice",
      choiceId: "wrong-choice",
    },
  });

  expect(first.nextStatus).toBe("in_progress");
  expect(second.nextStatus).toBe("closed_unsolved");

  const [savedCase] = await db
    .select()
    .from(playerCases)
    .where(eq(playerCases.id, playerCaseId));
  const savedSubmissions = await db
    .select()
    .from(objectiveSubmissions)
    .where(eq(objectiveSubmissions.playerCaseId, playerCaseId));

  expect(savedCase?.gradedFailureCount).toBe(2);
  expect(savedCase?.status).toBe("closed_unsolved");
  expect(savedCase?.terminalDebriefTitle).toBe("Closed");
  expect(savedSubmissions).toHaveLength(2);
});
