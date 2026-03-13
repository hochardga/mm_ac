import { caseManifestSourceSchema } from "@/features/cases/case-schema";

const baseManifest = {
  slug: "fixture-case",
  revision: "rev-1",
  title: "Fixture Case",
  summary: "Fixture summary",
  estimatedMinutes: 45,
  reportOptions: {
    suspect: [{ id: "suspect-a", label: "Suspect A" }],
    motive: [{ id: "motive-a", label: "Motive A" }],
    method: [{ id: "method-a", label: "Method A" }],
  },
  handlerPrompts: ["Start with the ledger."],
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
