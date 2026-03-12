import { buildAnalyticsEvent } from "@/lib/analytics";

test("records graded report submissions with session id and case revision", () => {
  const event = buildAnalyticsEvent("Graded report submitted", {
    playerId: "player-1",
    sessionId: "sess-1",
    caseDefinitionId: "case-1",
    caseRevision: "rev-2",
    submissionToken: "tok-1",
  });

  expect(event.caseRevision).toBe("rev-2");
  expect(event.submissionToken).toBe("tok-1");
});

test("requires a submission token for graded report events", () => {
  expect(() =>
    buildAnalyticsEvent("Graded report submitted", {
      playerId: "player-1",
      sessionId: "sess-1",
      caseDefinitionId: "case-1",
      caseRevision: "rev-2",
    }),
  ).toThrow(/submission token/i);
});
