import path from "node:path";

import { loadProtectedCase } from "@/features/cases/load-protected-case";

const fixturesRoot = path.join(process.cwd(), "tests", "fixtures", "cases");

test("protected loader exposes grading configuration", async () => {
  const payload = await loadProtectedCase("hollow-bishop");

  expect(payload.canonicalAnswers.suspect).toBeDefined();
});

test("protected loader rejects case slugs that escape the cases root", async () => {
  await expect(
    loadProtectedCase("../cases/text-first-valid", {
      casesRoot: fixturesRoot,
    }),
  ).rejects.toThrow(/slug/i);
});
