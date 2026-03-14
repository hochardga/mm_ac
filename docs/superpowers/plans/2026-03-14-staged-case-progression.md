# Staged Case Progression Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fixed three-answer case flow with staged objectives and unlocks, ship a new mixed-complexity case lineup, and swap vault runtime estimates for authored complexity badges.

**Architecture:** Keep the existing routes, dossier shell, and evidence viewer, but replace the report-specific case contract with a stage-based manifest plus per-objective protected answers and player state. Drive progression through pure helpers that compute unlocked stages, visible evidence, active objectives, and terminal outcomes from authored data plus persisted objective rows so the workspace, vault, continuity, and debrief surfaces all read from the same model.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS v4, Drizzle ORM, Zod, Vitest, Testing Library, Playwright

---

## File Structure

Use `@test-driven-development` for every task, `@systematic-debugging` if a red test fails for an unexpected reason, and `@verification-before-completion` before claiming the full rollout is finished.

Keep the existing case slugs (`hollow-bishop`, `red-harbor`, `briar-ledger`) so route coverage and seeded IDs stay stable while the authored content underneath them is fully replaced.

### Create

- `src/features/cases/case-progression.ts` - Pure progression helper that derives unlocked stages, visible evidence, active objectives, and completion state from manifests plus player objective rows.
- `src/features/cases/objective-payload.ts` - Shared payload parsing and normalization helpers for objective types.
- `src/features/cases/components/active-objectives-panel.tsx` - Right-rail objective surface that replaces the report panel.
- `src/features/cases/components/objective-form-fields.tsx` - Small renderer for type-specific inputs (`single_choice`, `multi_choice`, `boolean`, `code_entry`).
- `src/features/drafts/save-objective-draft.ts` - Draft persistence for per-objective payloads.
- `src/features/submissions/evaluate-objective-submission.ts` - Pure server-side grading helper for one objective submission.
- `src/features/submissions/submit-objective.ts` - Transactional objective submission service with unlock updates and failure-budget handling.
- `tests/unit/case-progression.test.ts` - Pure progression coverage.
- `tests/unit/objective-payload.test.ts` - Payload parsing and normalization coverage.
- `tests/unit/save-objective-draft.test.ts` - Draft persistence coverage for objective rows.
- `tests/unit/evaluate-objective-submission.test.ts` - Objective grading coverage.
- `tests/integration/objective-submission.test.ts` - Transactional progression coverage.
- `tests/fixtures/cases/staged-valid/*` - Valid staged fixture package for manifest/protected loading tests.
- `tests/fixtures/cases/staged-bad-unlock/*` - Invalid unlock reference fixture.
- `tests/fixtures/cases/staged-cycle/*` - Invalid cyclic progression fixture.
- `docs/superpowers/plans/2026-03-14-staged-case-progression.md` - This implementation plan.

### Modify

