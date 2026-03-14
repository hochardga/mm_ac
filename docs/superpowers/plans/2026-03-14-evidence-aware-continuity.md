# Evidence-Aware Continuity Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make vault and case reopen flows resume the last viewed evidence artifact, not just the broad section.

**Architecture:** Store the latest viewed evidence id and timestamp on `player_cases`, route all continuity link building through `buildCaseContinuity()`, and teach the case page to resolve evidence from query param first, remembered continuity second, and visible manifest fallback last. Keep persistence logic in a small helper so selection, continuity, and routing responsibilities stay separated.

**Tech Stack:** Next.js App Router, React Server Components, TypeScript, Drizzle ORM, Vitest

---

## Chunk 1: Persist remembered evidence and teach continuity URLs about it

### Task 1: Add player-case storage for remembered evidence

**Files:**
- Modify: `src/db/schema.ts`
- Create: `src/db/migrations/0006_evidence_aware_continuity.sql`
- Create: `src/db/migrations/meta/0006_snapshot.json`
- Modify: `src/db/migrations/meta/_journal.json`
- Test: `tests/unit/schema.test.ts`

- [x] **Step 1: Write the failing schema test expectation**

Add assertions proving `playerCases` exposes `lastViewedEvidenceId` and `lastViewedEvidenceAt`.

```ts
expect(playerCases.lastViewedEvidenceId.name).toBe("last_viewed_evidence_id");
expect(playerCases.lastViewedEvidenceAt.name).toBe("last_viewed_evidence_at");
```

- [x] **Step 2: Run the schema test to verify it fails**

Run: `pnpm test tests/unit/schema.test.ts`
Expected: FAIL because the new columns do not exist yet.

- [x] **Step 3: Add the new schema fields and migration**

Update `player_cases` in `src/db/schema.ts` with nullable text and timestamp columns.
Add the matching SQL migration and metadata snapshot entries for migration `0006_evidence_aware_continuity`.

- [x] **Step 4: Re-run the schema test**

Run: `pnpm test tests/unit/schema.test.ts`
Expected: PASS.

- [x] **Step 5: Commit the storage change**

Run:

```bash
git add src/db/schema.ts src/db/migrations/0006_evidence_aware_continuity.sql src/db/migrations/meta/0006_snapshot.json src/db/migrations/meta/_journal.json tests/unit/schema.test.ts
git commit -m "feat: persist remembered evidence context"
```

### Task 2: Extend continuity URLs with remembered evidence

**Files:**
- Modify: `src/features/cases/case-continuity.ts`
- Test: `tests/unit/case-continuity.test.ts`

- [x] **Step 1: Write failing continuity tests**

Add focused tests proving:
- notes/objectives/report/evidence continuity include `?evidence=<id>` when remembered evidence exists
- debrief continuity remains `/cases/<slug>/debrief`
- evidence continuity uses `lastViewedEvidenceAt` as the activity timestamp when present

Example assertion:

```ts
expect(continuity.href).toBe("/cases/red-harbor?evidence=dispatch-log#field-notes");
```

- [x] **Step 2: Run the continuity tests to verify they fail**

Run: `pnpm test tests/unit/case-continuity.test.ts`
Expected: FAIL because the continuity builder does not accept or include remembered evidence yet.

- [x] **Step 3: Implement the minimal continuity changes**

Update `buildCaseContinuity()` input types and URL generation so:
- non-terminal continuity URLs append the remembered evidence query when present
- timestamps use `lastViewedEvidenceAt` when it is the most recent relevant evidence activity
- debrief URLs stay untouched

- [x] **Step 4: Re-run the continuity tests**

Run: `pnpm test tests/unit/case-continuity.test.ts`
Expected: PASS.

- [x] **Step 5: Commit the continuity change**

Run:

```bash
git add src/features/cases/case-continuity.ts tests/unit/case-continuity.test.ts
git commit -m "feat: add evidence-aware continuity links"
```

## Chunk 2: Resolve remembered evidence on the case page and thread it through vault data

### Task 3: Add a focused helper for remembering valid evidence selections

**Files:**
- Create: `src/features/cases/remember-viewed-evidence.ts`
- Test: `tests/unit/remember-viewed-evidence.test.ts`

- [x] **Step 1: Write the failing helper tests**

Cover:
- persisting a valid evidence id updates both `lastViewedEvidenceId` and `lastViewedEvidenceAt`
- passing a missing player case throws a useful error

Example:

```ts
await rememberViewedEvidence({
  playerCaseId,
  evidenceId: "dispatch-log",
});
```

- [x] **Step 2: Run the helper test to verify it fails**

Run: `pnpm test tests/unit/remember-viewed-evidence.test.ts`
Expected: FAIL because the helper does not exist yet.

- [x] **Step 3: Implement the minimal helper**

