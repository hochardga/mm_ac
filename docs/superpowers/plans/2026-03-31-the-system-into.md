# The System Introduction Page Implementation Plan

> **For agentic workers:** REQUIRED: Use `@superpowers:subagent-driven-development` if subagents are available, or `@superpowers:executing-plans` to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a hidden authenticated dossier page at `/the-system-intro` with transcript-preserving rendering, autoplay narration, and a clear vault CTA.

**Architecture:** Keep the page as a standalone authenticated route under the app tree, not part of the shell chrome. Load the page content from a dedicated `content/the-system-intro/` bundle, render the transcript in a centered dossier panel, and use a small client component to handle autoplay and fallback playback controls. Serve the narration from a protected Node route so the page stays behind login end to end.

**Tech Stack:** Next.js App Router, React 19, TypeScript, NextAuth middleware, Node `fs`/stream APIs, Vitest, Testing Library

---

## Preflight

- Start implementation in a fresh git worktree rooted at this repository.
- Keep the approved spec open at `docs/superpowers/specs/2026-03-31-the-system-intro-design.md`.
- Do not add the hidden page to navigation, vault cards, or any other visible link surface.
- Keep the page-specific content bundle separate from `content/cases/*`.
- Run focused tests after every task and `pnpm build` before the final handoff.

## Chunk 1: Auth Boundary and Intro Loader

### Task 1: Add protection for the hidden route and loader contract

**Files:**
- Modify: `src/lib/route-protection.ts`
- Modify: `src/proxy.ts`
- Create: `src/features/the-system-intro/load-system-intro.ts`
- Test: `tests/unit/system-intro-loader.test.ts`
- Test: `tests/integration/auth-route.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
test("treats /the-system-intro and its audio endpoint as protected", () => {});
test("loads transcript and optional audio from the system intro bundle", () => {});
test("returns null when transcript.md is missing or empty", () => {});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm vitest run tests/unit/system-intro-loader.test.ts tests/integration/auth-route.test.ts`
Expected: FAIL because the route protection rules and intro loader do not exist yet.

- [ ] **Step 3: Implement the minimal loader and protection rules**

Implement `loadSystemIntro` so it:
- reads `content/the-system-intro/transcript.md`
- returns `null` when the transcript is missing, empty, or unreadable
- treats `audio.mp3` as optional
- preserves the transcript text formatting instead of normalizing it into paragraphs

Update `isProtectedPath` and the middleware matcher so the hidden page and its audio route are both treated as protected routes.

- [ ] **Step 4: Run the focused tests again**

Run: `pnpm vitest run tests/unit/system-intro-loader.test.ts tests/integration/auth-route.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/route-protection.ts src/proxy.ts src/features/the-system-intro/load-system-intro.ts tests/unit/system-intro-loader.test.ts tests/integration/auth-route.test.ts
git commit -m "feat: add system intro auth and loader"
```

## Chunk 2: Page Shell and Playback Panel

### Task 2: Build the centered dossier page and autoplay fallback

**Files:**
- Create: `src/app/(app)/the-system-intro/page.tsx`
- Create: `src/features/the-system-intro/components/system-intro-panel.tsx`
- Test: `tests/unit/system-intro-panel.test.tsx`
- Test: `tests/integration/system-intro-page.test.tsx`

- [ ] **Step 1: Write the failing UI tests**

```ts
test("authenticated page renders the transcript and vault CTA", async () => {});
test("the page keeps transcript formatting intact", async () => {});
test("autoplay success leaves the panel in the playing state", async () => {});
test("autoplay rejection exposes a visible play control", async () => {});
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `pnpm vitest run tests/unit/system-intro-panel.test.tsx tests/integration/system-intro-page.test.tsx`
Expected: FAIL because the page and panel do not exist yet.

- [ ] **Step 3: Implement the page and client panel**

Implement `page.tsx` so it:
- loads the intro bundle on the server
- fails closed if the transcript is missing
- renders a single centered dossier surface with one primary vault CTA
- stays outside the shell layout so no normal navigation chrome appears

Implement `system-intro-panel.tsx` so it:
- renders the narration audio above the transcript
- attempts autoplay on mount
- exposes a visible `Play Audio` fallback if autoplay is blocked
- renders the transcript as preserved script text, not as wrapped prose
- keeps `/vault` as the only in-page action

- [ ] **Step 4: Re-run the UI tests**

Run: `pnpm vitest run tests/unit/system-intro-panel.test.tsx tests/integration/system-intro-page.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/(app)/the-system-intro/page.tsx src/features/the-system-intro/components/system-intro-panel.tsx tests/unit/system-intro-panel.test.tsx tests/integration/system-intro-page.test.tsx
git commit -m "feat: add system intro page shell"
```

## Chunk 3: Protected Audio Route and Content Bundle

### Task 3: Serve the narration file and land the authored content

**Files:**
- Create: `src/app/api/the-system-intro/audio/route.ts`
- Create: `content/the-system-intro/transcript.md`
- Create: `content/the-system-intro/audio.mp3`
- Test: `tests/integration/system-intro-audio-route.test.ts`

- [ ] **Step 1: Write the failing route test**

```ts
test("serves the narration audio for authenticated requests", async () => {});
test("returns 404 when the narration file is missing", async () => {});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run tests/integration/system-intro-audio-route.test.ts`
Expected: FAIL because the audio route and authored content are missing.

- [ ] **Step 3: Implement the route and add the authored files**

Implement the audio route so it:
- reads `content/the-system-intro/audio.mp3`
- streams the file from Node
- returns the correct audio content type
- relies on the existing auth boundary for protection

Copy the supplied transcript and audio files into `content/the-system-intro/`.

- [ ] **Step 4: Re-run the route test and build**

Run:

```bash
pnpm vitest run tests/integration/system-intro-audio-route.test.ts
pnpm build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/the-system-intro/audio/route.ts content/the-system-intro/transcript.md content/the-system-intro/audio.mp3 tests/integration/system-intro-audio-route.test.ts
git commit -m "feat: serve system intro audio"
```

## Handoff

- After Chunk 3 is complete and `pnpm build` passes, the feature is ready for final review.
- Keep unrelated untracked workspace artifacts out of these commits unless a chunk explicitly calls for them.