- `src/features/cases/case-schema.ts` - Replace the fixed report-option schema with `complexity`, `stages`, `objective` definitions, and per-objective protected answers.
- `src/features/cases/load-case-manifest.ts` - Load the staged manifest while preserving the existing evidence-source hydration path.
- `src/features/cases/load-protected-case.ts` - Load per-objective protected answers and case-level grading rules.
- `src/features/cases/validate-case-package.ts` - Validate unlock references and progression shape in addition to manifest/protected schema parsing.
- `src/features/cases/open-case.ts` - Seed per-objective rows on first open and return continuity based on active objectives instead of a fixed report draft.
- `src/features/cases/case-continuity.ts` - Point continuity toward `#active-objectives` and objective drafts/feedback instead of `#draft-report`.
- `src/features/cases/list-available-cases.ts` - Surface complexity badges and objective-based continuity.
- `src/app/(shell)/vault/page.tsx` - Render complexity pills and keep progress cues non-spoilery.
- `src/app/(app)/cases/[caseSlug]/page.tsx` - Load progression-aware case state and pass it to the workspace.
- `src/app/(app)/cases/[caseSlug]/actions.ts` - Replace report-draft/report-submit form handling with per-objective save/submit actions.
- `src/features/cases/components/report-panel.tsx` - Retire this fixed-form panel once `active-objectives-panel.tsx` owns the right rail.
- `src/features/cases/components/case-workspace.tsx` - Filter evidence to the visible set and swap the report panel for active objectives.
- `src/features/drafts/save-report-draft.ts` - Remove or reduce to a short-lived adapter after objective-draft callers move.
- `src/features/submissions/evaluate-report.ts` - Remove after the generic objective grader takes over.
- `src/features/submissions/submit-report.ts` - Remove after the generic objective submitter takes over.
- `src/features/debrief/get-debrief.ts` - Build a generic objective-based terminal recap rather than a suspect/motive/method tuple.
- `src/features/debrief/components/debrief-report-card.tsx` - Render generic labeled answer rows rather than hardcoded theory fields.
- `src/features/debrief/components/debrief-attempt-history.tsx` - Render generic graded-attempt history.
- `src/app/(app)/cases/[caseSlug]/debrief/page.tsx` - Show objective-based recap cards and objective attempt history.
- `src/db/schema.ts` - Add objective-state tables and case-wide graded-failure tracking; remove or stop using report-specific tables.
- `src/db/migrations/*` - Add the migration and generated metadata for the new schema.
- `src/db/seed.ts` - Keep seeding aligned with the new authored content contract.
- `content/cases/hollow-bishop/*` - Replace case metadata, protected answers, and evidence wiring with a staged version.
- `content/cases/red-harbor/*` - Replace case metadata, protected answers, and evidence wiring with a staged version.
- `content/cases/briar-ledger/*` - Replace case metadata, protected answers, and evidence wiring with a staged version.
- `tests/unit/case-schema.test.ts`
- `tests/unit/load-case-manifest.test.ts`
- `tests/unit/load-protected-case.test.ts`
- `tests/unit/validate-case-package.test.ts`
- `tests/unit/schema.test.ts`
- `tests/unit/open-case.test.ts`
- `tests/unit/case-continuity.test.ts`
- `tests/unit/case-actions.test.ts`
- `tests/unit/save-report-draft.test.ts`
- `tests/unit/evaluate-report.test.ts`
- `tests/integration/resume-state.test.ts`
- `tests/integration/submit-report.test.ts`
- `tests/integration/vault-page.test.tsx`
- `tests/integration/case-workspace-page.test.tsx`
- `tests/integration/debrief-page.test.tsx`
- `tests/e2e/workspace.spec.ts`
- `tests/e2e/debrief.spec.ts`
- `tests/e2e/retention-loop.spec.ts`

## Chunk 1: Staged Case Package Contract

### Task 1: Replace the fixed manifest/protected schema with staged objectives

**Files:**
- Create: `tests/fixtures/cases/staged-valid/manifest.json`
- Create: `tests/fixtures/cases/staged-valid/protected.json`
- Modify: `src/features/cases/case-schema.ts`
- Modify: `src/features/cases/load-case-manifest.ts`
- Modify: `src/features/cases/load-protected-case.ts`
- Modify: `tests/unit/case-schema.test.ts`
- Modify: `tests/unit/load-case-manifest.test.ts`
- Modify: `tests/unit/load-protected-case.test.ts`
- Test: `tests/unit/case-schema.test.ts`
- Test: `tests/unit/load-case-manifest.test.ts`
- Test: `tests/unit/load-protected-case.test.ts`

- [ ] **Step 1: Write the failing staged-schema tests**

Add manifest coverage for:

```ts
const stagedManifest = {
  slug: "fixture-case",
  revision: "rev-2",
  title: "Fixture Case",
  summary: "Fixture summary",
  complexity: "standard",
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
```

Add protected-case coverage for:

```ts
{
  slug: "fixture-case",
  revision: "rev-2",
  grading: { maxGradedFailures: 3 },
  canonicalAnswers: {
    "pick-suspect": { type: "single_choice", choiceId: "bookkeeper" },
  },
  debriefs: {
    solved: { title: "Debrief", summary: "Solved summary" },
    closed_unsolved: { title: "Closed", summary: "Closed summary" },
  },
}
```

Also add red tests that reject:

- duplicate stage ids
- duplicate objective ids across a case
- `single_choice` objectives without options
- `code_entry` objectives with options

- [ ] **Step 2: Run the staged-schema tests to verify RED**

Run: `pnpm vitest run tests/unit/case-schema.test.ts tests/unit/load-case-manifest.test.ts tests/unit/load-protected-case.test.ts`

Expected: FAIL because the runtime schemas still require `estimatedMinutes`, `reportOptions`, and case-level canonical answers.

- [ ] **Step 3: Implement the staged manifest and protected schemas**

Update `src/features/cases/case-schema.ts` so it defines:

