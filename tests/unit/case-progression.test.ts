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
  expect(progression.completed).toBe(false);
});
