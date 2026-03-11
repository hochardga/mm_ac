# Ashfall Collective MVP Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first Ashfall Collective release: a solo-first web application with themed signup, a three-case dossier vault, a semi-open investigation workspace, capped graded submissions, stable debriefs, and retention instrumentation.

**Architecture:** Build a single Next.js App Router application with server-rendered routes and server actions. Store player state in PostgreSQL through Drizzle, keep case content in server-loaded JSON packages under `content/cases/`, and enforce the public/private case-data boundary by loading protected case payloads only from server-only modules. Keep route files thin and move auth, case lifecycle, submission evaluation, analytics, and availability rules into focused feature modules with unit tests.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, PostgreSQL, Drizzle ORM, NextAuth Credentials provider, Zod, Vitest, Testing Library, Playwright, pnpm

---

## Scope Check

The approved spec is already scoped to one MVP subsystem: the core web product for solo case play. This plan intentionally excludes subscriptions, multiplayer, clue-board sandboxing, and a full authoring CMS.

## File Structure

- `package.json`: app scripts, runtime dependencies, test commands
- `next.config.ts`: Next.js configuration
- `playwright.config.ts`: browser test configuration
- `vitest.config.ts`: unit/integration test configuration
- `.env.example`: required environment variables
- `drizzle.config.ts`: migration configuration
- `content/cases/<slug>/manifest.json`: player-safe case payload
- `content/cases/<slug>/protected.json`: protected answers, grading rules, debrief payloads
- `src/app/layout.tsx`: global shell and fonts
- `src/app/globals.css`: app-wide styles and theme tokens
- `src/app/page.tsx`: public landing / redirect shell
- `src/app/(public)/apply/page.tsx`: in-universe signup screen
- `src/app/(public)/apply/actions.ts`: signup server action
- `src/app/(auth)/signin/page.tsx`: returning-agent sign-in
- `src/app/(app)/vault/page.tsx`: case vault
- `src/app/(app)/cases/[caseSlug]/page.tsx`: investigation workspace
- `src/app/(app)/cases/[caseSlug]/debrief/page.tsx`: solved / closed debrief
- `src/app/api/auth/[...nextauth]/route.ts`: auth route
- `src/middleware.ts`: route protection
- `src/lib/env.ts`: environment parsing
- `src/lib/db.ts`: Drizzle database client
- `src/lib/auth.ts`: NextAuth configuration
- `src/lib/analytics.ts`: analytics event writer
- `src/features/auth/register-agent.ts`: signup business logic
- `src/features/auth/password.ts`: password hashing and comparison
- `src/features/cases/case-schema.ts`: Zod schemas for manifest/protected payloads
- `src/features/cases/load-case-manifest.ts`: server-only manifest loader
- `src/features/cases/load-protected-case.ts`: server-only protected loader
- `src/features/cases/list-available-cases.ts`: vault case listing + availability filtering
- `src/features/cases/open-case.ts`: player-case creation, revision pinning, start event
- `src/features/cases/case-status.ts`: derived player status and vault availability helpers
- `src/features/notes/save-note.ts`: note persistence logic
- `src/features/drafts/save-report-draft.ts`: draft persistence logic
- `src/features/submissions/evaluate-report.ts`: grading and terminal-state logic
- `src/features/submissions/submit-report.ts`: token-bound submission transaction
- `src/features/debrief/get-debrief.ts`: debrief selection and next-case recommendation
- `src/features/maintenance/get-case-availability.ts`: maintenance / hidden behavior
- `src/db/schema.ts`: Drizzle table definitions
- `src/db/seed.ts`: seed runner for demo users and three cases
- `src/db/migrations/*`: generated SQL migrations
- `tests/unit/*`: unit tests for feature modules
- `tests/integration/*`: server action and route-level tests
- `tests/e2e/*`: Playwright end-to-end flows

## Implementation Notes