```ts
const objectiveOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
});

const objectiveSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string(),
    prompt: z.string(),
    type: z.literal("single_choice"),
    stakes: z.enum(["advisory", "graded"]),
    options: z.array(objectiveOptionSchema).min(1),
    successUnlocks: z.object({
      stageIds: z.array(z.string()).default([]),
      resolvesCase: z.boolean().default(false),
    }),
  }).strict(),
  z.object({
    id: z.string(),
    prompt: z.string(),
    type: z.literal("multi_choice"),
    stakes: z.enum(["advisory", "graded"]),
    options: z.array(objectiveOptionSchema).min(2),
    successUnlocks: z.object({
      stageIds: z.array(z.string()).default([]),
      resolvesCase: z.boolean().default(false),
    }),
  }).strict(),
  z.object({
    id: z.string(),
    prompt: z.string(),
    type: z.literal("boolean"),
    stakes: z.enum(["advisory", "graded"]),
    successUnlocks: z.object({
      stageIds: z.array(z.string()).default([]),
      resolvesCase: z.boolean().default(false),
    }),
  }).strict(),
  z.object({
    id: z.string(),
    prompt: z.string(),
    type: z.literal("code_entry"),
    stakes: z.enum(["advisory", "graded"]),
    successUnlocks: z.object({
      stageIds: z.array(z.string()).default([]),
      resolvesCase: z.boolean().default(false),
    }),
  }).strict(),
]);
```

Then wire `loadCaseManifest()` and `loadProtectedCase()` to parse the new shapes without changing the existing evidence-source hydration behavior.

- [ ] **Step 4: Run the staged-schema tests to verify GREEN**

Run: `pnpm vitest run tests/unit/case-schema.test.ts tests/unit/load-case-manifest.test.ts tests/unit/load-protected-case.test.ts`

Expected: PASS, including the staged fixture case loading through the real manifest/protected loaders.

- [ ] **Step 5: Commit**

```bash
git add src/features/cases/case-schema.ts src/features/cases/load-case-manifest.ts src/features/cases/load-protected-case.ts tests/unit/case-schema.test.ts tests/unit/load-case-manifest.test.ts tests/unit/load-protected-case.test.ts tests/fixtures/cases/staged-valid
git commit -m "feat: add staged case package schemas"
```

### Task 2: Validate unlock graphs and refresh the shipped case content

**Files:**
- Create: `tests/fixtures/cases/staged-bad-unlock/manifest.json`
- Create: `tests/fixtures/cases/staged-bad-unlock/protected.json`
- Create: `tests/fixtures/cases/staged-cycle/manifest.json`
- Create: `tests/fixtures/cases/staged-cycle/protected.json`
- Modify: `src/features/cases/validate-case-package.ts`
- Modify: `tests/unit/validate-case-package.test.ts`
- Modify: `content/cases/hollow-bishop/manifest.json`
- Modify: `content/cases/hollow-bishop/protected.json`
- Modify: `content/cases/red-harbor/manifest.json`
- Modify: `content/cases/red-harbor/protected.json`
- Modify: `content/cases/briar-ledger/manifest.json`
- Modify: `content/cases/briar-ledger/protected.json`
- Test: `tests/unit/validate-case-package.test.ts`

- [ ] **Step 1: Add failing validation tests for unlock integrity**

Extend `tests/unit/validate-case-package.test.ts` with cases that:

```ts
await expect(
  validateCasePackage("staged-bad-unlock", { casesRoot: fixturesRoot }),
).rejects.toThrow(/unknown stage/i);

await expect(
  validateCasePackage("staged-cycle", { casesRoot: fixturesRoot }),
).rejects.toThrow(/cycle/i);

await expect(
  validateCasePackage("staged-valid", { casesRoot: fixturesRoot }),
).resolves.toMatchObject({
  slug: "staged-valid",
  revision: "rev-2",
});
```

Then add one expectation that the shipped cases now expose `complexity` instead of `estimatedMinutes`.

- [ ] **Step 2: Run the validation tests to verify RED**

Run: `pnpm vitest run tests/unit/validate-case-package.test.ts tests/unit/load-case-manifest.test.ts`

Expected: FAIL because `validateCasePackage()` currently only checks that the manifest and protected payload parse.

- [ ] **Step 3: Implement unlock validation and replace the authored case lineup**

Update `src/features/cases/validate-case-package.ts` so it:

- gathers all stage ids and objective ids
- verifies every `evidenceId` points at a real evidence entry
- verifies every `successUnlocks.stageIds` target exists
- verifies at least one stage starts unlocked
- rejects unlock cycles with a small DFS over the stage graph

Then replace the shipped authored content so the live lineup is:

