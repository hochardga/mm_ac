# Case Introduction Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional case introduction that auto-opens once per player case, replays through `intro=1`, and plays transcript-led audio without leaking into evidence flows.

**Architecture:** Keep the intro as a separate case-level bundle loaded alongside the manifest, not as evidence. Use a client-mounted modal to handle playback, replay, focus management, and the first-seen write, while the page keeps URL state and evidence suppression deterministic. Extend the existing case asset route just enough to serve the intro MP3 safely with range support, but leave the existing photo asset surface intact.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Drizzle ORM, Vitest, Testing Library

---

## Preflight

- Start implementation in a fresh git worktree rooted at this repository.
- Keep the approved spec open at `docs/superpowers/specs/2026-03-31-case-introduction-design.md`.
- Do not change the existing photo asset helper files unless the spec or tests require it.
- Keep the shared asset helper scope narrow: only the new intro audio path and the current photo asset paths.
- Run focused tests after every task and `pnpm build` before the final handoff.
- Use small commits so the first-seen write, the modal wiring, and the audio route can be reviewed independently.

## Chunk 1: Intro Loader, Seen-State, and Test Contracts

### Task 1: Add the intro loader and seen-state mutation

**Files:**
- Create: `src/features/cases/load-case-introduction.ts`
- Modify: `src/db/schema.ts`
- Modify: `src/app/(app)/cases/[caseSlug]/actions.ts`
- Modify: `src/db/migrations/*`
- Test: `tests/unit/load-case-introduction.test.ts`
- Test: `tests/unit/case-introduction-actions.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
test("returns null when the introduction folder is missing", async () => {});
test("loads a transcript-only introduction bundle", async () => {});
test("returns null when transcript.md is missing or empty", async () => {});
test("markIntroductionSeenAction writes once and is idempotent", async () => {});
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `pnpm vitest run tests/unit/load-case-introduction.test.ts tests/unit/case-introduction-actions.test.ts`
Expected: FAIL because the loader, column, action, and migration do not exist yet.

- [ ] **Step 3: Implement the minimal contracts**

Implement `loadCaseIntroduction` so it:
- checks `content/cases/<slug>/introduction/`
- requires `transcript.md`
- treats `audio.mp3` as optional
- returns `null` when the bundle is missing or invalid

Add `player_cases.introduction_seen_at` to the schema and a migration that preserves existing rows.

Add `markIntroductionSeenAction` to the case actions file so it:
- verifies the current agent owns the player case
- updates `introduction_seen_at` only when it is null
- returns without changing anything if the timestamp already exists

- [ ] **Step 4: Run the focused tests again**

Run: `pnpm vitest run tests/unit/load-case-introduction.test.ts tests/unit/case-introduction-actions.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/cases/load-case-introduction.ts src/db/schema.ts src/app/(app)/cases/[caseSlug]/actions.ts src/db/migrations/* tests/unit/load-case-introduction.test.ts tests/unit/case-introduction-actions.test.ts
git commit -m "feat: add case introduction loader"
```

## Chunk 2: Modal, Replay Flow, and Case Page Wiring

### Task 2: Build the intro modal and wire page-level state

**Files:**
- Create: `src/features/cases/components/case-introduction-modal.tsx`
- Modify: `src/app/(app)/cases/[caseSlug]/page.tsx`
- Modify: `src/components/case-return-header.tsx`
- Modify: `src/features/cases/components/case-workspace.tsx`
- Test: `tests/unit/case-introduction-modal.test.tsx`
- Test: `tests/integration/case-workspace-page.test.tsx`
- Test: `tests/integration/case-navigation.test.tsx`

- [ ] **Step 1: Write the failing UI and page tests**

```ts
test("auto-opens the intro once for a fresh player case", async () => {});
test("suppresses evidence while the intro is open, then restores it after close", async () => {});
test("shows a replay button only when a valid intro bundle exists", async () => {});
test("the modal focuses close or play correctly and restores focus on close", async () => {});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `pnpm vitest run tests/unit/case-introduction-modal.test.tsx tests/integration/case-workspace-page.test.tsx tests/integration/case-navigation.test.tsx`
Expected: FAIL because the modal, replay link, and intro-aware page wiring do not exist yet.

- [ ] **Step 3: Implement the modal and page flow**

Implement `CaseIntroductionModal` as a client component that:
- uses the same portal/focus-trap pattern as the evidence dialog
- shows a custom `Play Introduction` button
- renders transcript and audio together
- pauses or resets audio on close
- calls `markIntroductionSeenAction` from the hydrated client mount when the intro is first shown

Update `page.tsx` so it:
- loads the intro bundle alongside the case manifest
- computes `shouldOpen` from `intro=1` and `introduction_seen_at`
- suppresses evidence selection/viewing while the intro modal is open
- redirects stale `intro=1` links with no valid bundle before rendering the modal

Update `CaseReturnHeader` so it:
- shows `Replay Introduction` only when `loadCaseIntroduction` succeeds
- preserves existing evidence query state when reopening the intro

Update `CaseWorkspace` so intro-open requests do not mount the evidence dialog in the background.

- [ ] **Step 4: Re-run the UI and integration tests**

Run: `pnpm vitest run tests/unit/case-introduction-modal.test.tsx tests/integration/case-workspace-page.test.tsx tests/integration/case-navigation.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/cases/components/case-introduction-modal.tsx src/app/(app)/cases/[caseSlug]/page.tsx src/components/case-return-header.tsx src/features/cases/components/case-workspace.tsx tests/unit/case-introduction-modal.test.tsx tests/integration/case-workspace-page.test.tsx tests/integration/case-navigation.test.tsx
git commit -m "feat: wire case introduction modal"
```

## Chunk 3: Audio Asset Route and Allowlist

### Task 3: Extend the case asset route for intro audio

**Files:**
- Create: `src/features/cases/case-asset.ts`
- Create: `src/features/cases/case-asset-url.ts`
- Modify: `src/app/api/cases/[caseSlug]/assets/[...assetPath]/route.ts`
- Test: `tests/integration/case-asset-route.test.ts`
- Test: `tests/unit/case-asset.test.ts`

- [ ] **Step 1: Write the failing route tests**

```ts
test("serves intro audio with 200 and 206 responses", async () => {});
test("returns 416 for invalid range requests", async () => {});
test("rejects markdown, json, and arbitrary binaries", async () => {});
test("keeps existing photo asset paths working", async () => {});
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `pnpm vitest run tests/unit/case-asset.test.ts tests/integration/case-asset-route.test.ts`
Expected: FAIL because the helper and range-capable route are not implemented yet.

- [ ] **Step 3: Implement the safe asset helpers and range support**

Implement `case-asset.ts` and `case-asset-url.ts` as the narrow shared helpers for:
- the current case photo asset paths already served today
- `introduction/audio.mp3`

Update the route so it:
- stays on the Node.js runtime
- serves `GET` without `Range` as a full `200`
- serves single-byte ranges with `206`, `Content-Range`, `Content-Type: audio/mpeg`, `Content-Length`, and `Accept-Ranges: bytes`
- returns `416` for invalid or unsatisfiable ranges
- blocks any file types or paths outside the allowlist

- [ ] **Step 4: Re-run the route tests**

Run: `pnpm vitest run tests/unit/case-asset.test.ts tests/integration/case-asset-route.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/cases/case-asset.ts src/features/cases/case-asset-url.ts src/app/api/cases/[caseSlug]/assets/[...assetPath]/route.ts tests/unit/case-asset.test.ts tests/integration/case-asset-route.test.ts
git commit -m "feat: serve case intro audio"
```

## Chunk 4: Larkspur Content and Authoring Docs

### Task 4: Land the first intro bundle and document the authoring path

**Files:**
- Create: `content/cases/larkspur-dead-air/introduction/transcript.md`
- Create: `content/cases/larkspur-dead-air/introduction/audio.mp3`
- Modify: `docs/create-a-new-case.md`
- Test: `tests/integration/case-workspace-page.test.tsx`

- [ ] **Step 1: Write the failing content/docs tests**

```ts
test("larkspur exposes a replayable intro bundle without touching evidence", async () => {});
test("new case docs mention the introduction folder and replay behavior", async () => {});
```

- [ ] **Step 2: Run the relevant validation to make sure it still fails**

Run: `pnpm vitest run tests/integration/case-workspace-page.test.tsx`
Expected: FAIL until the Larkspur intro bundle is present and wired into the page behavior.

- [ ] **Step 3: Add the authored content and docs**

Copy the supplied Larkspur transcript and audio into `content/cases/larkspur-dead-air/introduction/`.

Update `docs/create-a-new-case.md` so it:
- explains the optional `introduction/` folder
- shows where `transcript.md` and `audio.mp3` live
- notes that replay is handled through `intro=1`
- keeps the intro separate from evidence authoring

- [ ] **Step 4: Re-run the validation and build**

Run:

```bash
pnpm vitest run tests/integration/case-workspace-page.test.tsx
pnpm validate:cases
pnpm build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add content/cases/larkspur-dead-air/introduction/transcript.md content/cases/larkspur-dead-air/introduction/audio.mp3 docs/create-a-new-case.md tests/integration/case-workspace-page.test.tsx
git commit -m "feat: add larkspur case intro"
```

## Handoff

- After Chunk 4 is complete and `pnpm build` passes, the implementation should be ready for a final review/merge pass.
- Keep the unrelated workspace changes out of these commits unless a chunk explicitly calls for them.
