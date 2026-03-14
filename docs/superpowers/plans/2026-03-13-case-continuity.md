# Case Continuity Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make returning Ashfall players see where to resume from the vault and confirm restored progress inside the case workspace.

**Architecture:** Add one shared continuity-summary helper that derives resume copy, destinations, and timestamps from existing player-case, note, draft, and submission data. Reuse that summary in two places: the vault dossier cards for better CTAs and the case workspace for a small restoration banner plus stable section anchors.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS v4, Drizzle ORM, Vitest, Testing Library, Playwright

---

## File Structure

### Create

- `src/features/cases/case-continuity.ts` - Shared continuity-summary helper plus timestamp formatting helper for vault and workspace surfaces.
- `src/features/cases/components/case-continuity-banner.tsx` - Small presentational banner for reopened in-progress cases.
- `tests/unit/case-continuity.test.ts` - Unit coverage for continuity-priority rules and destinations.
- `docs/superpowers/plans/2026-03-13-case-continuity.md` - This implementation plan.

### Modify

- `src/features/cases/open-case.ts` - Reuse the shared helper when building `resumeTarget`.
- `src/features/cases/list-available-cases.ts` - Include continuity metadata on dossier records without creating side effects.
- `src/app/(shell)/vault/page.tsx` - Render continuity copy, timestamps, and smarter CTAs on dossier cards.
- `src/app/(app)/cases/[caseSlug]/page.tsx` - Pass the continuity summary into the workspace.
- `src/features/cases/components/case-workspace.tsx` - Render the restoration banner and wire section anchors.
- `src/features/cases/components/evidence-index.tsx` - Add the `evidence-intake` anchor target.
- `src/features/cases/components/case-notes-panel.tsx` - Add the `field-notes` anchor target.
- `src/features/cases/components/report-panel.tsx` - Add the `draft-report` anchor target.
- `tests/integration/vault-page.test.tsx` - Cover in-progress and terminal vault continuity cues.
- `tests/integration/case-workspace-page.test.tsx` - Cover restoration-banner visibility and anchor links.
- `tests/e2e/retention-loop.spec.ts` - Verify the end-to-end resume loop through the vault.

## Chunk 1: Shared Continuity Summary And Vault CTA Logic

### Task 1: Write the continuity-summary rules first

**Files:**
- Create: `tests/unit/case-continuity.test.ts`
- Create: `src/features/cases/case-continuity.ts`
- Modify: `src/features/cases/open-case.ts`
- Test: `tests/unit/case-continuity.test.ts`

- [ ] **Step 1: Write the failing helper tests**

```ts
import { describe, expect, test } from "vitest";

import { buildCaseContinuity } from "@/features/cases/case-continuity";

describe("buildCaseContinuity", () => {
  test("returns a report resume target when a saved draft exists", () => {
    const continuity = buildCaseContinuity({
      caseSlug: "hollow-bishop",
      status: "in_progress",
      note: undefined,
      draft: {
        suspectId: "bookkeeper",
        motiveId: "embezzlement",
        methodId: "poisoned-wine",
        attemptCount: 1,
        updatedAt: new Date("2026-03-13T18:00:00.000Z"),
      },
      latestSubmission: undefined,
      playerCaseUpdatedAt: new Date("2026-03-13T17:00:00.000Z"),
    });

    expect(continuity.section).toBe("report");
    expect(continuity.label).toMatch(/resume report/i);
    expect(continuity.href).toBe("/cases/hollow-bishop#draft-report");
  });

  test("returns a notes resume target when notes exist without a draft", () => {
    const continuity = buildCaseContinuity({
      caseSlug: "red-harbor",
      status: "in_progress",
      note: {
        body: "Recheck the harbor log.",
        updatedAt: new Date("2026-03-13T19:00:00.000Z"),
      },
      draft: undefined,
      latestSubmission: undefined,
      playerCaseUpdatedAt: new Date("2026-03-13T17:00:00.000Z"),
    });

    expect(continuity.section).toBe("notes");
    expect(continuity.href).toBe("/cases/red-harbor#field-notes");
  });

  test("prefers the debrief destination for completed cases", () => {
    const continuity = buildCaseContinuity({
      caseSlug: "briar-ledger",
      status: "completed",
      note: undefined,
      draft: undefined,
      latestSubmission: undefined,
      playerCaseUpdatedAt: new Date("2026-03-13T17:00:00.000Z"),
    });

    expect(continuity.section).toBe("debrief");
    expect(continuity.label).toMatch(/review debrief/i);
    expect(continuity.href).toBe("/cases/briar-ledger/debrief");
  });
});
```