Create a server-only helper that updates the owned player-case record with a new evidence id and fresh timestamp, throwing if the player case is missing.

- [x] **Step 4: Re-run the helper test**

Run: `pnpm test tests/unit/remember-viewed-evidence.test.ts`
Expected: PASS.

- [x] **Step 5: Commit the helper**

Run:

```bash
git add src/features/cases/remember-viewed-evidence.ts tests/unit/remember-viewed-evidence.test.ts
git commit -m "feat: add remembered evidence helper"
```

### Task 4: Teach the case page and open-case flow to resolve remembered evidence

**Files:**
- Modify: `src/features/cases/open-case.ts`
- Modify: `src/app/(app)/cases/[caseSlug]/page.tsx`
- Modify: `tests/integration/resume-state.test.ts`
- Modify: `tests/integration/case-workspace-page.test.tsx`

- [x] **Step 1: Write failing integration coverage**

Add tests proving:
- reopening a case with no query param selects the remembered evidence instead of the first evidence item
- invalid remembered evidence falls back to the first visible artifact
- the remembered evidence is exposed from `openCase()` so the page can resolve continuity cleanly

Example route assertion:

```ts
expect(screen.getByText(/active evidence: dispatch log/i)).toBeInTheDocument();
```

- [x] **Step 2: Run the targeted integration tests to verify they fail**

Run: `pnpm test tests/integration/resume-state.test.ts tests/integration/case-workspace-page.test.tsx`
Expected: FAIL because the reopen flow still defaults to the first visible evidence.

- [x] **Step 3: Implement minimal resolution logic**

Update `openCase()` to return remembered evidence metadata from `player_cases`.
Update the case page to:
- resolve explicit query evidence first
- otherwise fall back to remembered evidence when it is still visible
- otherwise use the first visible evidence
- persist the final valid evidence selection through `rememberViewedEvidence()`, but swallow persistence refresh failures so the page still renders

- [x] **Step 4: Re-run the targeted integration tests**

Run: `pnpm test tests/integration/resume-state.test.ts tests/integration/case-workspace-page.test.tsx`
Expected: PASS.

- [x] **Step 5: Commit the reopen-flow change**

Run:

```bash
git add src/features/cases/open-case.ts src/app/(app)/cases/[caseSlug]/page.tsx tests/integration/resume-state.test.ts tests/integration/case-workspace-page.test.tsx
git commit -m "feat: reopen cases on remembered evidence"
```

### Task 5: Thread remembered evidence through the vault continuity surface

**Files:**
- Modify: `src/features/cases/list-available-cases.ts`
- Modify: `src/app/(shell)/vault/page.tsx`
- Modify: `tests/integration/vault-page.test.tsx`

- [x] **Step 1: Write the failing vault test**

Add assertions proving continuity-aware vault actions now include the remembered evidence query string for non-terminal cases while terminal debrief links remain unchanged.

- [x] **Step 2: Run the vault test to verify it fails**

Run: `pnpm test tests/integration/vault-page.test.tsx`
Expected: FAIL because the vault still builds anchor-only continuity links.

- [x] **Step 3: Implement the minimal vault plumbing**

Update `listAvailableCases()` to pass remembered evidence fields into `buildCaseContinuity()`.
Only adjust the vault page if the rendered link expectations require it; avoid cosmetic redesign.

- [x] **Step 4: Re-run the vault test**

Run: `pnpm test tests/integration/vault-page.test.tsx`
Expected: PASS.

- [x] **Step 5: Commit the vault change**

Run:

```bash
git add src/features/cases/list-available-cases.ts src/app/(shell)/vault/page.tsx tests/integration/vault-page.test.tsx
git commit -m "feat: preserve evidence context in vault resume links"
```

## Chunk 3: Full verification and completion

### Task 6: Run focused regression checks, then full verification

**Files:**
- Modify: `docs/superpowers/plans/2026-03-14-evidence-aware-continuity.md`

- [x] **Step 1: Run the focused regression suite**

Run:

```bash
pnpm test tests/unit/schema.test.ts tests/unit/case-continuity.test.ts tests/unit/remember-viewed-evidence.test.ts tests/integration/resume-state.test.ts tests/integration/case-workspace-page.test.tsx tests/integration/vault-page.test.tsx
```

Expected: PASS with the new evidence-aware continuity coverage green.

- [x] **Step 2: Run the full test suite**

Run: `pnpm test`
Expected: PASS.

- [x] **Step 3: Run the required production build**

Run: `pnpm build`
Expected: PASS.

- [x] **Step 4: Update the plan checkboxes to reflect what was executed**

Mark every completed step in this file so the implementation history matches reality.

- [x] **Step 5: Prepare branch completion**

Use `superpowers:finishing-a-development-branch` to push the feature branch and create a PR once tests and build pass.