- Task 1 is the only non-TDD-heavy bootstrap task because the app and test harness do not exist yet.
- Every task after Task 1 should follow strict TDD: write failing test, verify failure, implement minimal code, verify pass, commit.
- Use one commit per task unless a task explicitly says otherwise.
- Keep protected case payloads out of client bundles by loading them only from server-side functions that read from `content/cases/*/protected.json`.

## Chunk 1: Foundation and Content Boundary

### Task 1: Bootstrap the application runtime

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `playwright.config.ts`
- Create: `vitest.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`
- Create: `src/app/page.tsx`
- Create: `tests/unit/app-shell.test.tsx`

- [ ] **Step 1: Scaffold the Next.js app shell**

Run: `pnpm dlx create-next-app@latest . --ts --tailwind --eslint --app --src-dir --use-pnpm --import-alias "@/*"`

Expected: app scaffold lands in the existing repo without deleting `docs/` or `.git/`

- [ ] **Step 2: Add Vitest and Testing Library dependencies**

Run: `pnpm add -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom jsdom`

Expected: `package.json` contains a `test` script target and dev dependencies install cleanly

- [ ] **Step 3: Write the first failing shell test**

```tsx
import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";

test("shows the Ashfall Collective heading", () => {
  render(<HomePage />);
  expect(
    screen.getByRole("heading", { name: /ashfall collective/i }),
  ).toBeInTheDocument();
});
```

- [ ] **Step 4: Run the shell test to verify it fails**

Run: `pnpm vitest tests/unit/app-shell.test.tsx`

Expected: FAIL because the landing page copy does not mention Ashfall Collective yet

- [ ] **Step 5: Replace the default app copy with a minimal Ashfall landing shell**

```tsx
export default function HomePage() {
  return (
    <main>
      <h1>Ashfall Collective</h1>
      <p>Report to your handler. First cases incoming.</p>
    </main>
  );
}
```

- [ ] **Step 6: Re-run unit tests and commit**

Run: `pnpm vitest tests/unit/app-shell.test.tsx`

Expected: PASS

```bash
git add package.json next.config.ts tsconfig.json playwright.config.ts vitest.config.ts src/app tests/unit
git commit -m "chore: scaffold next app and test harness"
```

### Task 2: Add environment parsing and database foundations

**Files:**
- Create: `.env.example`
- Create: `drizzle.config.ts`
- Create: `src/lib/env.ts`
- Create: `src/lib/db.ts`
- Create: `src/db/schema.ts`
- Create: `tests/unit/env.test.ts`
- Create: `tests/unit/schema.test.ts`

- [ ] **Step 1: Write a failing environment parser test**

```ts
import { describe, expect, test } from "vitest";
import { parseEnv } from "@/lib/env";

describe("parseEnv", () => {
  test("requires the auth secret and database url", () => {
    expect(() => parseEnv({} as NodeJS.ProcessEnv)).toThrow(/database url/i);
  });
});
```

- [ ] **Step 2: Run the env test to verify it fails**

Run: `pnpm vitest tests/unit/env.test.ts`

Expected: FAIL because `src/lib/env.ts` does not exist

- [ ] **Step 3: Implement environment parsing and database schema stubs**

```ts
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
});

export function parseEnv(input: NodeJS.ProcessEnv) {
  return envSchema.parse(input);
}
```

```ts
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
});
```

- [ ] **Step 4: Add player-state tables and a schema smoke test**

```ts
expect(Object.keys(schema)).toEqual(
  expect.arrayContaining(["users", "caseDefinitions", "playerCases", "notes"]),
);
```

- [ ] **Step 5: Run unit tests and generate the initial migration**

Run: `pnpm vitest tests/unit/env.test.ts tests/unit/schema.test.ts && pnpm drizzle-kit generate`

Expected: PASS, then a new SQL migration under `src/db/migrations/`

- [ ] **Step 6: Commit the database baseline**

```bash
git add .env.example drizzle.config.ts src/lib/env.ts src/lib/db.ts src/db tests/unit
git commit -m "feat: add env parsing and database schema"
```

