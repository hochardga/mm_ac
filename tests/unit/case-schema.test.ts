import { caseManifestSourceSchema } from "@/features/cases/case-schema";

const baseManifest = {
  slug: "fixture-case",
  revision: "rev-2",
  title: "Fixture Case",
  summary: "Fixture summary",
  complexity: "standard",
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
      ],
    },
  ],
};

test("rejects case manifests without evidence entries", () => {
  expect(() =>
    caseManifestSourceSchema.parse({
      ...baseManifest,
      evidence: [],
    }),
  ).toThrow();
});

test("rejects duplicate evidence ids", () => {
  expect(() =>
    caseManifestSourceSchema.parse({
      ...baseManifest,
      evidence: [
        {
          id: "ledger",
          title: "Ledger Extract",
          family: "document",
          subtype: "legal_doc",
          summary: "A damaged parish ledger.",
          source: "evidence/ledger.md",
        },
        {
          id: "ledger",
          title: "Ledger Duplicate",
          family: "record",
          subtype: "badge_swipes",
          summary: "Duplicate id to reject.",
          source: "evidence/access-log.json",
        },
      ],
    }),
  ).toThrow(/unique/i);
});

test("rejects duplicate stage ids", () => {
  expect(() =>
    caseManifestSourceSchema.parse({
      ...baseManifest,
      evidence: [
        {
          id: "ledger",
          title: "Ledger Extract",
          family: "document",
          subtype: "financial_ledger",
          summary: "A damaged ledger.",
          source: "evidence/ledger.md",
        },
      ],
      stages: [
        {
          ...baseManifest.stages[0],
          id: "briefing",
        },
        {
          ...baseManifest.stages[0],
          id: "briefing",
        },
      ],
    }),
  ).toThrow(/stage/i);
});

test("rejects duplicate objective ids across stages", () => {
  expect(() =>
    caseManifestSourceSchema.parse({
      ...baseManifest,
      evidence: [
        {
          id: "ledger",
          title: "Ledger Extract",
          family: "document",
          subtype: "financial_ledger",
          summary: "A damaged ledger.",
          source: "evidence/ledger.md",
        },
      ],
      stages: [
        {
          ...baseManifest.stages[0],
          id: "briefing",
        },
        {
          ...baseManifest.stages[0],
          id: "confrontation",
        },
      ],
    }),
  ).toThrow(/objective/i);
});

test("rejects single-choice objectives without options", () => {
  expect(() =>
    caseManifestSourceSchema.parse({
      ...baseManifest,
      evidence: [
        {
          id: "ledger",
          title: "Ledger Extract",
          family: "document",
          subtype: "financial_ledger",
          summary: "A damaged ledger.",
          source: "evidence/ledger.md",
        },
      ],
      stages: [
        {
          ...baseManifest.stages[0],
          objectives: [
            {
              id: "pick-suspect",
              prompt: "Who doctored the books?",
              type: "single_choice",
              stakes: "graded",
              successUnlocks: { stageIds: ["confrontation"], resolvesCase: false },
            },
          ],
        },
      ],
    }),
  ).toThrow(/option/i);
});

test("rejects code-entry objectives with options", () => {
  expect(() =>
    caseManifestSourceSchema.parse({
      ...baseManifest,
      evidence: [
        {
          id: "ledger",
          title: "Ledger Extract",
          family: "document",
          subtype: "financial_ledger",
          summary: "A damaged ledger.",
          source: "evidence/ledger.md",
        },
      ],
      stages: [
        {
          ...baseManifest.stages[0],
          objectives: [
            {
              id: "enter-code",
              prompt: "Enter the lock code.",
              type: "code_entry",
              stakes: "advisory",
              options: [{ id: "bad", label: "Nope" }],
              successUnlocks: { stageIds: ["confrontation"], resolvesCase: false },
            },
          ],
        },
      ],
    }),
  ).toThrow(/option/i);
});