- `hollow-bishop`: one-step `Light` case
- `red-harbor`: medium `Standard` staged case
- `briar-ledger`: deeper `Deep` staged case

Keep the same slugs, but rewrite the manifests/protected payloads so they use the staged contract and stage-aware objective prompts.

- [ ] **Step 4: Run package validation against fixtures and live content**

Run: `pnpm vitest run tests/unit/validate-case-package.test.ts tests/unit/load-case-manifest.test.ts tests/unit/load-protected-case.test.ts`

Run: `pnpm validate:cases`

Expected: PASS, and the validator should report no invalid stage references or cycles in `content/cases/*`.

- [ ] **Step 5: Commit**

```bash
git add src/features/cases/validate-case-package.ts tests/unit/validate-case-package.test.ts content/cases/hollow-bishop content/cases/red-harbor content/cases/briar-ledger tests/fixtures/cases/staged-bad-unlock tests/fixtures/cases/staged-cycle
git commit -m "feat: validate staged case unlock graphs"
```

## Chunk 2: Persistence And Progression Foundation

### Task 3: Add objective-state persistence and the case-wide graded failure budget

**Files:**
- Modify: `src/db/schema.ts`
- Create: `src/db/migrations/0005_staged_case_progression.sql`
- Create: `src/db/migrations/meta/0005_snapshot.json`
- Modify: `src/db/migrations/meta/_journal.json`
- Modify: `tests/unit/schema.test.ts`
- Test: `tests/unit/schema.test.ts`

- [ ] **Step 1: Write the failing schema expectations**

Update `tests/unit/schema.test.ts` so it expects the exported schema to include:

- `playerCaseObjectives`
- `objectiveSubmissions`

and no longer treats `reportDrafts` / `reportSubmissions` as required tables.

Also add assertions that `playerCases` exposes `gradedFailureCount`.

- [ ] **Step 2: Run the schema test to verify RED**

Run: `pnpm vitest run tests/unit/schema.test.ts`

Expected: FAIL because the new tables and failure counter do not exist yet.

- [ ] **Step 3: Implement the new database schema and generate the migration**

Update `src/db/schema.ts` to add:

```ts
export const playerCases = pgTable("player_cases", {
  // existing ids...
  gradedFailureCount: integer("graded_failure_count").notNull().default(0),
});

export const playerCaseObjectives = pgTable("player_case_objectives", {
  id: text("id").primaryKey(),
  playerCaseId: text("player_case_id").notNull().references(() => playerCases.id, {
    onDelete: "cascade",
  }),
  stageId: text("stage_id").notNull(),
  objectiveId: text("objective_id").notNull(),
  status: text("status").notNull(),
  draftPayload: jsonb("draft_payload"),
  solvedAt: timestamp("solved_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const objectiveSubmissions = pgTable("objective_submissions", {
  id: text("id").primaryKey(),
  playerCaseId: text("player_case_id").notNull().references(() => playerCases.id, {
    onDelete: "cascade",
  }),
  objectiveId: text("objective_id").notNull(),
  submissionToken: text("submission_token").notNull().unique(),
  answerPayload: jsonb("answer_payload").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  feedback: text("feedback").notNull(),
  nextStatus: text("next_status").notNull(),
  attemptNumber: integer("attempt_number").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

Generate the migration after the schema update so the SQL and `meta` snapshot match the checked-in Drizzle contract.

- [ ] **Step 4: Run the schema test to verify GREEN**

Run: `pnpm vitest run tests/unit/schema.test.ts`

Expected: PASS, with the migration files present and the schema exports updated.

- [ ] **Step 5: Commit**

```bash
git add src/db/schema.ts src/db/migrations/0005_staged_case_progression.sql src/db/migrations/meta/0005_snapshot.json src/db/migrations/meta/_journal.json tests/unit/schema.test.ts
git commit -m "feat: persist staged case objective state"
```

### Task 4: Build the pure progression resolver and seed objective rows on first open

**Files:**
- Create: `src/features/cases/case-progression.ts`
- Create: `tests/unit/case-progression.test.ts`
- Modify: `src/features/cases/open-case.ts`
- Modify: `tests/unit/open-case.test.ts`
- Test: `tests/unit/case-progression.test.ts`
- Test: `tests/unit/open-case.test.ts`

- [ ] **Step 1: Add failing progression and open-case tests**

Create a pure progression test that proves:

```ts
const progression = buildCaseProgression({
  manifest,
  objectiveStates: [
    { objectiveId: "pick-suspect", stageId: "briefing", status: "active" },
    { objectiveId: "enter-code", stageId: "confrontation", status: "locked" },
  ],
});

