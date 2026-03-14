import * as schema from "@/db/schema";

test("exports the expected baseline tables", () => {
  expect(Object.keys(schema)).toEqual(
    expect.arrayContaining([
      "users",
      "caseDefinitions",
      "playerCases",
      "notes",
      "reportDrafts",
      "reportSubmissions",
      "analyticsEvents",
      "playerCaseObjectives",
      "objectiveSubmissions",
    ]),
  );
});

test("playerCases exposes the graded failure counter", () => {
  expect(schema.playerCases.gradedFailureCount).toBeDefined();
});

test("playerCases exposes remembered evidence continuity fields", () => {
  expect(schema.playerCases.lastViewedEvidenceId.name).toBe(
    "last_viewed_evidence_id",
  );
  expect(schema.playerCases.lastViewedEvidenceAt.name).toBe(
    "last_viewed_evidence_at",
  );
});