- [ ] **Step 2: Run the tests to verify RED**

Run: `pnpm vitest run tests/unit/case-continuity.test.ts`

Expected: FAIL because `buildCaseContinuity()` does not exist yet.

- [ ] **Step 3: Implement the minimal helper and reuse it in `openCase()`**

Create `src/features/cases/case-continuity.ts` with one exported helper that:

- accepts `caseSlug`, `status`, `note`, `draft`, `latestSubmission`, and `playerCaseUpdatedAt`
- prioritizes `debrief` for `completed` and `closed_unsolved`
- prioritizes `report` when a draft exists
- prioritizes `notes` when only a note exists
- otherwise falls back to `evidence`
- returns `section`, `label`, `description`, `href`, and `lastActivityAt`

Then update `src/features/cases/open-case.ts` so `buildResumeTarget()` calls the helper and maps its `section` and timestamp back into the existing reopen payload.

- [ ] **Step 4: Run the helper tests to verify GREEN**

Run: `pnpm vitest run tests/unit/case-continuity.test.ts tests/integration/resume-state.test.ts`

Expected: PASS, and the existing reopen integration test still stays green.

- [ ] **Step 5: Commit**

```bash
git add src/features/cases/case-continuity.ts src/features/cases/open-case.ts tests/unit/case-continuity.test.ts
git commit -m "feat: add shared case continuity summary"
```

### Task 2: Expose continuity on the vault

**Files:**
- Modify: `src/features/cases/list-available-cases.ts`
- Modify: `src/app/(shell)/vault/page.tsx`
- Modify: `tests/integration/vault-page.test.tsx`
- Test: `tests/integration/vault-page.test.tsx`

- [ ] **Step 1: Extend the vault integration test with failing expectations**

Add a test that seeds:

- one in-progress case with a saved draft
- one in-progress case with saved notes only
- one completed case

Then assert:

- the draft case shows `Resume Report` and links to `/cases/<slug>#draft-report`
- the notes case shows `Resume Notes` and links to `/cases/<slug>#field-notes`
- the completed case shows `Review Debrief` and links to `/cases/<slug>/debrief`

- [ ] **Step 2: Run the vault test to verify RED**

Run: `pnpm vitest run tests/integration/vault-page.test.tsx`

Expected: FAIL because dossier records and the vault page do not expose continuity copy yet.

- [ ] **Step 3: Implement the vault-facing continuity data and rendering**

Update `src/features/cases/list-available-cases.ts` to:

- load the player-case's saved note, saved draft, and latest submission alongside each definition
- call `buildCaseContinuity()` when a player-case exists
- add that continuity object to the returned `VaultCaseRecord`

Update `src/app/(shell)/vault/page.tsx` to:

- switch the primary CTA label and `href` based on the continuity object
- render the continuity description and formatted last-activity line when continuity exists
- keep the current generic card for first-open cases and unavailable cases

- [ ] **Step 4: Run the vault tests to verify GREEN**

Run: `pnpm vitest run tests/unit/case-continuity.test.ts tests/integration/vault-page.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/cases/list-available-cases.ts src/app/(shell)/vault/page.tsx tests/integration/vault-page.test.tsx
git commit -m "feat: add continuity cues to vault dossiers"
```

## Chunk 2: Workspace Restoration Banner And Anchors

### Task 3: Add stable section anchors and a restoration surface

**Files:**
- Create: `src/features/cases/components/case-continuity-banner.tsx`
- Modify: `src/app/(app)/cases/[caseSlug]/page.tsx`
- Modify: `src/features/cases/components/case-workspace.tsx`
- Modify: `src/features/cases/components/evidence-index.tsx`
- Modify: `src/features/cases/components/case-notes-panel.tsx`
- Modify: `src/features/cases/components/report-panel.tsx`
- Modify: `tests/integration/case-workspace-page.test.tsx`
- Test: `tests/integration/case-workspace-page.test.tsx`

