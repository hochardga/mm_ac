# Case Closing Narration Implementation Plan

> **For agentic workers:** REQUIRED: Use @superpowers:subagent-driven-development (if subagents available) or @superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the debrief narrative paragraph with status-specific closing narration bundles, while keeping cases without closing content on the current fallback path.

**Architecture:** Add one case-local loader that resolves `closing/solved` or `closing/closed-unsolved` bundles and returns transcript/audio metadata. Thread that bundle through `getDebrief()` so the debrief page can render an inline narrated panel only when content exists, falling back to the existing paragraph for legacy cases. Keep audio serving on the existing case asset route and author the first bundles on the cases already covered by debrief regression tests.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Drizzle ORM, Vitest, Testing Library

---

## Preflight

- Keep the approved spec open at `docs/superpowers/specs/2026-04-02-case-closing-narration-design.md`.
- Do not touch the unrelated untracked workspace directories.
- Follow the existing case introduction patterns for loader shape, markdown rendering, and autoplay fallback.
- Run focused tests after each task and `pnpm build` before the final handoff.

## Chunk 1: Closing Bundle Loader and Debrief Data Contract

### Task 1: Add the closing bundle loader and expose it from `getDebrief`

**Files:**
- Create: `src/features/cases/load-case-closing.ts`
- Modify: `src/features/debrief/get-debrief.ts`
- Test: `tests/unit/load-case-closing.test.ts`

- [ ] **Step 1: Write the failing loader tests**

```ts
test("returns null when the closing folder is missing", async () => {});
test("loads a solved closing bundle with transcript and optional audio", async () => {});
test("loads a closed-unsolved closing bundle with transcript-only fallback", async () => {});
test("returns null when transcript.md is missing or empty", async () => {});
```

- [ ] **Step 2: Run the focused unit tests to confirm they fail**

Run: `pnpm vitest run tests/unit/load-case-closing.test.ts`
Expected: FAIL because the loader does not exist yet.

- [ ] **Step 3: Implement the minimal closing loader and debrief contract**

Implement `loadCaseClosing(slug, status)` so it:
- maps `completed` to `closing/solved`
- maps `closed_unsolved` to `closing/closed-unsolved`
- requires `transcript.md`
- treats `audio.mp3` (preferred) or `audio.m4a` (fallback) as optional
- returns `null` when the bundle is missing or invalid

Extend `getDebrief()` so it loads the closing bundle after terminal-case validation and returns it as a `closingNarrative` field alongside the existing title, summary, solution, and attempt history.

- [ ] **Step 4: Re-run the loader tests**

Run: `pnpm vitest run tests/unit/load-case-closing.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/cases/load-case-closing.ts src/features/debrief/get-debrief.ts tests/unit/load-case-closing.test.ts
git commit -m "feat: add case closing loader"
```

## Chunk 2: Inline Closing Panel and Debrief Page Wiring

### Task 2: Render the closing bundle inline on the debrief page

**Files:**
- Create: `src/features/cases/components/case-closing-narrative.tsx`
- Modify: `src/app/(app)/cases/[caseSlug]/debrief/page.tsx`
- Test: `tests/unit/case-closing-narrative.test.tsx`
- Test: `tests/integration/debrief-page.test.tsx`

- [ ] **Step 1: Write the failing UI and page tests**

