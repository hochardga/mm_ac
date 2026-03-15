# Live Attempt Ledger Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a staged-case live attempt ledger that shows readable submission history and remaining graded-failure budget while an investigation is still open.

**Architecture:** Extract staged-answer formatting into a shared helper, build a server-safe review-state helper that summarizes failure pressure and objective attempts, then thread that review state into the staged objective panel on the case page. Keep legacy report cases unchanged.

**Tech Stack:** Next.js App Router, React Server Components, Drizzle ORM, Vitest, Testing Library

---

## File Structure

### Shared staged-answer and review-state helpers

- Create: `src/features/cases/format-staged-answer.ts`
- Create: `src/features/cases/objective-review-state.ts`
- Create: `tests/unit/format-staged-answer.test.ts`
- Create: `tests/unit/objective-review-state.test.ts`
- Modify: `src/features/debrief/get-debrief.ts`

### Case workspace integration

- Modify: `src/app/(app)/cases/[caseSlug]/page.tsx`
- Modify: `src/features/cases/components/case-workspace.tsx`
- Modify: `src/features/cases/components/active-objectives-panel.tsx`
- Modify: `tests/integration/case-workspace-page.test.tsx`

## Chunk 1: Shared Staged-Answer Formatting

### Task 1: Extract staged-answer formatting from debrief logic

**Files:**

- Create: `tests/unit/format-staged-answer.test.ts`
- Create: `src/features/cases/format-staged-answer.ts`
- Modify: `src/features/debrief/get-debrief.ts`

- [ ] **Step 1: Write the failing formatter unit tests**

Cover:

- boolean objectives render `Yes` and `No`
- single-choice objectives resolve authored option labels
- multi-choice objectives join multiple authored option labels
- code-entry objectives return the entered text unchanged
- unknown option ids fall back to raw ids

- [ ] **Step 2: Run the formatter test to verify RED**

Run: `pnpm vitest tests/unit/format-staged-answer.test.ts`
Expected: FAIL because `formatStagedAnswer` does not exist yet outside debrief logic.

- [ ] **Step 3: Implement the shared formatter**

Create `src/features/cases/format-staged-answer.ts` with a reusable `formatStagedAnswer` helper for staged objectives. Move the current formatting behavior out of `get-debrief.ts` without changing visible output.

- [ ] **Step 4: Update debrief to use the shared formatter**

Replace the local `formatStagedAnswer` implementation in `src/features/debrief/get-debrief.ts` with an import from the new shared helper.

- [ ] **Step 5: Run the formatter and debrief tests to verify GREEN**

Run: `pnpm vitest tests/unit/format-staged-answer.test.ts tests/integration/debrief-page.test.tsx`
Expected: PASS with the shared helper covered and debrief behavior unchanged.

- [ ] **Step 6: Commit**

```bash
git add tests/unit/format-staged-answer.test.ts src/features/cases/format-staged-answer.ts src/features/debrief/get-debrief.ts
git commit -m "feat: share staged answer formatting"
```

## Chunk 2: Review-State Derivation

### Task 2: Build the live review-state helper

**Files:**

- Create: `tests/unit/objective-review-state.test.ts`
- Create: `src/features/cases/objective-review-state.ts`

- [ ] **Step 1: Write the failing review-state unit tests**

Cover:

- failure-budget summary from `gradedFailureCount` and `maxGradedFailures`
- latest graded feedback selection from objective submission rows
- per-objective attempt history with formatted answers and status labels
- graceful handling when an objective has no submissions

Example assertion shape:

```ts
expect(result.failureBudget).toEqual({
  spent: 1,
  max: 3,
  remaining: 2,
  summaryLabel: "2 safe graded submissions remain",
});
expect(result.attemptsByObjective.get("identify-poisoner")).toEqual([
  {
    attemptNumber: 1,
    answerLabel: "Groundskeeper Bram Yates",
    statusLabel: "Incorrect",
    feedback: "Incorrect graded objective submission.",
  },
]);
```

- [ ] **Step 2: Run the review-state test to verify RED**