expect(progression.visibleEvidence.map((entry) => entry.id)).toEqual(["ledger"]);
expect(progression.activeObjectives.map((objective) => objective.id)).toEqual([
  "pick-suspect",
]);
expect(progression.completed).toBe(false);
```

Then extend `tests/unit/open-case.test.ts` so the first open:

- inserts one `player_case_objectives` row per authored objective
- marks only the `startsUnlocked` stage objectives as `active`
- keeps later-stage objectives `locked`

- [ ] **Step 2: Run the progression tests to verify RED**

Run: `pnpm vitest run tests/unit/case-progression.test.ts tests/unit/open-case.test.ts`

Expected: FAIL because there is no progression helper and `openCase()` does not seed objective rows.

- [ ] **Step 3: Implement the progression helper and objective-row bootstrapping**

Create `src/features/cases/case-progression.ts` with one pure helper that:

- accepts the hydrated manifest and persisted objective rows
- resolves visible stages from `startsUnlocked` plus solved-objective unlocks
- filters evidence to only those referenced by visible stages
- returns `activeObjectives`, `solvedObjectives`, `visibleEvidence`, `visibleHandlerPrompts`, and `completed`

Update `src/features/cases/open-case.ts` so a newly created `playerCase` also inserts one row per authored objective with initial `active` or `locked` status based on `startsUnlocked`.

- [ ] **Step 4: Run the progression tests to verify GREEN**

Run: `pnpm vitest run tests/unit/case-progression.test.ts tests/unit/open-case.test.ts`

Expected: PASS, and the first-open path now creates deterministic objective rows.

- [ ] **Step 5: Commit**

```bash
git add src/features/cases/case-progression.ts src/features/cases/open-case.ts tests/unit/case-progression.test.ts tests/unit/open-case.test.ts
git commit -m "feat: derive staged case progression state"
```

## Chunk 3: Objective Draft And Submission Services

### Task 5: Replace report drafts with objective-specific draft saves

**Files:**
- Create: `src/features/cases/objective-payload.ts`
- Create: `src/features/drafts/save-objective-draft.ts`
- Create: `tests/unit/objective-payload.test.ts`
- Create: `tests/unit/save-objective-draft.test.ts`
- Modify: `src/app/(app)/cases/[caseSlug]/actions.ts`
- Modify: `tests/unit/case-actions.test.ts`
- Test: `tests/unit/objective-payload.test.ts`
- Test: `tests/unit/save-objective-draft.test.ts`
- Test: `tests/unit/case-actions.test.ts`

- [ ] **Step 1: Add failing payload and draft-save tests**

Create payload normalization tests for:

```ts
expect(normalizeObjectivePayload("single_choice", formData)).toEqual({
  type: "single_choice",
  choiceId: "bookkeeper",
});

expect(normalizeObjectivePayload("multi_choice", formData)).toEqual({
  type: "multi_choice",
  choiceIds: ["ledger", "chalice"],
});

expect(normalizeObjectivePayload("boolean", formData)).toEqual({
  type: "boolean",
  value: true,
});

expect(normalizeObjectivePayload("code_entry", formData)).toEqual({
  type: "code_entry",
  value: "VESPER-17",
});
```

Create draft persistence tests that prove `saveObjectiveDraft()` updates the `draftPayload` for one `player_case_objectives` row and preserves the selected evidence redirect through `saveObjectiveDraftAction`.

- [ ] **Step 2: Run the draft tests to verify RED**

Run: `pnpm vitest run tests/unit/objective-payload.test.ts tests/unit/save-objective-draft.test.ts tests/unit/case-actions.test.ts`

Expected: FAIL because there is no payload helper, no objective-draft service, and the case actions still parse `suspectId` / `motiveId` / `methodId`.

- [ ] **Step 3: Implement payload normalization and objective draft persistence**

Create `src/features/cases/objective-payload.ts` with a small typed union and one parser:

```ts
export type ObjectiveAnswerPayload =
  | { type: "single_choice"; choiceId: string }
  | { type: "multi_choice"; choiceIds: string[] }
  | { type: "boolean"; value: boolean }
  | { type: "code_entry"; value: string };
