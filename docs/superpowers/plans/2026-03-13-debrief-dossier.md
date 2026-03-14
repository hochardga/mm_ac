# Debrief Dossier Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the terminal debrief route into a complete case recap that shows the player's final report, Ashfall's reconstruction, and attempt history.

**Architecture:** Expand `getDebrief()` from a title-and-summary lookup into a terminal recap loader that joins the stored player-case snapshot with authored manifest labels, protected-case answers, and ordered submission history. Then render that richer model on the existing debrief route using small presentational components that preserve the current Ashfall visual language.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS v4, Drizzle ORM, Vitest, Testing Library, Playwright

---

## File Structure

### Create

- `src/features/debrief/components/debrief-report-card.tsx` - Reusable presentational card for a suspect/motive/method theory block.
- `src/features/debrief/components/debrief-attempt-history.tsx` - Terminal recap list for ordered report attempts.
- `tests/integration/debrief-page.test.tsx` - Route-level rendering coverage for solved and closed-unsolved debriefs.
- `tests/e2e/debrief.spec.ts` - Browser flow coverage for the richer terminal recap.
- `docs/superpowers/plans/2026-03-13-debrief-dossier.md` - This implementation plan.

### Modify

- `src/features/debrief/get-debrief.ts` - Return a richer recap object with status, final report, solution, and ordered attempts.
- `src/app/(app)/cases/[caseSlug]/debrief/page.tsx` - Render the new debrief dossier sections.
- `tests/integration/submit-report.test.ts` - Prove the stored debrief snapshot includes the richer recap data after submission.
- `tests/integration/case-navigation.test.tsx` - Keep navigation assertions intact while verifying the debrief still renders as a case route.

## Chunk 1: Terminal Debrief Data Model

### Task 1: Specify the richer recap shape with failing integration tests

**Files:**
- Modify: `tests/integration/submit-report.test.ts`
- Create: `src/features/debrief/get-debrief.ts`
- Test: `tests/integration/submit-report.test.ts`

- [ ] **Step 1: Extend the existing debrief integration test with the new expectations**

Update `tests/integration/submit-report.test.ts` so the solved-case flow asserts that `getDebrief()` now returns:

- `status === "completed"`
- `finalReport` with labeled `suspect`, `motive`, and `method`
- `solution` with the canonical labeled `suspect`, `motive`, and `method`
- `attempts` as an ordered array containing the submitted labels and handler feedback

Add a second test that submits two incorrect attempts and a terminal third miss, then asserts:

- `status === "closed_unsolved"`
- `attempts` length is `3`
- the final attempt remains the player's filed theory while `solution` reflects the canonical answer set

- [ ] **Step 2: Run the integration tests to verify RED**

Run: `pnpm vitest run tests/integration/submit-report.test.ts`

Expected: FAIL because `getDebrief()` currently returns only `title` and `summary`.

- [ ] **Step 3: Implement the richer recap loader in `getDebrief()`**

Update `src/features/debrief/get-debrief.ts` so it:

- loads the `player_cases` row and keeps the current terminal-title/summary guard
- loads the full manifest for human-readable option labels
- loads the protected case for canonical answers
- loads all `report_submissions` for the player case in ascending `attemptNumber`
- maps raw answer ids to labels, falling back to the raw id when a label is missing
- returns a serializable object shaped like:

```ts
type DebriefStatus = "completed" | "closed_unsolved";
type DebriefAttemptStatus = "in_progress" | DebriefStatus;

{
  title: string;
  summary: string;
  status: DebriefStatus;
  finalReport?: {
    suspect: string;
    motive: string;
    method: string;
    attemptNumber: number;
  };
  solution: {
    suspect: string;
    motive: string;
    method: string;
  };
  attempts: Array<{
    attemptNumber: number;
    nextStatus: DebriefAttemptStatus;
    suspect: string;
    motive: string;
    method: string;
    feedback: string;
  }>;
}
```

- [ ] **Step 4: Run the data-model tests to verify GREEN**

Run: `pnpm vitest run tests/integration/submit-report.test.ts tests/integration/resume-state.test.ts`

Expected: PASS, and the existing resume-state behavior stays untouched.

- [ ] **Step 5: Commit**

