import type { objectiveSubmissions } from "@/db/schema";
import type { StagedCaseManifest } from "@/features/cases/case-schema";
import { buildObjectiveReviewState } from "@/features/cases/objective-review-state";

type ObjectiveSubmissionRow = typeof objectiveSubmissions.$inferSelect;
type StagedObjective = StagedCaseManifest["stages"][number]["objectives"][number];

const chaliceObjective: StagedObjective = {
  id: "chalice-relevance",
  prompt: "Was the silver chalice actually the murder weapon?",
  type: "boolean",
  stakes: "advisory",
  successUnlocks: {
    stageIds: ["poison-proof"],
    resolvesCase: false,
  },
};

const poisonerObjective: StagedObjective = {
  id: "identify-poisoner",
  prompt: "Who poisoned the sacramental wine to silence the bishop?",
  type: "single_choice",
  stakes: "graded",
  options: [
    { id: "bishop", label: "Bishop Elias Vale" },
    { id: "groundskeeper", label: "Groundskeeper Bram Yates" },
    { id: "bookkeeper", label: "Bookkeeper Mara Quinn" },
  ],
  successUnlocks: {
    stageIds: [],
    resolvesCase: true,
  },
};

const manifest: StagedCaseManifest = {
  slug: "hollow-bishop",
  revision: "rev-1",
  title: "The Hollow Bishop",
  summary: "A ritual-looking homicide in a locked church office.",
  complexity: "standard",
  evidence: [
    {
      id: "ledger",
      title: "Parish Ledger Extract",
      family: "document",
      subtype: "financial_ledger",
      summary: "A torn ledger page records an off-books transfer approved by Bishop Vale.",
      source: "evidence/parish-ledger.md",
    },
  ],
  stages: [
    {
      id: "ledger-review",
      startsUnlocked: true,
      title: "Ledger Review",
      summary: "Break apart the staged ritual scene before filing an accusation.",
      handlerPrompts: [],
      evidenceIds: ["ledger"],
      objectives: [chaliceObjective],
    },
    {
      id: "poison-proof",
      startsUnlocked: false,
      title: "Poison Proof",
      summary: "Use the scene photo to identify who staged the chalice and poisoned the wine.",
      handlerPrompts: [],
      evidenceIds: ["ledger"],
      objectives: [poisonerObjective],
    },
  ],
};

const submissionRows: ObjectiveSubmissionRow[] = [
  {
    id: "chalice-attempt-1",
    playerCaseId: "player-case-1",
    objectiveId: "chalice-relevance",
    submissionToken: "chalice-token-1",
    answerPayload: {
      type: "boolean",
      value: false,
    },
    isCorrect: true,
    feedback: "Objective solved.",
    nextStatus: "in_progress",
    attemptNumber: 1,
    createdAt: new Date("2026-03-14T09:00:00.000Z"),
  },
  {
    id: "poisoner-attempt-1",
    playerCaseId: "player-case-1",
    objectiveId: "identify-poisoner",
    submissionToken: "poisoner-token-1",
    answerPayload: {
      type: "single_choice",
      choiceId: "groundskeeper",
    },
    isCorrect: false,
    feedback: "Incorrect graded objective submission.",
    nextStatus: "in_progress",
    attemptNumber: 1,
    createdAt: new Date("2026-03-14T10:00:00.000Z"),
  },
];

test("summarizes failure pressure and builds readable attempt history", async () => {
  const result = buildObjectiveReviewState({
    manifest,
    objectiveSubmissions: submissionRows,
    gradedFailureCount: 1,
    maxGradedFailures: 3,
  });

  expect(result?.failureBudget).toEqual({
    spent: 1,
    max: 3,
    remaining: 2,
    summaryLabel: "2 safe graded submissions remain",
  });
  expect(result?.latestGradedFeedback).toEqual({
    attemptNumber: 1,
    feedback: "Incorrect graded objective submission.",
    objectiveId: "identify-poisoner",
  });
  expect(result?.attemptsByObjective.get("chalice-relevance")).toEqual([
    {
      attemptNumber: 1,
      answerLabel: "No",
      feedback: "Objective solved.",
      isGraded: false,
      statusLabel: "Objective Solved",
    },
  ]);
  expect(result?.attemptsByObjective.get("identify-poisoner")).toEqual([
    {
      attemptNumber: 1,
      answerLabel: "Groundskeeper Bram Yates",
      feedback: "Incorrect graded objective submission.",
      isGraded: true,
      statusLabel: "Incorrect",
    },
  ]);
});

test("gracefully handles objectives that have no submission history yet", async () => {
  const result = buildObjectiveReviewState({
    manifest,
    objectiveSubmissions: [],
    gradedFailureCount: 0,
    maxGradedFailures: 3,
  });

  expect(result?.failureBudget).toEqual({
    spent: 0,
    max: 3,
    remaining: 3,
    summaryLabel: "3 safe graded submissions remain",
  });
  expect(result?.latestGradedFeedback).toBeNull();
  expect(result?.attemptsByObjective.get("chalice-relevance")).toBeUndefined();
  expect(result?.attemptsByObjective.get("identify-poisoner")).toBeUndefined();
});
