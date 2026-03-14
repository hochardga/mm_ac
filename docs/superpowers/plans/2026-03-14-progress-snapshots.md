# Progress Snapshots Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add staged-case progress snapshots to the vault and case workspace so returning players can immediately understand current focus, progress, and unlocked evidence.

**Architecture:** Extend the existing staged progression helper to derive a reusable snapshot view model, then render that snapshot in the vault and case workspace with the existing Ashfall visual language. Keep the change read-only and manifest-driven so the feature works from existing case data and respects pinned revisions.

**Tech Stack:** Next.js App Router, React Server Components, TypeScript, Drizzle ORM, Vitest, Playwright

---

## Chunk 1: Progress View Model

### Task 1: Add failing unit coverage for staged progress snapshots

**Files:**
- Modify: `tests/unit/case-progression.test.ts`
- Modify: `src/features/cases/case-progression.ts`

- [ ] **Step 1: Write the failing test**

Add focused tests in `tests/unit/case-progression.test.ts` that assert:

- a staged case exposes a snapshot with stage counts, objective counts, visible evidence count, and the next active objective prompt
- the focus stage advances after a solved objective unlocks the next stage
- completed staged cases fall back to the last visible stage in the snapshot

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest tests/unit/case-progression.test.ts`
Expected: FAIL because `buildCaseProgression()` does not yet expose snapshot metadata.

- [ ] **Step 3: Write minimal implementation**

Extend `src/features/cases/case-progression.ts` so `buildCaseProgression()` returns a `snapshot` object for staged manifests. Keep the new data derived from existing visible stages and objective states only.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest tests/unit/case-progression.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/unit/case-progression.test.ts src/features/cases/case-progression.ts
git commit -m "feat: derive staged progress snapshots"
```

### Task 2: Add pinned-revision vault data for staged snapshots

**Files:**
- Modify: `src/features/cases/list-available-cases.ts`
- Modify: `tests/integration/vault-page.test.tsx`

- [ ] **Step 1: Write the failing test**

Update `tests/integration/vault-page.test.tsx` to assert that staged dossier cards render snapshot content based on the player’s staged progress, including stage position and the active objective prompt.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest tests/integration/vault-page.test.tsx`
Expected: FAIL because vault records do not yet expose staged snapshot data and the page does not render it.

- [ ] **Step 3: Write minimal implementation**

Update `src/features/cases/list-available-cases.ts` to load the player’s pinned manifest revision when a player case exists, derive the staged snapshot from that manifest plus saved objective rows, and attach it to the vault dossier view model.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest tests/integration/vault-page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/cases/list-available-cases.ts tests/integration/vault-page.test.tsx
git commit -m "feat: add staged progress data to vault dossiers"
```

## Chunk 2: Shared UI Rendering

### Task 3: Add a reusable staged progress snapshot component

**Files:**
- Create: `src/features/cases/components/staged-progress-snapshot.tsx`
- Modify: `src/features/cases/components/case-workspace.tsx`
- Modify: `src/app/(shell)/vault/page.tsx`

- [ ] **Step 1: Write the failing test**

Add rendering assertions through the page-level integration tests instead of a separate component test so the UI is verified in its real server-rendered context.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest tests/integration/vault-page.test.tsx tests/integration/case-workspace-page.test.tsx`
Expected: FAIL because neither page renders a progress snapshot yet.

- [ ] **Step 3: Write minimal implementation**

Create `src/features/cases/components/staged-progress-snapshot.tsx` with compact props for label, focus stage, counts, and next active objective. Render a vault-friendly variant and a fuller workspace variant without introducing client-side state.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest tests/integration/vault-page.test.tsx tests/integration/case-workspace-page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/cases/components/staged-progress-snapshot.tsx src/features/cases/components/case-workspace.tsx src/app/\(shell\)/vault/page.tsx tests/integration/vault-page.test.tsx tests/integration/case-workspace-page.test.tsx
git commit -m "feat: render staged progress snapshots"
```

### Task 4: Cover the workspace header snapshot state changes

**Files:**
- Modify: `tests/integration/case-workspace-page.test.tsx`
- Modify: `tests/e2e/workspace.spec.ts`
- Modify: `src/app/(app)/cases/[caseSlug]/page.tsx`
- Modify: `src/components/case-return-header.tsx`

- [ ] **Step 1: Write the failing test**

Add assertions that the case page shows the progress snapshot near the header and that the focus stage changes after the first Hollow Bishop objective is solved.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest tests/integration/case-workspace-page.test.tsx`
Expected: FAIL because the header currently has no staged snapshot content.

- [ ] **Step 3: Write minimal implementation**

Pass snapshot data from the case page into the header or nearby workspace presentation and ensure the focus stage copy updates when staged progression changes.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest tests/integration/case-workspace-page.test.tsx`
Expected: PASS

- [ ] **Step 5: Add targeted browser coverage**

Update `tests/e2e/workspace.spec.ts` so the staged workspace flow verifies the snapshot text before and after unlocking the second stage.

- [ ] **Step 6: Run browser test**

Run: `pnpm playwright test tests/e2e/workspace.spec.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add tests/integration/case-workspace-page.test.tsx tests/e2e/workspace.spec.ts src/app/\(app\)/cases/\[caseSlug\]/page.tsx src/components/case-return-header.tsx
git commit -m "feat: add staged case header progress snapshot"
```

## Chunk 3: Full Verification and Handoff

### Task 5: Run final verification and prepare the PR

**Files:**
- Review: `docs/superpowers/specs/2026-03-14-progress-snapshots-design.md`
- Review: `docs/superpowers/plans/2026-03-14-progress-snapshots.md`

- [ ] **Step 1: Run focused automated checks**

Run:

```bash
pnpm vitest tests/unit/case-progression.test.ts tests/integration/vault-page.test.tsx tests/integration/case-workspace-page.test.tsx
pnpm playwright test tests/e2e/workspace.spec.ts
```

Expected: PASS

- [ ] **Step 2: Run the required production build**

Run: `pnpm build`
Expected: PASS

- [ ] **Step 3: Inspect git state**

Run: `git status --short`
Expected: only the intended branch changes remain.

- [ ] **Step 4: Push branch**

Run: `git push -u origin codex/progress-snapshots`
Expected: remote branch created successfully.

- [ ] **Step 5: Open pull request**

Run:

```bash
gh pr create --base main --head codex/progress-snapshots --title "feat: add staged progress snapshots" --body-file .git/PR_BODY_PROGRESS_SNAPSHOTS.md
```

Expected: PR URL returned.

- [ ] **Step 6: Record the result**

Capture the verification commands run, the PR URL, and any residual risks in the final handoff note.