```bash
git add src/features/debrief/get-debrief.ts tests/integration/submit-report.test.ts
git commit -m "feat: enrich debrief case recap data"
```

## Chunk 2: Debrief Route Presentation

### Task 2: Add route-level rendering coverage for the richer debrief

**Files:**
- Create: `tests/integration/debrief-page.test.tsx`
- Modify: `tests/integration/case-navigation.test.tsx`
- Test: `tests/integration/debrief-page.test.tsx`

- [ ] **Step 1: Write failing debrief page tests**

Create `tests/integration/debrief-page.test.tsx` with two route-level tests:

- solved case: asserts the page shows `Your Final Report`, `Ashfall Reconstruction`, and an attempt history heading with the submitted theory labels
- closed-unsolved case: asserts the page still shows the canonical reconstruction plus the player's final filed theory and terminal feedback

Keep a lightweight navigation assertion in `tests/integration/case-navigation.test.tsx` proving the case-route shell still shows `Back to Vault` and only one `<h1>`.

- [ ] **Step 2: Run the page tests to verify RED**

Run: `pnpm vitest run tests/integration/debrief-page.test.tsx tests/integration/case-navigation.test.tsx`

Expected: FAIL because the debrief page still renders only the header block.

- [ ] **Step 3: Implement the dossier presentation**

Create `src/features/debrief/components/debrief-report-card.tsx` as a focused presentational component that renders:

- a section heading
- optional attempt/status metadata
- labeled rows for suspect, motive, and method

Create `src/features/debrief/components/debrief-attempt-history.tsx` as a focused list component that renders:

- one card per attempt
- attempt number
- result label
- submitted theory labels
- handler feedback

Update `src/app/(app)/cases/[caseSlug]/debrief/page.tsx` to:

- keep the current auth and case-resolution checks
- render an outcome panel that varies copy based on `debrief.status`
- render `Your Final Report` and `Ashfall Reconstruction` side by side on large screens
- render the attempt-history component when attempts exist

- [ ] **Step 4: Run the page tests to verify GREEN**

Run: `pnpm vitest run tests/integration/debrief-page.test.tsx tests/integration/case-navigation.test.tsx tests/integration/submit-report.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/(app)/cases/[caseSlug]/debrief/page.tsx src/features/debrief/components/debrief-report-card.tsx src/features/debrief/components/debrief-attempt-history.tsx tests/integration/debrief-page.test.tsx tests/integration/case-navigation.test.tsx
git commit -m "feat: render debrief dossier recap"
```

## Chunk 3: Browser Verification

### Task 3: Prove the richer recap in a real terminal flow

**Files:**
- Create: `tests/e2e/debrief.spec.ts`
- Test: `tests/e2e/debrief.spec.ts`

- [ ] **Step 1: Write the failing Playwright test**

Create `tests/e2e/debrief.spec.ts` with a solved-case flow that:

- completes intake
- opens `hollow-bishop`
- submits the canonical answer set
- waits for the debrief route
- asserts the page shows `Your Final Report`, `Ashfall Reconstruction`, the selected suspect/motive/method labels, and the attempt history

- [ ] **Step 2: Run the Playwright spec to verify RED**

Run: `pnpm playwright test tests/e2e/debrief.spec.ts`

Expected: FAIL because the richer debrief surface is not rendered yet.

- [ ] **Step 3: Adjust only what the browser test proves is necessary**

If the Playwright failure surfaces route-level or semantic gaps:

- refine headings or section labels for stable browser assertions
- keep the design aligned with the spec and avoid extra UI additions

- [ ] **Step 4: Run the final verification set**

Run: `pnpm vitest run tests/integration/submit-report.test.ts tests/integration/debrief-page.test.tsx tests/integration/case-navigation.test.tsx`

Run: `pnpm playwright test tests/e2e/debrief.spec.ts`

Expected: PASS across both commands.

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/debrief.spec.ts
git commit -m "test: cover debrief dossier flow"
```

## Completion Checklist

- [ ] `getDebrief()` returns a stable richer recap model for terminal cases
- [ ] The debrief page presents outcome, final report, reconstruction, and attempts
- [ ] Solved and closed-unsolved cases both render correctly
- [ ] Vitest integration coverage passes
- [ ] Playwright debrief coverage passes