### Task 3: Establish the public/protected case package boundary

**Files:**
- Create: `content/cases/hollow-bishop/manifest.json`
- Create: `content/cases/hollow-bishop/protected.json`
- Create: `content/cases/red-harbor/manifest.json`
- Create: `content/cases/red-harbor/protected.json`
- Create: `content/cases/briar-ledger/manifest.json`
- Create: `content/cases/briar-ledger/protected.json`
- Create: `src/features/cases/case-schema.ts`
- Create: `src/features/cases/load-case-manifest.ts`
- Create: `src/features/cases/load-protected-case.ts`
- Create: `tests/unit/load-case-manifest.test.ts`
- Create: `tests/unit/load-protected-case.test.ts`

- [ ] **Step 1: Write failing tests for manifest/protected loaders**

```ts
import { loadCaseManifest } from "@/features/cases/load-case-manifest";
import { loadProtectedCase } from "@/features/cases/load-protected-case";

test("manifest loader excludes canonical answers", async () => {
  const manifest = await loadCaseManifest("hollow-bishop");
  expect(manifest).not.toHaveProperty("canonicalAnswers");
});

test("protected loader exposes grading configuration", async () => {
  const payload = await loadProtectedCase("hollow-bishop");
  expect(payload.canonicalAnswers.suspect).toBeDefined();
});
```

- [ ] **Step 2: Run the loader tests to verify they fail**

Run: `pnpm vitest tests/unit/load-case-manifest.test.ts tests/unit/load-protected-case.test.ts`

Expected: FAIL because the loaders and case files do not exist

- [ ] **Step 3: Create Zod schemas plus the first three case packages**

```ts
export const caseManifestSchema = z.object({
  slug: z.string(),
  title: z.string(),
  reportOptions: z.object({
    suspect: z.array(z.object({ id: z.string(), label: z.string() })),
    motive: z.array(z.object({ id: z.string(), label: z.string() })),
    method: z.array(z.object({ id: z.string(), label: z.string() })),
  }),
});
```

- [ ] **Step 4: Implement file-system loaders with server-only imports**

```ts
import "server-only";
import { readFile } from "node:fs/promises";

export async function loadCaseManifest(slug: string) {
  const raw = await readFile(`content/cases/${slug}/manifest.json`, "utf8");
  return caseManifestSchema.parse(JSON.parse(raw));
}
```

- [ ] **Step 5: Re-run unit tests and add a schema-validation script**

Run: `pnpm vitest tests/unit/load-case-manifest.test.ts tests/unit/load-protected-case.test.ts`

Expected: PASS

- [ ] **Step 6: Commit the case-content boundary**

```bash
git add content/cases src/features/cases tests/unit
git commit -m "feat: add server-only case package loaders"
```

### Task 4: Add auth plumbing and route protection

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/features/auth/password.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/middleware.ts`
- Create: `tests/unit/password.test.ts`
- Create: `tests/integration/auth-route.test.ts`

- [ ] **Step 1: Write a failing password utility test**

```ts
import { comparePassword, hashPassword } from "@/features/auth/password";

test("hashes and verifies passwords", async () => {
  const hash = await hashPassword("top-secret");
  await expect(comparePassword("top-secret", hash)).resolves.toBe(true);
});
```

- [ ] **Step 2: Run the auth utility test to verify it fails**

Run: `pnpm vitest tests/unit/password.test.ts`

Expected: FAIL because the password module does not exist

- [ ] **Step 3: Implement password helpers and NextAuth credentials config**

```ts
export async function hashPassword(value: string) {
  return bcrypt.hash(value, 12);
}

