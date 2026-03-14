import type { StagedCaseManifest } from "@/features/cases/case-schema";
import { formatStagedAnswer } from "@/features/cases/format-staged-answer";

type StagedObjective = StagedCaseManifest["stages"][number]["objectives"][number];

const booleanObjective: StagedObjective = {
  id: "chalice-relevance",
  prompt: "Was the silver chalice actually the murder weapon?",
  type: "boolean",
  stakes: "advisory",
  successUnlocks: {
    stageIds: ["poison-proof"],
    resolvesCase: false,
  },
};

const singleChoiceObjective: StagedObjective = {
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

const multiChoiceObjective: StagedObjective = {
  id: "select-missing-records",
  prompt: "Which two records disappeared in the same relief cycle?",
  type: "multi_choice",
  stakes: "graded",
  options: [
    { id: "grain-vouchers", label: "Emergency grain vouchers" },
    { id: "widow-stipends", label: "Widow stipends" },
    { id: "ferry-repairs", label: "Ferry repair bond" },
    { id: "court-levy", label: "Court levy receipts" },
  ],
  successUnlocks: {
    stageIds: ["final-attribution"],
    resolvesCase: false,
  },
};

const codeEntryObjective: StagedObjective = {
  id: "match-initials",
  prompt: "Enter the repeating initials beside the erased entries.",
  type: "code_entry",
  stakes: "advisory",
  successUnlocks: {
    stageIds: ["relief-trail"],
    resolvesCase: false,
  },
};

test("formats staged answers into readable labels across objective types", async () => {
  expect(
    formatStagedAnswer(booleanObjective, {
      type: "boolean",
      value: true,
    }),
  ).toBe("Yes");
  expect(
    formatStagedAnswer(booleanObjective, {
      type: "boolean",
      value: false,
    }),
  ).toBe("No");
  expect(
    formatStagedAnswer(singleChoiceObjective, {
      type: "single_choice",
      choiceId: "bookkeeper",
    }),
  ).toBe("Bookkeeper Mara Quinn");
  expect(
    formatStagedAnswer(multiChoiceObjective, {
      type: "multi_choice",
      choiceIds: ["grain-vouchers", "court-levy"],
    }),
  ).toBe("Emergency grain vouchers, Court levy receipts");
  expect(
    formatStagedAnswer(codeEntryObjective, {
      type: "code_entry",
      value: "NW",
    }),
  ).toBe("NW");
});

test("falls back to raw authored ids when an option label cannot be resolved", () => {
  expect(
    formatStagedAnswer(singleChoiceObjective, {
      type: "single_choice",
      choiceId: "unknown-suspect",
    }),
  ).toBe("unknown-suspect");
  expect(
    formatStagedAnswer(multiChoiceObjective, {
      type: "multi_choice",
      choiceIds: ["widow-stipends", "missing-record"],
    }),
  ).toBe("Widow stipends, missing-record");
});
