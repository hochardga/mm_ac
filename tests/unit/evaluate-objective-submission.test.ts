import { evaluateObjectiveSubmission } from "@/features/submissions/evaluate-objective-submission";
import type { LoadedStagedCaseManifest } from "@/features/cases/load-case-manifest";
import type { StagedProtectedCase } from "@/features/cases/case-schema";

function getObjective(
  manifest: LoadedStagedCaseManifest,
  objectiveId: string,
) {
  for (const stage of manifest.stages) {
    for (const objective of stage.objectives) {
      if (objective.id === objectiveId) {
        return objective;
      }
    }
  }

  throw new Error(`Objective ${objectiveId} was not found`);
}

const stagedManifest: LoadedStagedCaseManifest = {
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
      summary: "Review the opening file.",
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
        {
          id: "pick-evidence",
          prompt: "Select all relevant entries.",
          type: "multi_choice",
          stakes: "advisory",
          options: [
            { id: "ledger", label: "Ledger" },
            { id: "receipt", label: "Receipt" },
          ],
          successUnlocks: { stageIds: [], resolvesCase: false },
        },
      ],
    },
  ],
};

const stagedProtected: StagedProtectedCase = {
  slug: "staged-valid",
  revision: "rev-2",
  grading: {
    maxGradedFailures: 3,
  },
  canonicalAnswers: {
    "pick-suspect": { type: "single_choice", choiceId: "bookkeeper" },
    "pick-evidence": { type: "multi_choice", choiceIds: ["ledger", "receipt"] },
  },
  debriefs: {
    solved: { title: "Debrief", summary: "Solved summary" },
    closed_unsolved: { title: "Closed", summary: "Closed summary" },
  },
};

test("returns solved for a correct single-choice graded objective", () => {
  const result = evaluateObjectiveSubmission({
    objective: getObjective(stagedManifest, "pick-suspect"),
    canonicalAnswer: stagedProtected.canonicalAnswers["pick-suspect"],
    payload: {
      type: "single_choice",
      choiceId: "bookkeeper",
    },
    gradedFailureCount: 0,
    maxGradedFailures: stagedProtected.grading.maxGradedFailures,
  });

  expect(result.isCorrect).toBe(true);
  expect(result.objectiveStatus).toBe("solved");
  expect(result.caseStatus).toBe("in_progress");
  expect(result.unlockedStageIds).toEqual(["confrontation"]);
});

test("keeps an incorrect advisory objective in progress", () => {
  const result = evaluateObjectiveSubmission({
    objective: getObjective(stagedManifest, "pick-evidence"),
    canonicalAnswer: stagedProtected.canonicalAnswers["pick-evidence"],
    payload: {
      type: "multi_choice",
      choiceIds: ["ledger"],
    },
    gradedFailureCount: 0,
    maxGradedFailures: stagedProtected.grading.maxGradedFailures,
  });

  expect(result.isCorrect).toBe(false);
  expect(result.objectiveStatus).toBe("active");
  expect(result.caseStatus).toBe("in_progress");
  expect(result.unlockedStageIds).toEqual([]);
});

test("marks incorrect graded objectives as failed before budget is exhausted", () => {
  const result = evaluateObjectiveSubmission({
    objective: getObjective(stagedManifest, "pick-suspect"),
    canonicalAnswer: stagedProtected.canonicalAnswers["pick-suspect"],
    payload: {
      type: "single_choice",
      choiceId: "someone-else",
    },
    gradedFailureCount: 1,
    maxGradedFailures: stagedProtected.grading.maxGradedFailures,
  });

  expect(result.isCorrect).toBe(false);
  expect(result.objectiveStatus).toBe("failed");
  expect(result.caseStatus).toBe("in_progress");
});

test("closes the case unsolved on the final graded miss", () => {
  const result = evaluateObjectiveSubmission({
    objective: getObjective(stagedManifest, "pick-suspect"),
    canonicalAnswer: stagedProtected.canonicalAnswers["pick-suspect"],
    payload: {
      type: "single_choice",
      choiceId: "someone-else",
    },
    gradedFailureCount: 2,
    maxGradedFailures: stagedProtected.grading.maxGradedFailures,
  });

  expect(result.isCorrect).toBe(false);
  expect(result.objectiveStatus).toBe("failed");
  expect(result.caseStatus).toBe("closed_unsolved");
});