export async function comparePassword(value: string, hash: string) {
  return bcrypt.compare(value, hash);
}
```

- [ ] **Step 4: Protect `/vault` and `/cases/*` routes behind middleware**

Run: `pnpm vitest tests/unit/password.test.ts tests/integration/auth-route.test.ts`

Expected: FAIL first for missing route behavior, then PASS after middleware + auth route are added

- [ ] **Step 5: Commit the auth baseline**

```bash
git add src/lib/auth.ts src/features/auth src/app/api/auth src/middleware.ts tests
git commit -m "feat: add auth foundation and protected routes"
```

## Chunk 2: Player Journey and Investigation Loop

### Task 5: Implement the agency application signup flow

**Files:**
- Create: `src/app/(public)/apply/page.tsx`
- Create: `src/app/(public)/apply/actions.ts`
- Create: `src/app/(auth)/signin/page.tsx`
- Create: `src/features/auth/register-agent.ts`
- Create: `tests/integration/register-agent.test.ts`
- Create: `tests/e2e/apply.spec.ts`

- [ ] **Step 1: Write a failing registration integration test**

```ts
import { registerAgent } from "@/features/auth/register-agent";

test("creates a new user and returns the vault redirect", async () => {
  const result = await registerAgent({
    email: "agent@example.com",
    password: "CaseFile123!",
    alias: "Agent Ash",
  });

  expect(result.redirectTo).toBe("/vault");
});
```

- [ ] **Step 2: Run the registration test to verify it fails**

Run: `pnpm vitest tests/integration/register-agent.test.ts`

Expected: FAIL because the server action and domain logic do not exist

- [ ] **Step 3: Implement `registerAgent` plus the themed `/apply` page**

```ts
export async function registerAgent(input: RegisterAgentInput) {
  const passwordHash = await hashPassword(input.password);
  await db.insert(users).values({ ...input, passwordHash });
  return { redirectTo: "/vault" };
}
```

- [ ] **Step 4: Add the first browser flow**

Run: `pnpm playwright test tests/e2e/apply.spec.ts`

Expected: FAIL until the form renders and redirects to `/vault`

- [ ] **Step 5: Re-run unit + browser tests and commit**

Run: `pnpm vitest tests/integration/register-agent.test.ts && pnpm playwright test tests/e2e/apply.spec.ts`

Expected: PASS

```bash
git add src/app/(public) src/app/(auth) src/features/auth/register-agent.ts tests
git commit -m "feat: add immersive signup flow"
```

### Task 6: Build the dossier vault with statuses and availability

**Files:**
- Create: `src/features/cases/case-status.ts`
- Create: `src/features/cases/list-available-cases.ts`
- Create: `src/features/maintenance/get-case-availability.ts`
- Create: `src/app/(app)/vault/page.tsx`
- Create: `tests/unit/case-status.test.ts`
- Create: `tests/integration/vault-page.test.tsx`

- [ ] **Step 1: Write failing status/availability tests**

```ts
import { getDisplayStatus, getVaultAvailability } from "@/features/cases/case-status";

test("maps closed_unsolved to Case Closed", () => {
  expect(getDisplayStatus("closed_unsolved")).toBe("Case Closed");
});

test("maps unpublished cases to hidden availability", () => {
  expect(getVaultAvailability({ published: false })).toBe("Hidden");
});
```

- [ ] **Step 2: Run the vault-domain tests to verify they fail**

Run: `pnpm vitest tests/unit/case-status.test.ts`

Expected: FAIL because the helpers do not exist

- [ ] **Step 3: Implement the status helpers and case-list query**

```ts
export function getDisplayStatus(status: PlayerCaseStatus) {
  return {
    new: "New",
    in_progress: "In Progress",
    completed: "Solved",
    closed_unsolved: "Case Closed",
  }[status];
}
```

- [ ] **Step 4: Render the vault page using seeded case + player status data**

Run: `pnpm vitest tests/unit/case-status.test.ts tests/integration/vault-page.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit the vault experience**

```bash
git add src/features/cases src/features/maintenance src/app/(app)/vault tests
git commit -m "feat: add case vault and status rendering"
```

### Task 7: Implement case start, revision pinning, and analytics sessions

**Files:**
- Create: `src/features/cases/open-case.ts`
- Create: `src/lib/analytics.ts`
- Create: `tests/unit/open-case.test.ts`
- Create: `tests/unit/analytics.test.ts`
- Modify: `src/app/(app)/cases/[caseSlug]/page.tsx`

- [ ] **Step 1: Write a failing case-open test**

```ts
import { openCase } from "@/features/cases/open-case";

test("pins the latest revision on first open and emits case_started once", async () => {
  const result = await openCase({ userId: "u1", caseSlug: "hollow-bishop" });
  expect(result.playerCase.status).toBe("in_progress");
  expect(result.analyticsEvent.name).toBe("Case started");
});
```

- [ ] **Step 2: Run the failing lifecycle tests**

Run: `pnpm vitest tests/unit/open-case.test.ts tests/unit/analytics.test.ts`

Expected: FAIL because the lifecycle module does not exist

- [ ] **Step 3: Implement atomic player-case creation and analytics event writing**

```ts
return db.transaction(async (tx) => {
  const existing = await tx.query.playerCases.findFirst(...);
  if (existing) return existing;
  const pinned = await tx.insert(playerCases).values({ status: "in_progress", ... });
  await writeAnalyticsEvent(tx, { name: "Case started", ... });
  return pinned;
});
```

- [ ] **Step 4: Wire the workspace route to call `openCase` before rendering**

Run: `pnpm vitest tests/unit/open-case.test.ts tests/unit/analytics.test.ts`

Expected: PASS

- [ ] **Step 5: Commit lifecycle + analytics foundations**

```bash
git add src/features/cases/open-case.ts src/lib/analytics.ts src/app/(app)/cases tests
git commit -m "feat: add case start lifecycle and analytics"
```

### Task 8: Build the investigation workspace, notes, and draft saves

**Files:**
- Create: `src/features/notes/save-note.ts`
- Create: `src/features/drafts/save-report-draft.ts`
- Create: `src/app/(app)/cases/[caseSlug]/actions.ts`
- Modify: `src/app/(app)/cases/[caseSlug]/page.tsx`
- Create: `tests/unit/save-note.test.ts`
- Create: `tests/unit/save-report-draft.test.ts`
- Create: `tests/e2e/workspace.spec.ts`

- [ ] **Step 1: Write failing note and draft persistence tests**

```ts
test("saves note text for a player case", async () => {
  const note = await saveNote({ playerCaseId: "pc1", body: "Check the receipts." });
  expect(note.body).toContain("receipts");
});

test("saves draft answers without grading them", async () => {
  const draft = await saveReportDraft({
    playerCaseId: "pc1",
    suspectId: "s1",
    motiveId: "m2",
    methodId: "w1",
  });
  expect(draft.attemptCount).toBe(0);
});
```

- [ ] **Step 2: Run the failing persistence tests**

Run: `pnpm vitest tests/unit/save-note.test.ts tests/unit/save-report-draft.test.ts`

Expected: FAIL because note and draft modules do not exist

- [ ] **Step 3: Implement note + draft persistence and workspace actions**

```ts
export async function saveReportDraft(input: SaveReportDraftInput) {
  return db.insert(reportDrafts).values(input).onConflictDoUpdate(...);
}
```

- [ ] **Step 4: Render the evidence list, notes panel, and draft report form**

Run: `pnpm playwright test tests/e2e/workspace.spec.ts`

Expected: FAIL until the workspace shows evidence, notes, and the three constrained report inputs

- [ ] **Step 5: Re-run unit + browser tests and commit**

Run: `pnpm vitest tests/unit/save-note.test.ts tests/unit/save-report-draft.test.ts && pnpm playwright test tests/e2e/workspace.spec.ts`

Expected: PASS

```bash
git add src/features/notes src/features/drafts src/app/(app)/cases tests
git commit -m "feat: add investigation workspace and draft persistence"
```

### Task 9: Implement graded submissions, capped attempts, and stable debriefs

**Files:**
- Create: `src/features/submissions/evaluate-report.ts`
- Create: `src/features/submissions/submit-report.ts`
- Create: `src/features/debrief/get-debrief.ts`
- Create: `src/app/(app)/cases/[caseSlug]/debrief/page.tsx`
- Create: `tests/unit/evaluate-report.test.ts`
- Create: `tests/integration/submit-report.test.ts`

- [ ] **Step 1: Write a failing grading test**

```ts
import { evaluateReport } from "@/features/submissions/evaluate-report";

test("marks the third incorrect report as closed_unsolved", async () => {
  const result = await evaluateReport({
    answers: { suspectId: "wrong", motiveId: "wrong", methodId: "wrong" },
    attemptNumber: 3,
    protectedCaseSlug: "hollow-bishop",
  });

  expect(result.nextStatus).toBe("closed_unsolved");
});
```

- [ ] **Step 2: Run the grading tests to verify they fail**

Run: `pnpm vitest tests/unit/evaluate-report.test.ts tests/integration/submit-report.test.ts`

Expected: FAIL because grading logic does not exist

- [ ] **Step 3: Implement evaluation, terminal snapshots, and debrief selection**

```ts
if (isCorrectAnswer) return { nextStatus: "completed", terminal: true };
if (attemptNumber >= 3) return { nextStatus: "closed_unsolved", terminal: true };
return { nextStatus: "in_progress", terminal: false };
```

- [ ] **Step 4: Add the token-bound submission transaction**

Run: `pnpm vitest tests/unit/evaluate-report.test.ts tests/integration/submit-report.test.ts`

Expected: PASS with one attempt consumed per unique submission token

- [ ] **Step 5: Commit submission + debrief behavior**

```bash
git add src/features/submissions src/features/debrief src/app/(app)/cases/[caseSlug]/debrief tests
git commit -m "feat: add graded submissions and debrief states"
```

## Chunk 3: Hardening, Verification, and Operator Readiness

### Task 10: Add maintenance handling and publication edge cases

**Files:**
- Modify: `src/features/maintenance/get-case-availability.ts`
- Modify: `src/features/cases/list-available-cases.ts`
- Modify: `src/app/(app)/vault/page.tsx`
- Create: `tests/unit/get-case-availability.test.ts`
- Create: `tests/integration/maintenance-vault.test.tsx`

- [ ] **Step 1: Write failing maintenance tests**

```ts
test("shows maintenance for a broken published revision", () => {
  expect(
    getCaseAvailability({ published: true, broken: true, hasPlayerCase: false }),
  ).toBe("Maintenance");
});
```

- [ ] **Step 2: Run the maintenance tests to verify they fail**

Run: `pnpm vitest tests/unit/get-case-availability.test.ts`

Expected: FAIL because the broken-case branch is not implemented

- [ ] **Step 3: Implement availability logic for available / maintenance / hidden**

```ts
if (!published) return "Hidden";
if (broken) return "Maintenance";
return "Available";
```

- [ ] **Step 4: Render vault banners and disabled CTAs for non-playable cases**

Run: `pnpm vitest tests/unit/get-case-availability.test.ts tests/integration/maintenance-vault.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit publication-edge handling**

```bash
git add src/features/maintenance src/features/cases/list-available-cases.ts src/app/(app)/vault tests
git commit -m "feat: handle maintenance and hidden case states"
```

### Task 11: Add correctness tests for retries, concurrency, and resume behavior

**Files:**
- Create: `tests/integration/submission-idempotency.test.ts`
- Create: `tests/integration/concurrent-submission.test.ts`
- Create: `tests/integration/resume-state.test.ts`
- Modify: `src/features/submissions/submit-report.ts`
- Modify: `src/features/cases/open-case.ts`

- [ ] **Step 1: Write a failing idempotency test**

```ts
test("reuses the same submission token without consuming a second attempt", async () => {
  const first = await submitReport({ submissionToken: "tok-1", ...payload });
  const second = await submitReport({ submissionToken: "tok-1", ...payload });
  expect(second.attemptNumber).toBe(first.attemptNumber);
});
```

- [ ] **Step 2: Run integration tests to verify they fail**

Run: `pnpm vitest tests/integration/submission-idempotency.test.ts tests/integration/concurrent-submission.test.ts tests/integration/resume-state.test.ts`

Expected: FAIL because duplicate-token and concurrent-submission guards are incomplete

- [ ] **Step 3: Implement token binding, transactional locking, and resume target persistence**

```ts
if (existingSubmission && existingSubmission.payloadHash === incomingHash) {
  return existingSubmission;
}
```

- [ ] **Step 4: Re-run the integration suite**

Run: `pnpm vitest tests/integration/submission-idempotency.test.ts tests/integration/concurrent-submission.test.ts tests/integration/resume-state.test.ts`

Expected: PASS

- [ ] **Step 5: Commit correctness guarantees**

```bash
git add src/features/submissions src/features/cases tests/integration
git commit -m "test: lock down retries concurrency and resume behavior"
```

### Task 12: Add retention analytics and browser verification flows

**Files:**
- Modify: `src/lib/analytics.ts`
- Create: `tests/unit/analytics-events.test.ts`
- Create: `tests/e2e/retention-loop.spec.ts`
- Create: `tests/e2e/cross-device-resume.spec.ts`

- [ ] **Step 1: Write failing analytics-event tests**

```ts
test("records graded report submissions with session id and case revision", () => {
  const event = buildAnalyticsEvent("Graded report submitted", {
    sessionId: "sess-1",
    caseRevision: "rev-2",
  });

  expect(event.caseRevision).toBe("rev-2");
});
```

- [ ] **Step 2: Run the analytics tests to verify they fail**

Run: `pnpm vitest tests/unit/analytics-events.test.ts`

Expected: FAIL because the event builder does not enforce required fields yet

- [ ] **Step 3: Implement required analytics payloads and browser scenarios**

```ts
return analyticsEventSchema.parse({
  name,
  playerId,
  sessionId,
  caseId,
  caseRevision,
  submissionToken,
});
```

- [ ] **Step 4: Run the retention browser suite**

Run: `pnpm playwright test tests/e2e/retention-loop.spec.ts tests/e2e/cross-device-resume.spec.ts`

Expected: PASS for:
- signup -> vault -> first case -> mid-case exit -> resume
- complete first case -> start second case
- reopen the same account in a second browser context and resume near prior context

- [ ] **Step 5: Commit analytics + E2E coverage**

```bash
git add src/lib/analytics.ts tests/unit/analytics-events.test.ts tests/e2e
git commit -m "test: add retention analytics and browser coverage"
```

### Task 13: Add seed tooling, operator docs, and launch verification

**Files:**
- Create: `src/db/seed.ts`
- Create: `README.md`
- Modify: `.env.example`
- Create: `tests/integration/seed.test.ts`

- [ ] **Step 1: Write a failing seed test**

```ts
test("seeds three published cases", async () => {
  await seedDatabase();
  await expect(countPublishedCases()).resolves.toBe(3);
});
```

- [ ] **Step 2: Run the seed test to verify it fails**

Run: `pnpm vitest tests/integration/seed.test.ts`

Expected: FAIL because the seed runner does not exist

- [ ] **Step 3: Implement the seed command and operator README**

```ts
await db.insert(caseDefinitions).values(seedCases);
```

- [ ] **Step 4: Run the full verification suite**

Run: `pnpm vitest && pnpm playwright test`

Expected: PASS

- [ ] **Step 5: Document runbooks and commit**

```bash
git add src/db/seed.ts README.md .env.example tests/integration/seed.test.ts
git commit -m "docs: add seed tooling and operator runbook"
```

## Execution Handoff

- Use a dedicated worktree before executing this plan.
- Execute Chunk 1 first and keep all commits small and linear.
- After each task commit, run only the tests named in that task before continuing.
- Do not start building subscriptions, multiplayer, or a CMS unless the spec changes first.
