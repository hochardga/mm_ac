import * as schema from "@/db/schema";

test("exports the expected baseline tables", () => {
  expect(Object.keys(schema)).toEqual(
    expect.arrayContaining([
      "users",
      "caseDefinitions",
      "playerCases",
      "notes",
      "analyticsEvents",
      "playerCaseObjectives",
      "objectiveSubmissions",
    ]),
  );
});

test("playerCases exposes the graded failure counter", () => {
  expect(schema.playerCases.gradedFailureCount).toBeDefined();
});