```

Create `src/features/drafts/save-objective-draft.ts` so it:

- looks up the objective row by `playerCaseId` + `objectiveId`
- rejects non-active or missing objectives
- stores the normalized payload in `draftPayload`
- updates `updatedAt`

Update `src/app/(app)/cases/[caseSlug]/actions.ts` so the draft action accepts `objectiveId`, normalizes the payload from `FormData`, calls `saveObjectiveDraft()`, and keeps the evidence query parameter intact when redirecting back to the workspace.

Once the new action path is wired, delete `src/features/drafts/save-report-draft.ts` and either delete `tests/unit/save-report-draft.test.ts` or replace it with coverage for the new objective-draft service so the old report-specific draft path cannot linger unnoticed.

- [ ] **Step 4: Run the draft tests to verify GREEN**

Run: `pnpm vitest run tests/unit/objective-payload.test.ts tests/unit/save-objective-draft.test.ts tests/unit/case-actions.test.ts`

Expected: PASS, with type-specific payloads stored against the correct objective row.

- [ ] **Step 5: Commit**

```bash
git add src/features/cases/objective-payload.ts src/features/drafts/save-objective-draft.ts src/app/(app)/cases/[caseSlug]/actions.ts tests/unit/objective-payload.test.ts tests/unit/save-objective-draft.test.ts tests/unit/case-actions.test.ts
git commit -m "feat: save drafts for staged objectives"
```

### Task 6: Grade objective submissions and advance the case transactionally

**Files:**
- Create: `src/features/submissions/evaluate-objective-submission.ts`
- Create: `src/features/submissions/submit-objective.ts`
- Create: `tests/unit/evaluate-objective-submission.test.ts`
- Create: `tests/integration/objective-submission.test.ts`
- Modify: `src/app/(app)/cases/[caseSlug]/actions.ts`
- Modify: `tests/integration/resume-state.test.ts`
- Test: `tests/unit/evaluate-objective-submission.test.ts`
- Test: `tests/integration/objective-submission.test.ts`

- [ ] **Step 1: Add failing grading and progression integration tests**

Create a unit test for `evaluateObjectiveSubmission()` that proves:

- correct `single_choice` returns `solved`
- incorrect `advisory` objective keeps the case `in_progress`
- incorrect `graded` objective increments the failure budget
- the final graded miss returns `closed_unsolved`

Create an integration test that:

1. opens a staged case
2. submits the first active objective correctly
3. confirms newly unlocked stage objectives become `active`
4. confirms new evidence becomes visible
5. confirms a final correct terminal objective redirects the case to `completed`

Add a second integration test where repeated misses on a graded objective exhaust `maxGradedFailures` and close the case unsolved.

- [ ] **Step 2: Run the submission tests to verify RED**

Run: `pnpm vitest run tests/unit/evaluate-objective-submission.test.ts tests/integration/objective-submission.test.ts`

Expected: FAIL because there is no generic objective submission path and the app still only submits one case-level report.

- [ ] **Step 3: Implement transactional objective submission**

Create `src/features/submissions/evaluate-objective-submission.ts` so it compares a normalized payload against the protected answer for one objective and returns:

```ts
{
  isCorrect: boolean;
  objectiveStatus: "active" | "solved" | "failed";
  caseStatus: "in_progress" | "completed" | "closed_unsolved";
  feedback: string;
  unlockedStageIds: string[];
}
```

Create `src/features/submissions/submit-objective.ts` so it:

- checks the submission token for idempotency
- loads the active objective row and protected answer
- rejects locked or already-solved objectives
- writes an `objective_submissions` row
- marks the objective solved on success
- promotes newly unlocked stage objectives from `locked` to `active`
- increments `playerCases.gradedFailureCount` only for incorrect graded objectives
- marks the case terminal when `resolvesCase` succeeds or the failure budget is exhausted

Update `submitReportAction` into an objective-aware submit path, then rename the exported action if doing so keeps the file easier to reason about.

After the new path is green, delete `src/features/submissions/evaluate-report.ts`, `src/features/submissions/submit-report.ts`, and replace `tests/unit/evaluate-report.test.ts` plus `tests/integration/submit-report.test.ts` with the new objective-focused coverage.

- [ ] **Step 4: Run the submission tests to verify GREEN**

Run: `pnpm vitest run tests/unit/evaluate-objective-submission.test.ts tests/integration/objective-submission.test.ts tests/integration/resume-state.test.ts`

Expected: PASS, including resume-state expectations that now point at active objectives instead of a fixed report draft.

- [ ] **Step 5: Commit**

```bash
git add src/features/submissions/evaluate-objective-submission.ts src/features/submissions/submit-objective.ts src/app/(app)/cases/[caseSlug]/actions.ts tests/unit/evaluate-objective-submission.test.ts tests/integration/objective-submission.test.ts tests/integration/resume-state.test.ts
git commit -m "feat: submit staged objectives transactionally"
```

## Chunk 4: Workspace, Vault, And Debrief Surfaces

### Task 7: Replace the report panel with active objectives and gated evidence

**Files:**
- Create: `src/features/cases/components/active-objectives-panel.tsx`
- Create: `src/features/cases/components/objective-form-fields.tsx`
- Modify: `src/app/(app)/cases/[caseSlug]/page.tsx`
- Modify: `src/features/cases/components/case-workspace.tsx`
- Modify: `src/features/cases/case-continuity.ts`
- Modify: `tests/unit/case-continuity.test.ts`
- Modify: `tests/integration/case-workspace-page.test.tsx`
- Modify: `tests/e2e/workspace.spec.ts`
- Test: `tests/integration/case-workspace-page.test.tsx`

- [ ] **Step 1: Add failing workspace and continuity expectations**

Extend `tests/integration/case-workspace-page.test.tsx` so it asserts:

- the right rail shows `Active Objectives` instead of `Draft Report`
- locked evidence ids are not rendered until their parent stage unlocks
- a solved objective renders as completed feedback
- continuity links now target `#active-objectives`

