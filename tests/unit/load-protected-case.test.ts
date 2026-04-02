import path from "node:path";

import {
  loadAnyProtectedCase,
  loadProtectedCase,
  loadStagedProtectedCase,
} from "@/features/cases/load-protected-case";

const fixturesRoot = path.join(process.cwd(), "tests", "fixtures", "cases");

test("protected loader exposes grading configuration", async () => {
  const payload = await loadStagedProtectedCase("staged-valid", {
    casesRoot: fixturesRoot,
  });

  expect(payload.grading.maxGradedFailures).toBe(3);
  expect(payload.canonicalAnswers["pick-suspect"]).toMatchObject({
    type: "single_choice",
    choiceId: "bookkeeper",
  });
  expect(payload.canonicalAnswers["pick-evidence"]).toMatchObject({
    type: "multi_choice",
    choiceIds: ["ledger", "receipt"],
  });
  expect(payload.canonicalAnswers["confirm-entry"]).toMatchObject({
    type: "boolean",
    value: true,
  });
  expect(payload.canonicalAnswers["enter-code"]).toMatchObject({
    type: "code_entry",
    value: "VESPER-17",
  });
  expect(payload.debriefs).toEqual({
    solved: { title: "Debrief", summary: "Solved summary" },
    closed_unsolved: { title: "Closed", summary: "Closed summary" },
  });
});

test("protected loader supports staged shipped cases", async () => {
  const payload = await loadAnyProtectedCase("hollow-bishop");

  if ("feedbackTemplates" in payload) {
    throw new Error("expected staged shipped payload");
  }

  expect(payload.grading.maxGradedFailures).toBeGreaterThan(0);
  expect(payload.canonicalAnswers).toMatchObject({
    "chalice-relevance": {
      type: "boolean",
      value: false,
    },
    "identify-poisoner": {
      type: "single_choice",
      choiceId: "bookkeeper",
    },
  });
  expect(payload.debriefs.solved.title).toMatch(/hollow bishop/i);
});

test("night bloom allows a wider graded-failure budget", async () => {
  const payload = await loadAnyProtectedCase("night-bloom-halcyon-glass");

  if ("feedbackTemplates" in payload) {
    throw new Error("expected staged shipped payload");
  }

  expect(payload.grading.maxGradedFailures).toBe(6);
});

test("protected loader rejects case slugs that escape the cases root", async () => {
  await expect(
    loadProtectedCase("../cases/text-first-valid", {
      casesRoot: fixturesRoot,
    }),
  ).rejects.toThrow(/slug/i);
});

test("protected loader rejects mismatched expected revisions", async () => {
  await expect(
    loadStagedProtectedCase("staged-valid", {
      casesRoot: fixturesRoot,
      expectedRevision: "rev-does-not-exist",
    }),
  ).rejects.toThrow(/revision/i);
});
