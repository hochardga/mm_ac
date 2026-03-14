import { buildCaseProgression } from "@/features/cases/case-progression";
import type { LoadedStagedCaseManifest } from "@/features/cases/load-case-manifest";

const manifest: LoadedStagedCaseManifest = {
  slug: "fixture-case",
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
      summary: "A personal letter.",
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
      summary: "Opening stage.",
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
      summary: "Confront the suspect.",
      handlerPrompts: ["Use the letter once unlocked."],
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

test("derives visible evidence and active objectives from staged objective rows", () => {
  const progression = buildCaseProgression({
    manifest,
    objectiveStates: [
      { objectiveId: "pick-suspect", stageId: "briefing", status: "active" },
      { objectiveId: "enter-code", stageId: "confrontation", status: "locked" },
    ],
  });

  expect(progression.visibleEvidence.map((entry) => entry.id)).toEqual(["ledger"]);
  expect(progression.activeObjectives.map((objective) => objective.id)).toEqual([
    "pick-suspect",
  ]);
  expect(progression.visibleHandlerPrompts).toEqual(["Start with the ledger."]);
  expect(progression.solvedObjectives).toEqual([]);
  expect(progression.snapshot).toMatchObject({
    visibleStageCount: 1,
    totalStageCount: 2,
    solvedObjectiveCount: 0,
    totalObjectiveCount: 2,
    visibleEvidenceCount: 1,
    nextObjectivePrompt: "Who doctored the books?",
    focusStage: {
      id: "briefing",
      title: "Briefing",
      summary: "Opening stage.",
      position: 1,
    },
  });
  expect(progression.completed).toBe(false);
});

test("unlocks the next staged objective after a solved prerequisite", () => {
  const progression = buildCaseProgression({
    manifest,
    objectiveStates: [
      { objectiveId: "pick-suspect", stageId: "briefing", status: "solved" },
      { objectiveId: "enter-code", stageId: "confrontation", status: "active" },
    ],
  });

  expect(progression.solvedObjectives.map((objective) => objective.id)).toEqual([
    "pick-suspect",
  ]);
  expect(progression.activeObjectives.map((objective) => objective.id)).toEqual([
    "enter-code",
  ]);
  expect(progression.visibleEvidence.map((entry) => entry.id)).toEqual([
    "ledger",
    "letter",
  ]);
  expect(progression.snapshot).toMatchObject({
    visibleStageCount: 2,
    totalStageCount: 2,
    solvedObjectiveCount: 1,
    totalObjectiveCount: 2,
    visibleEvidenceCount: 2,
    nextObjectivePrompt: "Enter the lock code.",
    focusStage: {
      id: "confrontation",
      title: "Confrontation",
      summary: "Confront the suspect.",
      position: 2,
    },
  });
  expect(progression.completed).toBe(false);
});

test("falls back to the last visible stage when all staged objectives are solved", () => {
  const progression = buildCaseProgression({
    manifest,
    objectiveStates: [
      { objectiveId: "pick-suspect", stageId: "briefing", status: "solved" },
      { objectiveId: "enter-code", stageId: "confrontation", status: "solved" },
    ],
  });

  expect(progression.snapshot).toMatchObject({
    visibleStageCount: 2,
    totalStageCount: 2,
    solvedObjectiveCount: 2,
    totalObjectiveCount: 2,
    visibleEvidenceCount: 2,
    nextObjectivePrompt: undefined,
    focusStage: {
      id: "confrontation",
      title: "Confrontation",
      summary: "Confront the suspect.",
      position: 2,
    },
  });
  expect(progression.completed).toBe(true);
});
