# Service Record Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shared Service Record that summarizes cross-case progress and recommends the next assignment on both the vault and debrief pages.

**Architecture:** A single server-only `getServiceRecord` helper will compute totals and recommendation state from existing case data and continuity. A shared `ServiceRecordPanel` will render the summary, while the vault and debrief pages will supply light surface-specific framing and links.

**Tech Stack:** Next.js App Router, React Server Components, Drizzle ORM, Vitest, Testing Library

---

## File Structure

### Shared data and presentation

- Create: `src/features/agents/get-service-record.ts`
- Create: `src/features/agents/components/service-record-panel.tsx`
- Test: `tests/unit/get-service-record.test.ts`

### Vault integration

- Modify: `src/app/(shell)/vault/page.tsx`
- Modify: `tests/integration/vault-page.test.tsx`

### Debrief integration

- Modify: `src/app/(app)/cases/[caseSlug]/debrief/page.tsx`
- Modify: `tests/integration/debrief-page.test.tsx`

## Chunk 1: Shared Service Record Logic

### Task 1: Build the service record loader with recommendation rules

**Files:**

- Create: `tests/unit/get-service-record.test.ts`
- Create: `src/features/agents/get-service-record.ts`

- [ ] **Step 1: Write the failing service record unit tests**

Cover these behaviors:

- totals reflect active, completed, and closed-unsolved player cases
- recommendation prefers the most recently active in-progress case
- recommendation falls back to a new available case when no active case exists
- recommendation can exclude the current debriefed case slug when choosing the next assignment

Example assertion shape:

```ts
expect(result.totals).toEqual({
  availableCases: 3,
  clearedCases: 1,
  activeCases: 1,
  closedUnresolvedCases: 1,
});
expect(result.recommendedAssignment?.href).toBe(
  "/cases/red-harbor?evidence=dispatch-log#field-notes",
);
```

- [ ] **Step 2: Run the unit test to verify RED**

Run: `pnpm vitest tests/unit/get-service-record.test.ts`
Expected: FAIL because `getServiceRecord` does not exist yet.

- [ ] **Step 3: Implement `getServiceRecord`**

Build a server-only helper that:

- uses `listAvailableCases({ userId })` for recommendation inputs
- counts active, completed, and closed-unsolved cases from `player_cases`
- computes `progressLabel` like `1 of 3 dossiers cleared`
- chooses `recommendedAssignment` by priority:
  1. most recently active in-progress dossier
  2. first available new dossier
  3. no recommendation when no meaningful assignment exists
- optionally includes the most recent terminal outcome summary when present

- [ ] **Step 4: Run the unit test to verify GREEN**

Run: `pnpm vitest tests/unit/get-service-record.test.ts`
Expected: PASS with service record totals and recommendation rules covered.

- [ ] **Step 5: Commit**

```bash
git add tests/unit/get-service-record.test.ts src/features/agents/get-service-record.ts
git commit -m "feat: add service record loader"
```

## Chunk 2: Shared Panel and Vault Integration

### Task 2: Render the service record on the vault page

**Files:**

- Create: `src/features/agents/components/service-record-panel.tsx`
- Modify: `src/app/(shell)/vault/page.tsx`
- Modify: `tests/integration/vault-page.test.tsx`

- [ ] **Step 1: Extend the vault integration tests first**

Add failing assertions for:

- Service Record heading and totals
- progress label such as `1 of 3 dossiers cleared`
- recommendation toward an in-progress case
- recommendation toward a new case when the player has no active dossiers

- [ ] **Step 2: Run the vault integration test to verify RED**

Run: `pnpm vitest tests/integration/vault-page.test.tsx`
Expected: FAIL because the vault does not render a service record panel yet.

- [ ] **Step 3: Implement the shared panel and vault placement**

Build `ServiceRecordPanel` as a presentational component that accepts:

- surface-specific eyebrow/title/description copy
- totals
- progress label
- optional latest outcome
- optional recommendation link and reason

Then render it near the top of the vault using `getServiceRecord`.

- [ ] **Step 4: Run the vault integration test to verify GREEN**

Run: `pnpm vitest tests/integration/vault-page.test.tsx`
Expected: PASS with the vault service record scenarios green.

- [ ] **Step 5: Commit**

```bash
git add src/features/agents/components/service-record-panel.tsx "src/app/(shell)/vault/page.tsx" tests/integration/vault-page.test.tsx
git commit -m "feat: add service record to the vault"
```

## Chunk 3: Debrief Integration and Verification

### Task 3: Add the service record handoff to the debrief page

**Files:**

- Modify: `src/app/(app)/cases/[caseSlug]/debrief/page.tsx`
- Modify: `tests/integration/debrief-page.test.tsx`

- [ ] **Step 1: Extend the debrief integration tests first**

Add failing assertions that verify:

- solved and closed-unsolved debriefs both render the Service Record panel
- the panel reflects updated totals after the terminal outcome
- the recommendation points to the next dossier when another assignment exists

- [ ] **Step 2: Run the debrief integration test to verify RED**

Run: `pnpm vitest tests/integration/debrief-page.test.tsx`
Expected: FAIL because the debrief page does not render the shared service record yet.

- [ ] **Step 3: Implement debrief placement**

Load `getServiceRecord` inside the debrief route with the current `caseSlug` excluded from recommendation fallback when appropriate, then render `ServiceRecordPanel` after the outcome section with debrief-specific copy.

- [ ] **Step 4: Run the debrief integration test to verify GREEN**

Run: `pnpm vitest tests/integration/debrief-page.test.tsx`
Expected: PASS with service record coverage for solved and closed-unsolved outcomes.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(app)/cases/[caseSlug]/debrief/page.tsx" tests/integration/debrief-page.test.tsx
git commit -m "feat: add service record handoff to debriefs"
```

### Task 4: Final verification and required build

**Files:**

- Verify only: no planned source changes

- [ ] **Step 1: Run the focused automated checks**

Run: `pnpm vitest tests/unit/get-service-record.test.ts tests/integration/vault-page.test.tsx tests/integration/debrief-page.test.tsx`
Expected: PASS with 0 failing tests.

- [ ] **Step 2: Run the required production build**

Run: `pnpm build`
Expected: PASS with exit code 0.

- [ ] **Step 3: Review the final diff**

Run: `git status --short && git diff --stat main...HEAD`
Expected: only Service Record docs, logic, UI, and test files appear.

- [ ] **Step 4: Commit any final polish if needed**

```bash
git add -A
git commit -m "test: finalize service record coverage"
```

Only create this commit if verification uncovered code or test changes that were not already committed.
