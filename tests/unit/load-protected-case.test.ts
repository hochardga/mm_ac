import { loadProtectedCase } from "@/features/cases/load-protected-case";

test("protected loader exposes grading configuration", async () => {
  const payload = await loadProtectedCase("hollow-bishop");

  expect(payload.canonicalAnswers.suspect).toBeDefined();
});
