# Investigation Board Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent investigation board so each player can pin important evidence inside a case and reopen those artifacts quickly.

**Architecture:** The feature adds one new bookmark persistence table plus focused server helpers for listing and toggling evidence pins. The case page loads bookmark state alongside the existing manifest and progression data, while the workspace renders a dedicated board panel and a selected-evidence pin toggle without changing case progression or notes behavior.

**Tech Stack:** Next.js App Router, React Server Components, server actions, Drizzle ORM, Vitest, PGlite/Postgres migrations

---

## File Structure

### Persistence and server helpers

- Create: `src/db/migrations/0007_investigation_board.sql`
- Create: `src/db/migrations/meta/0007_snapshot.json`
- Modify: `src/db/migrations/meta/_journal.json`
- Modify: `src/db/schema.ts`
- Create: `src/features/cases/evidence-bookmarks.ts`
- Test: `tests/unit/evidence-bookmarks.test.ts`

### Case-page plumbing and actions

- Modify: `src/app/(app)/cases/[caseSlug]/actions.ts`
- Modify: `src/app/(app)/cases/[caseSlug]/page.tsx`
- Modify: `tests/unit/case-actions.test.ts`

### Workspace UI

- Create: `src/features/cases/components/investigation-board-panel.tsx`
- Create: `src/features/cases/components/evidence-bookmark-button.tsx`
- Modify: `src/features/cases/components/case-workspace.tsx`
- Modify: `src/features/cases/components/evidence-viewer.tsx`
- Test: `tests/integration/case-workspace-page.test.tsx`

## Chunk 1: Persistence and Actions

### Task 1: Add bookmark persistence and toggle helpers

**Files:**

- Create: `tests/unit/evidence-bookmarks.test.ts`
- Create: `src/features/cases/evidence-bookmarks.ts`
- Modify: `src/db/schema.ts`
- Create: `src/db/migrations/0007_investigation_board.sql`
- Create: `src/db/migrations/meta/0007_snapshot.json`
- Modify: `src/db/migrations/meta/_journal.json`

- [ ] **Step 1: Write the failing bookmark persistence tests**

```ts
test("adds a bookmark row the first time evidence is pinned", async () => {
  const result = await toggleEvidenceBookmark({
    playerCaseId,
    evidenceId: "vestry-interview",
  });

  expect(result.bookmarked).toBe(true);
  expect(result.bookmarks.map((bookmark) => bookmark.evidenceId)).toEqual([
    "vestry-interview",
  ]);
});

test("removes the bookmark row when the same evidence is toggled again", async () => {
  await toggleEvidenceBookmark({
    playerCaseId,
    evidenceId: "vestry-interview",
  });

  const result = await toggleEvidenceBookmark({
    playerCaseId,
    evidenceId: "vestry-interview",
  });

  expect(result.bookmarked).toBe(false);
  expect(result.bookmarks).toHaveLength(0);
});
```

- [ ] **Step 2: Run the unit test to verify RED**

Run: `pnpm vitest tests/unit/evidence-bookmarks.test.ts`
Expected: FAIL because `toggleEvidenceBookmark` and the bookmark table/schema do not exist yet.

- [ ] **Step 3: Add the schema and migration**

Implement the new `player_case_evidence_bookmarks` table with:

- `id`
- `playerCaseId` foreign key to `player_cases`
- `evidenceId`
- `createdAt`
- unique constraint on `(playerCaseId, evidenceId)`

Also register the new relation from `playerCases`.

- [ ] **Step 4: Implement the bookmark helper**

Build `src/features/cases/evidence-bookmarks.ts` with two focused exports:

- `listEvidenceBookmarks({ playerCaseId })`
- `toggleEvidenceBookmark({ playerCaseId, evidenceId })`

The toggle helper should return both the final `bookmarked` boolean and the updated bookmark rows for that case so callers can assert the final state directly.

- [ ] **Step 5: Run the unit test to verify GREEN**

Run: `pnpm vitest tests/unit/evidence-bookmarks.test.ts`
Expected: PASS with both bookmark toggle tests green.

- [ ] **Step 6: Commit**

```bash
git add tests/unit/evidence-bookmarks.test.ts src/features/cases/evidence-bookmarks.ts src/db/schema.ts src/db/migrations/0007_investigation_board.sql src/db/migrations/meta/0007_snapshot.json src/db/migrations/meta/_journal.json
git commit -m "feat: add investigation board persistence"
```

### Task 2: Add bookmark action handling and case-page loading

**Files:**

