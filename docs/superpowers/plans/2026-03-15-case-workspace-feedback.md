# Case Workspace Feedback Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Address the latest user-testing feedback by widening the case workspace, moving all evidence into a modal-only experience, clarifying submission outcomes, reordering progress sections, removing the continuity banner, and marking newly unlocked evidence as new until viewed.

**Architecture:** Keep the current server-first case page and query-param evidence selection model, but replace the inline evidence column with a shared modal shell. Extend player-case persistence with a lightweight viewed-evidence list so the evidence index can derive durable `New` badges without introducing a separate table.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Drizzle ORM, Vitest, Testing Library

---

## Chunk 1: Layout And Evidence Modal

### Task 1: Add failing tests for the modal-first evidence workspace

**Files:**
- Modify: `tests/integration/case-workspace-page.test.tsx`
- Modify: `tests/unit/evidence-index.test.tsx`
- Modify: `tests/unit/photo-evidence-view.test.tsx`

- [ ] **Step 1: Add an integration assertion that the case page no longer renders an inline evidence viewer section by default**

Add expectations that the page still renders the evidence index, notes, and objectives, but evidence content is exposed through dialog-style affordances rather than a permanent middle column.

- [ ] **Step 2: Add unit assertions that evidence index actions are dialog-oriented and can flag newly unlocked entries**

Extend `tests/unit/evidence-index.test.tsx` to cover:

```tsx
expect(screen.getByRole("link", { name: /open dispatch log/i })).toBeInTheDocument();
expect(screen.getByText("New")).toBeInTheDocument();
```

- [ ] **Step 3: Add modal-shell behavior tests for non-photo evidence**

Expand `tests/unit/photo-evidence-view.test.tsx` or add follow-up coverage so the shared modal behavior is not photo-only.

- [ ] **Step 4: Run targeted tests to confirm they fail for the expected reason**

Run:

```bash
pnpm test tests/integration/case-workspace-page.test.tsx tests/unit/evidence-index.test.tsx tests/unit/photo-evidence-view.test.tsx
```

Expected: FAIL because the workspace still renders the inline viewer and the evidence index does not yet expose new-badge or shared modal behavior.

### Task 2: Implement the two-column workspace and shared evidence modal

**Files:**
- Modify: `src/app/(app)/cases/[caseSlug]/page.tsx`
- Modify: `src/features/cases/components/case-workspace.tsx`
- Modify: `src/features/cases/components/evidence-index.tsx`
- Modify: `src/features/cases/components/evidence-viewer.tsx`
- Modify: `src/features/cases/components/photo-evidence-view.tsx`
- Modify: `src/features/cases/components/document-evidence-view.tsx`
- Modify: `src/features/cases/components/thread-evidence-view.tsx`
- Modify: `src/features/cases/components/record-evidence-view.tsx`
- Create: `src/features/cases/components/evidence-dialog.tsx`

- [ ] **Step 1: Widen the case page shell and remove the middle grid column**

Update the case page container from `max-w-5xl` to a wider shell and change `case-workspace.tsx` from a three-column grid to a two-column layout that stacks cleanly on mobile.

- [ ] **Step 2: Introduce a shared dialog shell for evidence rendering**

Create `src/features/cases/components/evidence-dialog.tsx` with a client-side modal wrapper that handles:

```tsx
type EvidenceDialogProps = {
  title: string;
  closeHref: string;
  children: React.ReactNode;
};
```

The dialog should provide consistent overlay, close button, and scroll behavior.

- [ ] **Step 3: Refactor evidence viewers so they can render inside the shared dialog**

Keep the evidence-family-specific content components, but remove duplicated outer-shell layout where necessary so `EvidenceViewer` can mount them inside the shared dialog.

- [ ] **Step 4: Make the evidence index open the selected evidence in the shared modal**

Preserve query-string routing with links like:

```tsx
href={`/cases/${caseSlug}?evidence=${encodeURIComponent(item.id)}`}
```

but update labels and presentation for the modal-first flow.

- [ ] **Step 5: Run the targeted tests and make them pass**

Run:

```bash
pnpm test tests/integration/case-workspace-page.test.tsx tests/unit/evidence-index.test.tsx tests/unit/photo-evidence-view.test.tsx
```

Expected: PASS.

## Chunk 2: Forms, Feedback, And Objective Ordering

### Task 3: Add failing tests for action hierarchy and clearer result feedback

**Files:**
- Modify: `tests/integration/case-workspace-page.test.tsx`
- Modify: `tests/unit/report-action-button.test.tsx`
- Modify: `tests/integration/objective-submission.test.ts`

- [ ] **Step 1: Add assertions for submit-first button ordering in staged objectives and legacy reports**

Assert that submit actions render before save-draft actions and use the stronger visual treatment.

- [ ] **Step 2: Add assertions for explicit success and failure labels in feedback cards**

For objective submissions, add expectations like:

```ts
expect(result.feedback).toMatch(/correct|incorrect|completed/i);
```

If the submission layer should remain text-agnostic, shift these assertions to rendered UI copy in the component tests.

- [ ] **Step 3: Add assertions that completed objectives render above active objectives after success**

Use the staged progression test path to verify the solved section appears first once an objective is solved.

- [ ] **Step 4: Run the targeted tests to verify RED**

Run:

```bash
pnpm test tests/integration/case-workspace-page.test.tsx tests/unit/report-action-button.test.tsx tests/integration/objective-submission.test.ts
```

