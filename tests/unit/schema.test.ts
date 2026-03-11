import * as schema from "@/db/schema";

test("exports the expected baseline tables", () => {
  expect(Object.keys(schema)).toEqual(
    expect.arrayContaining([
      "users",
      "caseDefinitions",
      "playerCases",
      "notes",
      "reportDrafts",
      "analyticsEvents",
    ]),
  );
});