- Modify: `src/app/(app)/cases/[caseSlug]/actions.ts`
- Modify: `src/app/(app)/cases/[caseSlug]/page.tsx`
- Modify: `tests/unit/case-actions.test.ts`

- [ ] **Step 1: Extend the action tests first**

Add failing tests that verify:

- bookmark action redirects back to `/cases/<slug>?evidence=<encoded-id>`
- bookmark action rejects requests for another player's case

Use the same redirect assertion style already present in `tests/unit/case-actions.test.ts`.

- [ ] **Step 2: Run the action test to verify RED**

Run: `pnpm vitest tests/unit/case-actions.test.ts`
Expected: FAIL because the bookmark action does not exist yet.

- [ ] **Step 3: Implement bookmark action plumbing**

Add a new server action that:

- reads `caseSlug`, `playerCaseId`, `selectedEvidenceId`, and `evidenceId`
- calls `requireOwnedPlayerCase`
- toggles the bookmark through `toggleEvidenceBookmark`
- redirects back to the selected evidence route

Then update the case page loader to fetch bookmark rows for the current `playerCaseId`, filter them against the current visible evidence set, and pass them into `CaseWorkspace`.

- [ ] **Step 4: Run the action test to verify GREEN**

Run: `pnpm vitest tests/unit/case-actions.test.ts`
Expected: PASS with the bookmark redirect and authorization coverage added.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(app)/cases/[caseSlug]/actions.ts" "src/app/(app)/cases/[caseSlug]/page.tsx" tests/unit/case-actions.test.ts
git commit -m "feat: load investigation board state on case pages"
```

## Chunk 2: Workspace UI and Verification

### Task 3: Render the Investigation Board and pin toggle

**Files:**

- Create: `src/features/cases/components/investigation-board-panel.tsx`
- Create: `src/features/cases/components/evidence-bookmark-button.tsx`
- Modify: `src/features/cases/components/case-workspace.tsx`
- Modify: `src/features/cases/components/evidence-viewer.tsx`
- Modify: `tests/integration/case-workspace-page.test.tsx`

- [ ] **Step 1: Add the failing workspace integration coverage**

Add tests for:

- empty board copy when nothing is pinned
- pinned evidence card rendering when a bookmark row exists
- pin toggle label switching between `Pin to Board` and `Remove from Board`
- stale bookmark ids not rendering in the board

Example assertion shape:

```ts
expect(screen.getByRole("heading", { name: /investigation board/i })).toBeInTheDocument();
expect(screen.getByRole("button", { name: /pin to board/i })).toBeInTheDocument();
```

- [ ] **Step 2: Run the integration test to verify RED**

Run: `pnpm vitest tests/integration/case-workspace-page.test.tsx`
Expected: FAIL because the Investigation Board UI and bookmark button are not rendered yet.

- [ ] **Step 3: Implement the workspace UI**

Build the UI with these boundaries:

- `EvidenceBookmarkButton` renders the form/button for the active evidence
- `InvestigationBoardPanel` renders empty and populated board states
- `EvidenceViewer` receives `playerCaseId`, `selectedEvidenceId`, and `bookmarkedEvidenceIds`
- `CaseWorkspace` composes the board between notes and objectives/report content

Keep the board server-rendered and route-driven, matching the rest of the case workspace.

- [ ] **Step 4: Run the integration test to verify GREEN**

Run: `pnpm vitest tests/integration/case-workspace-page.test.tsx`
Expected: PASS with the new board and toggle coverage green.

- [ ] **Step 5: Commit**

```bash
git add src/features/cases/components/investigation-board-panel.tsx src/features/cases/components/evidence-bookmark-button.tsx src/features/cases/components/case-workspace.tsx src/features/cases/components/evidence-viewer.tsx tests/integration/case-workspace-page.test.tsx
git commit -m "feat: render investigation board in case workspace"
```

### Task 4: Run focused verification and final build

**Files:**

- Verify only: no planned source changes

- [ ] **Step 1: Run the focused automated checks**

Run: `pnpm vitest tests/unit/evidence-bookmarks.test.ts tests/unit/case-actions.test.ts tests/integration/case-workspace-page.test.tsx`
Expected: PASS with 0 failing tests.

- [ ] **Step 2: Run the required production build**

Run: `pnpm build`
Expected: PASS with exit code 0.

- [ ] **Step 3: Review the final diff**

Run: `git status --short && git diff --stat main...HEAD`
Expected: only Investigation Board files and tests appear.

- [ ] **Step 4: Commit any final polish if needed**

```bash
git add -A
git commit -m "test: finalize investigation board coverage"
```

Only create this commit if verification work required source changes.