Expected: FAIL because button emphasis, result labeling, and objective ordering are still using the old UI.

### Task 4: Implement the form and feedback updates

**Files:**
- Modify: `src/features/cases/components/active-objectives-panel.tsx`
- Modify: `src/features/cases/components/report-panel.tsx`
- Modify: `src/features/cases/components/objective-form-fields.tsx`
- Modify: `src/features/cases/components/case-continuity-banner.tsx` or remove its usage from `src/features/cases/components/case-workspace.tsx`

- [ ] **Step 1: Update native select styling for long-answer readability**

Make select controls full-width and less pill-shaped so the closed control behaves better with longer labels.

- [ ] **Step 2: Flip primary and secondary action emphasis**

Render submit buttons first with the filled accent treatment, and downgrade save-draft buttons to the outlined treatment.

- [ ] **Step 3: Make feedback cards outcome-forward**

Render explicit status copy in objective and report feedback cards, for example:

```tsx
const statusLabel = latestSubmission.nextStatus === "in_progress" ? "Incorrect" : "Correct";
```

Use the actual correctness signal available in the component data for staged objectives rather than guessing from copy.

- [ ] **Step 4: Render completed objectives above active objectives**

When `solvedObjectives.length > 0`, place the completed section before the active section while preserving the empty-state behavior.

- [ ] **Step 5: Remove the continuity banner from the workspace**

Delete the rendered `CaseContinuityBanner` block from `case-workspace.tsx` unless another consumer still needs it. Remove the component file only if it becomes unused.

- [ ] **Step 6: Run the targeted tests and make them pass**

Run:

```bash
pnpm test tests/integration/case-workspace-page.test.tsx tests/unit/report-action-button.test.tsx tests/integration/objective-submission.test.ts
```

Expected: PASS.

## Chunk 3: Durable New-Evidence Tracking

### Task 5: Add failing tests for viewed-evidence persistence and new badges

**Files:**
- Modify: `tests/unit/remember-viewed-evidence.test.ts`
- Modify: `tests/unit/open-case.test.ts`
- Modify: `tests/integration/objective-submission.test.ts`
- Modify: `tests/integration/case-workspace-page.test.tsx`

- [ ] **Step 1: Add persistence tests for `viewedEvidenceIds`**

Extend `tests/unit/remember-viewed-evidence.test.ts` to verify that viewing evidence appends ids without losing existing entries.

- [ ] **Step 2: Add open-case expectations for the new field**

Verify newly created player cases initialize with an empty viewed-evidence list.

- [ ] **Step 3: Add progression tests for newly unlocked evidence**

After a successful staged submission unlocks more evidence, assert that the newly visible item is marked `New` until it is opened.

- [ ] **Step 4: Run the targeted tests to verify RED**

Run:

```bash
pnpm test tests/unit/remember-viewed-evidence.test.ts tests/unit/open-case.test.ts tests/integration/objective-submission.test.ts tests/integration/case-workspace-page.test.tsx
```

Expected: FAIL because player cases do not yet persist `viewedEvidenceIds` and the evidence index cannot derive `New` state.

### Task 6: Implement viewed-evidence persistence and badge derivation

**Files:**
- Modify: `src/db/schema.ts`
- Create: `src/db/migrations/0007_viewed_evidence_ids.sql`
- Modify: `src/db/migrations/meta/_journal.json`
- Modify: `src/db/migrations/meta/0006_snapshot.json` or add the next generated snapshot file if this repo tracks a new one
- Modify: `src/features/cases/open-case.ts`
- Modify: `src/features/cases/remember-viewed-evidence.ts`
- Modify: `src/features/cases/components/case-workspace.tsx`
- Modify: `src/features/cases/components/evidence-index.tsx`

- [ ] **Step 1: Add the new database field**

Extend `player_cases` with a JSON-backed `viewedEvidenceIds` column that defaults to an empty array for new rows.

- [ ] **Step 2: Seed and update the field in server workflows**

Initialize the field on player-case creation and update `rememberViewedEvidence` so it appends unique ids while still maintaining `lastViewedEvidenceId` and `lastViewedEvidenceAt`.

- [ ] **Step 3: Derive `New` badge state in the workspace**

Pass the viewed-evidence list into `EvidenceIndex` and compute:

```ts
const isNew = !viewedEvidenceIds.includes(item.id);
```

for visible evidence items.

- [ ] **Step 4: Run targeted tests and make them pass**

Run:

```bash
pnpm test tests/unit/remember-viewed-evidence.test.ts tests/unit/open-case.test.ts tests/integration/objective-submission.test.ts tests/integration/case-workspace-page.test.tsx
```

Expected: PASS.

## Final Verification

### Task 7: Full verification before completion

**Files:**
- Modify as needed based on failures from verification

- [ ] **Step 1: Run the most relevant focused suites**

Run:

```bash
pnpm test tests/integration/case-workspace-page.test.tsx tests/integration/objective-submission.test.ts tests/unit/evidence-index.test.tsx tests/unit/photo-evidence-view.test.tsx tests/unit/remember-viewed-evidence.test.ts tests/unit/open-case.test.ts tests/unit/report-action-button.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Run the production build required by the repo instructions**

Run:

```bash
pnpm build
```

Expected: PASS.

- [ ] **Step 3: Review the resulting diff for accidental churn**

Run:

```bash
git status --short
git diff --stat
```

Expected: only the intended workspace, persistence, test, migration, and docs changes remain.