- [ ] **Step 1: Add failing workspace expectations**

Extend `tests/integration/case-workspace-page.test.tsx` with a case that seeds a saved note or saved draft, renders `CasePage`, and asserts:

- a continuity banner appears with copy about restored progress
- the banner includes links to `#evidence-intake`, `#field-notes`, and `#draft-report`
- the `Evidence Intake`, `Field Notes`, and `Draft Report` sections expose matching `id` attributes

- [ ] **Step 2: Run the workspace test to verify RED**

Run: `pnpm vitest run tests/integration/case-workspace-page.test.tsx`

Expected: FAIL because the workspace does not render a restoration banner or anchor ids yet.

- [ ] **Step 3: Implement the minimal workspace changes**

Create `src/features/cases/components/case-continuity-banner.tsx` as a simple presentational component that accepts a continuity object and renders three quick-jump links.

Update `src/app/(app)/cases/[caseSlug]/page.tsx` to pass `lifecycle.resumeTarget` into `CaseWorkspace`.

Update `src/features/cases/components/case-workspace.tsx` to:

- accept the continuity/resume input
- render the banner only for in-progress cases when the section is `notes` or `report`
- place it below `CaseReturnHeader`

Add section ids in the existing components:

- `EvidenceIndex` root section: `id="evidence-intake"`
- `CaseNotesPanel` root section: `id="field-notes"`
- `ReportPanel` root section: `id="draft-report"`

- [ ] **Step 4: Run the workspace tests to verify GREEN**

Run: `pnpm vitest run tests/integration/case-workspace-page.test.tsx tests/integration/case-navigation.test.tsx`

Expected: PASS, including the existing route-semantics assertions.

- [ ] **Step 5: Commit**

```bash
git add src/app/(app)/cases/[caseSlug]/page.tsx src/features/cases/components/case-continuity-banner.tsx src/features/cases/components/case-workspace.tsx src/features/cases/components/evidence-index.tsx src/features/cases/components/case-notes-panel.tsx src/features/cases/components/report-panel.tsx tests/integration/case-workspace-page.test.tsx
git commit -m "feat: surface restored progress inside case workspace"
```

## Chunk 3: End-To-End Retention Verification

### Task 4: Prove the new continuity loop in the browser

**Files:**
- Modify: `tests/e2e/retention-loop.spec.ts`
- Test: `tests/e2e/retention-loop.spec.ts`

- [ ] **Step 1: Add failing Playwright coverage**

Expand `tests/e2e/retention-loop.spec.ts` so it:

- creates a new agent
- saves notes in one case and returns to the vault
- confirms the vault shows `Resume Notes`
- follows that CTA and verifies the URL includes `#field-notes`
- saves a draft, returns to the vault, and confirms the CTA switches to `Resume Report`

- [ ] **Step 2: Run the Playwright spec to verify RED**

Run: `pnpm playwright test tests/e2e/retention-loop.spec.ts`

Expected: FAIL because the vault does not yet present continuity-aware CTAs or anchor destinations.

- [ ] **Step 3: Adjust any copy or selector details needed to make the browser flow pass**

Keep changes minimal and prefer updating rendered labels or link destinations rather than weakening the assertions.

- [ ] **Step 4: Run the targeted browser spec to verify GREEN**

Run: `pnpm playwright test tests/e2e/retention-loop.spec.ts`

Expected: PASS.

- [ ] **Step 5: Run the broader verification slice**

Run: `pnpm vitest run tests/unit/case-continuity.test.ts tests/integration/resume-state.test.ts tests/integration/vault-page.test.tsx tests/integration/case-workspace-page.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add tests/e2e/retention-loop.spec.ts
git commit -m "test: cover case continuity resume loop"
```

## Final Verification

- [ ] Run: `pnpm vitest run`
- [ ] Run: `pnpm playwright test`
- [ ] Confirm `git status --short` is clean except for intended changes
- [ ] Prepare the branch for PR creation
