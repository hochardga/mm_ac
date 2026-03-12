import { evaluateReport } from "@/features/submissions/evaluate-report";

test("marks the third incorrect report as closed_unsolved", async () => {
  const result = await evaluateReport({
    answers: { suspectId: "wrong", motiveId: "wrong", methodId: "wrong" },
    attemptNumber: 3,
    protectedCaseSlug: "hollow-bishop",
  });

  expect(result.nextStatus).toBe("closed_unsolved");
});

test("marks a correct report as completed", async () => {
  const result = await evaluateReport({
    answers: {
      suspectId: "bookkeeper",
      motiveId: "embezzlement",
      methodId: "poisoned-wine",
    },
    attemptNumber: 1,
    protectedCaseSlug: "hollow-bishop",
  });

  expect(result.nextStatus).toBe("completed");
  expect(result.terminal).toBe(true);
});