Update `tests/unit/case-continuity.test.ts` so draft continuity expects:

```ts
expect(continuity.section).toBe("objectives");
expect(continuity.href).toBe("/cases/hollow-bishop#active-objectives");
```

- [ ] **Step 2: Run the workspace tests to verify RED**

Run: `pnpm vitest run tests/unit/case-continuity.test.ts tests/integration/case-workspace-page.test.tsx`

Expected: FAIL because the workspace still renders the fixed report panel and exposes all evidence immediately.

- [ ] **Step 3: Implement the objective-driven workspace**

Create `active-objectives-panel.tsx` so it:

- renders one card per active objective
- uses `objective-form-fields.tsx` to render the correct inputs for each objective type
- includes per-objective `Save Draft` and `Submit Answer` buttons
- shows completed-objective feedback in a collapsed section below active work

Update `src/app/(app)/cases/[caseSlug]/page.tsx` and `src/features/cases/components/case-workspace.tsx` so they:

- load the objective rows alongside notes
- call `buildCaseProgression()`
- pass only `progression.visibleEvidence` into the evidence index/viewer
- render stage-aware handler prompts from the visible stages
- anchor the right rail at `id="active-objectives"`

Update `case-continuity.ts` so drafts and feedback resume into `#active-objectives`.

- [ ] **Step 4: Run the workspace tests to verify GREEN**

Run: `pnpm vitest run tests/unit/case-continuity.test.ts tests/integration/case-workspace-page.test.tsx`

Expected: PASS, with objective-specific controls visible and locked evidence hidden until progression unlocks it.

- [ ] **Step 5: Commit**

```bash
git add src/features/cases/components/active-objectives-panel.tsx src/features/cases/components/objective-form-fields.tsx src/app/(app)/cases/[caseSlug]/page.tsx src/features/cases/components/case-workspace.tsx src/features/cases/case-continuity.ts tests/unit/case-continuity.test.ts tests/integration/case-workspace-page.test.tsx
git commit -m "feat: render staged objectives in the workspace"
```

### Task 8: Update the vault and debrief to reflect staged progression

**Files:**
- Modify: `src/features/cases/list-available-cases.ts`
- Modify: `src/app/(shell)/vault/page.tsx`
- Modify: `src/features/debrief/get-debrief.ts`
- Modify: `src/features/debrief/components/debrief-report-card.tsx`
- Modify: `src/features/debrief/components/debrief-attempt-history.tsx`
- Modify: `src/app/(app)/cases/[caseSlug]/debrief/page.tsx`
- Modify: `tests/integration/vault-page.test.tsx`
- Modify: `tests/integration/debrief-page.test.tsx`
- Test: `tests/integration/vault-page.test.tsx`
- Test: `tests/integration/debrief-page.test.tsx`

- [ ] **Step 1: Add failing vault and debrief assertions**

Update `tests/integration/vault-page.test.tsx` so dossier cards assert:

- the minutes pill is gone
- complexity renders as `Light`, `Standard`, or `Deep`
- in-progress continuity still appears, but it no longer references a report

Update `tests/integration/debrief-page.test.tsx` so the debrief asserts generic labeled rows such as:

- the prompt text for the graded objective
- the player's submitted answer
- Ashfall's canonical answer
- attempt history items only for graded submissions

- [ ] **Step 2: Run the vault and debrief tests to verify RED**