```ts
test("renders transcript-only closing narration when audio is absent", async () => {});
test("attempts autoplay and reveals a play button when blocked", async () => {});
test("renders the solved closing bundle on the solved debrief page", async () => {});
test("renders the closed-unsolved closing bundle on the closed-unsolved debrief page", async () => {});
test("falls back to the existing outcome paragraph when no closing bundle exists", async () => {});
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `pnpm vitest run tests/unit/case-closing-narrative.test.tsx tests/integration/debrief-page.test.tsx`
Expected: FAIL because the component and debrief wiring do not exist yet.

- [ ] **Step 3: Implement the narrated inline panel and page swap**

Implement `CaseClosingNarrative` as a client component that:
- renders the audio player first and the markdown transcript below it
- uses the existing markdown renderer for authored text
- attempts autoplay on mount when audio exists
- shows a visible play button when autoplay is blocked
- remains transcript-only when no audio is present

Update the debrief page so it:
- keeps the current header, outcome badge, report recap cards, and attempt history
- renders the closing bundle inside the outcome card where the current narrative paragraph lives
- keeps the current short outcome paragraph as a fallback when `closingNarrative` is null

- [ ] **Step 4: Re-run the component and page tests**

Run: `pnpm vitest run tests/unit/case-closing-narrative.test.tsx tests/integration/debrief-page.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/cases/components/case-closing-narrative.tsx src/app/(app)/cases/[caseSlug]/debrief/page.tsx tests/unit/case-closing-narrative.test.tsx tests/integration/debrief-page.test.tsx
git commit -m "feat: render case closing narration"
```

## Chunk 3: Authoring Docs and Initial Closing Bundles

### Task 3: Document the closing folder convention and seed the first bundles

**Files:**
- Modify: `docs/create-a-new-case.md`
- Create: `content/cases/hollow-bishop/closing/solved/transcript.md`
- Create: `content/cases/hollow-bishop/closing/solved/audio.mp3` or `content/cases/hollow-bishop/closing/solved/audio.m4a`
- Create: `content/cases/red-harbor/closing/closed-unsolved/transcript.md`
- Create: `content/cases/red-harbor/closing/closed-unsolved/audio.mp3` or `content/cases/red-harbor/closing/closed-unsolved/audio.m4a`
- Modify: `tests/unit/create-a-new-case.test.ts`

- [ ] **Step 1: Write the failing docs and regression tests**

```ts
test("new case docs mention the closing folder convention and fallback behavior", async () => {});
test("solved debrief pages keep the closing narration out of the evidence index", async () => {});
test("closed-unsolved debrief pages show the matching closing narration", async () => {});
```

- [ ] **Step 2: Run the docs and integration tests to confirm they fail**

Run: `pnpm vitest run tests/unit/create-a-new-case.test.ts tests/integration/debrief-page.test.tsx`
Expected: FAIL until the docs and case-local closing bundles exist.

- [ ] **Step 3: Add the authored closing content and docs**

Add the new `closing/` folder guidance to `docs/create-a-new-case.md` so it explains:
- the `closing/solved/` and `closing/closed-unsolved/` folder structure
- that `transcript.md` is required and `audio.mp3` (preferred) or `audio.m4a` (fallback) is optional
- that closing narration is separate from `protected.json` and the evidence index
- that cases without a closing bundle fall back to the current debrief paragraph

Seed the first closing bundles on the existing debrief regression cases:
- `content/cases/hollow-bishop/closing/solved/transcript.md`
- `content/cases/hollow-bishop/closing/solved/audio.mp3` or `content/cases/hollow-bishop/closing/solved/audio.m4a`
- `content/cases/red-harbor/closing/closed-unsolved/transcript.md`
- `content/cases/red-harbor/closing/closed-unsolved/audio.mp3` or `content/cases/red-harbor/closing/closed-unsolved/audio.m4a`

If the final narrated MP3 assets are not yet available, keep the path contract in place and use transcript-only content for the corresponding bundle until the audio is ready.

Update `tests/unit/create-a-new-case.test.ts` so it checks the authoring guide now mentions the closing folder and fallback behavior.

- [ ] **Step 4: Re-run the docs and full-debrief tests**

Run:

```bash
pnpm vitest run tests/unit/create-a-new-case.test.ts tests/integration/debrief-page.test.tsx
pnpm validate:cases
pnpm build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add docs/create-a-new-case.md content/cases/hollow-bishop/closing/solved/transcript.md content/cases/hollow-bishop/closing/solved/audio.mp3 content/cases/red-harbor/closing/closed-unsolved/transcript.md content/cases/red-harbor/closing/closed-unsolved/audio.mp3 tests/unit/create-a-new-case.test.ts
git commit -m "feat: add case closing content"
```

## Handoff

- After Chunk 3 is complete and `pnpm build` passes, the closing narration feature should be ready for final review or merge.
- Keep the scope tight: no new route, no new database columns, and no changes to the existing introduction flow.