Run: `pnpm vitest tests/unit/objective-review-state.test.ts`
Expected: FAIL because the helper does not exist yet.

- [ ] **Step 3: Implement `buildObjectiveReviewState`**

Create a helper that accepts:

- staged manifest
- objective submission rows
- `gradedFailureCount`
- `maxGradedFailures`

Return:

- `failureBudget`
- `latestGradedFeedback`
- `attemptsByObjective`

Use the shared staged-answer formatter to keep labels consistent with debrief output.

- [ ] **Step 4: Run the review-state unit test to verify GREEN**

Run: `pnpm vitest tests/unit/objective-review-state.test.ts`
Expected: PASS with failure-pressure and attempt-ledger behavior covered.

- [ ] **Step 5: Commit**

```bash
git add tests/unit/objective-review-state.test.ts src/features/cases/objective-review-state.ts
git commit -m "feat: add objective review state"
```

## Chunk 3: Workspace UI Integration

### Task 3: Extend case-page integration coverage first

**Files:**

- Modify: `tests/integration/case-workspace-page.test.tsx`

- [ ] **Step 1: Add failing integration assertions for staged live review**

Add coverage that verifies:

- the case page renders a pressure summary for staged cases
- the summary reflects seeded graded failures
- previous objective submissions appear with readable answers and feedback
- the completed objective section still renders correctly when solved objectives exist

- [ ] **Step 2: Run the case-workspace test to verify RED**

Run: `pnpm vitest tests/integration/case-workspace-page.test.tsx`
Expected: FAIL because the workspace does not yet render the live attempt ledger or pressure summary.

### Task 4: Thread review state into the staged objective panel

**Files:**

- Modify: `src/app/(app)/cases/[caseSlug]/page.tsx`
- Modify: `src/features/cases/components/case-workspace.tsx`
- Modify: `src/features/cases/components/active-objectives-panel.tsx`

- [ ] **Step 1: Load staged protected grading data in the case page**

For staged manifests, load the staged protected case alongside the existing manifest data so the page has `maxGradedFailures` available.

- [ ] **Step 2: Build review state on the server**

Use `buildObjectiveReviewState` with:

- staged manifest
- objective submission rows
- `playerCase.gradedFailureCount`
- staged protected grading config

Pass the resulting data into `CaseWorkspace`.

- [ ] **Step 3: Thread the new props through `CaseWorkspace`**

Add an optional staged-review-state prop and pass it only to `ActiveObjectivesPanel`.

- [ ] **Step 4: Render the pressure summary and attempt ledger**

Update `ActiveObjectivesPanel` to:

- render a compact pressure card above the objective cards
- show the latest graded feedback when present
- render formatted attempt history for objectives with prior submissions
- keep solved-objective rendering intact

- [ ] **Step 5: Run the case-workspace integration test to verify GREEN**

Run: `pnpm vitest tests/integration/case-workspace-page.test.tsx`
Expected: PASS with staged live-review scenarios green.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(app)/cases/[caseSlug]/page.tsx" src/features/cases/components/case-workspace.tsx src/features/cases/components/active-objectives-panel.tsx tests/integration/case-workspace-page.test.tsx
git commit -m "feat: add live attempt ledger to staged cases"
```

## Chunk 4: Final Verification

### Task 5: Run focused verification and required build

**Files:**

- Verify only: no planned source changes

- [ ] **Step 1: Run focused tests**

Run: `pnpm vitest tests/unit/format-staged-answer.test.ts tests/unit/objective-review-state.test.ts tests/integration/case-workspace-page.test.tsx tests/integration/debrief-page.test.tsx`
Expected: PASS with 0 failing tests.

- [ ] **Step 2: Run the required production build**

Run: `pnpm build`
Expected: PASS with exit code 0.

- [ ] **Step 3: Review the final diff**

Run: `git status --short && git diff --stat main...HEAD`
Expected: only live attempt ledger docs, shared helpers, case workspace changes, and tests appear.

- [ ] **Step 4: Commit final polish only if needed**

```bash
git add -A
git commit -m "test: finalize live attempt ledger coverage"
```

Only create this commit if verification uncovered additional edits not already committed.