Run: `pnpm vitest run tests/integration/vault-page.test.tsx tests/integration/debrief-page.test.tsx`

Expected: FAIL because the vault still renders `estimatedMinutes` and the debrief components still assume `suspect` / `motive` / `method`.

- [ ] **Step 3: Implement the stage-aware vault and generic debrief recap**

Update `listAvailableCases()` and the vault page so the dossier record carries:

- `complexity`
- `displayStatus`
- optional continuity summary

and the UI renders a complexity pill instead of `{estimatedMinutes} min`.

Update `getDebrief()` so it returns generic entries for graded objectives:

```ts
type DebriefEntry = {
  label: string;
  playerValue?: string;
  solutionValue: string;
};
```

Then refactor `debrief-report-card.tsx` and `debrief-attempt-history.tsx` to render arrays of labeled rows rather than hardcoded theory fields.

- [ ] **Step 4: Run the vault and debrief tests to verify GREEN**

Run: `pnpm vitest run tests/integration/vault-page.test.tsx tests/integration/debrief-page.test.tsx tests/integration/objective-submission.test.ts`

Expected: PASS, with the vault showing complexity tiers and the debrief comparing objective answers generically.

- [ ] **Step 5: Commit**

```bash
git add src/features/cases/list-available-cases.ts src/app/(shell)/vault/page.tsx src/features/debrief/get-debrief.ts src/features/debrief/components/debrief-report-card.tsx src/features/debrief/components/debrief-attempt-history.tsx src/app/(app)/cases/[caseSlug]/debrief/page.tsx tests/integration/vault-page.test.tsx tests/integration/debrief-page.test.tsx
git commit -m "feat: update vault and debrief for staged cases"
```

## Chunk 5: Browser Verification And Final Validation

### Task 9: Update the browser flows for notes, unlocks, and terminal recap

**Files:**
- Modify: `tests/e2e/workspace.spec.ts`
- Modify: `tests/e2e/debrief.spec.ts`
- Modify: `tests/e2e/retention-loop.spec.ts`
- Test: `tests/e2e/workspace.spec.ts`
- Test: `tests/e2e/debrief.spec.ts`
- Test: `tests/e2e/retention-loop.spec.ts`

- [ ] **Step 1: Write failing Playwright expectations for staged progression**

Update `tests/e2e/workspace.spec.ts` so the primary flow:

- saves notes
- solves an advisory or graded opening objective
- waits for newly unlocked evidence or a newly visible objective prompt
- saves a draft on the next active objective

Update `tests/e2e/debrief.spec.ts` so the solve flow submits the staged objective sequence for `hollow-bishop` and asserts the debrief shows objective prompt labels plus answer comparisons.

Update `tests/e2e/retention-loop.spec.ts` so returning to the vault resumes to `#active-objectives` and not `#draft-report`.

- [ ] **Step 2: Run the browser suite to verify RED**

Run: `pnpm playwright test tests/e2e/workspace.spec.ts tests/e2e/debrief.spec.ts tests/e2e/retention-loop.spec.ts`

Expected: FAIL because the browser suite still targets the fixed report UI and pre-unlock evidence list.

- [ ] **Step 3: Adjust labels and timing only where the browser proves it is necessary**

If Playwright failures surface selector or timing issues:

- tighten role names and headings on the objective cards
- prefer stable text like `Active Objectives`, objective prompts, and `Review Debrief`
- do not add extra UI solely to satisfy the browser unless the expectation reflects the approved spec

- [ ] **Step 4: Run the final verification set**

Run: `pnpm vitest run`

Run: `pnpm validate:cases`

Run: `pnpm playwright test tests/e2e/workspace.spec.ts tests/e2e/debrief.spec.ts tests/e2e/retention-loop.spec.ts`

Expected: PASS across all three commands.

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/workspace.spec.ts tests/e2e/debrief.spec.ts tests/e2e/retention-loop.spec.ts
git commit -m "test: verify staged case progression flows"
```

## Completion Checklist

- [ ] All manifests and protected case payloads use `complexity` plus staged objectives
- [ ] Live cases validate through `pnpm validate:cases`
- [ ] `player_case_objectives` and `objective_submissions` replace the old report-specific progression model
- [ ] Workspace hides locked evidence and renders active objectives by type
- [ ] Vault shows `Light` / `Standard` / `Deep` instead of minutes
- [ ] Debrief compares generic graded-objective answers rather than fixed theory rows
- [ ] Vitest targeted suite passes
- [ ] Playwright staged-flow suite passes
