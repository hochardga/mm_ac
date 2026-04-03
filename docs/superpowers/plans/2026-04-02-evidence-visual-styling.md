# Evidence Visual Styling Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give each evidence family a distinct archival visual treatment, with scanned-paper styling for documents and subtype-aware presentation variations across the other evidence viewers.

**Architecture:** Keep the evidence loader and routing path unchanged. Add a small presentation-only helper layer for family labels and subtype variants, then update the family viewers to render different archival surfaces while preserving the same normalized evidence objects and interactions.

**Tech Stack:** Next.js App Router, React 19, Tailwind CSS, React Markdown, Vitest, Testing Library.

---

## Chunk 1: Shared shell, theme helpers, and paper markdown tone

### Task 1: Add a small presentation helper and upgrade the shared evidence shell

**Files:**
- Create: `/Users/gregoryhochard/Development/mm_ac/.worktrees/evidence-visual-styling/src/features/cases/components/evidence-visual-variants.ts`
- Modify: `/Users/gregoryhochard/Development/mm_ac/.worktrees/evidence-visual-styling/src/features/cases/components/evidence-panel-shell.tsx`
- Modify: `/Users/gregoryhochard/Development/mm_ac/.worktrees/evidence-visual-styling/src/features/cases/components/markdown-content.tsx`

- [ ] **Step 1: Write the failing test**

Create or update a focused unit test that expects the evidence shell to surface a family chip and the markdown renderer to support a paper tone.

Run: `pnpm test -- tests/unit/document-evidence-view.test.tsx`
Expected: FAIL because the family chip / paper tone hooks are not wired yet.

- [ ] **Step 2: Implement the shared presentation helpers**

Add a narrow helper module that maps `family` and `subtype` to presentation labels and base tone data, then update `EvidencePanelShell` to render the family chip and subtype chip with that shared lookup.

- [ ] **Step 3: Add paper tone support to markdown rendering**

Extend `MarkdownContent` with a tone/variant prop so document evidence can reuse the same markdown renderer with a light paper palette while case introductions and closing narratives can keep the dark tone.

- [ ] **Step 4: Re-run the focused test**

Run: `pnpm test -- tests/unit/document-evidence-view.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/cases/components/evidence-visual-variants.ts src/features/cases/components/evidence-panel-shell.tsx src/features/cases/components/markdown-content.tsx tests/unit/document-evidence-view.test.tsx
git commit -m "feat: add shared evidence presentation framing"
```

## Chunk 2: Document, photo, and audio surfaces

### Task 2: Make document evidence look scanned and family-specific

**Files:**
- Modify: `/Users/gregoryhochard/Development/mm_ac/.worktrees/evidence-visual-styling/src/features/cases/components/document-evidence-view.tsx`
- Create: `/Users/gregoryhochard/Development/mm_ac/.worktrees/evidence-visual-styling/tests/unit/document-evidence-view.test.tsx`

- [ ] **Step 1: Write the failing test**

Assert that a document evidence render shows a paper-like document treatment, including the new paper-tone markdown rendering and at least one visible scanned-document cue.

Run: `pnpm test -- tests/unit/document-evidence-view.test.tsx`
Expected: FAIL because the paper treatment is not present yet.

- [ ] **Step 2: Implement the scanned-document presentation**

Add a warm paper surface, scanned texture cues, document-specific metadata treatment, and subtype-aware variations for the common document subtypes (`case_brief`, `incident_form`, `memo`, `letter`, `transcript`, and related forms).

- [ ] **Step 3: Re-run the document test**

Run: `pnpm test -- tests/unit/document-evidence-view.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/features/cases/components/document-evidence-view.tsx tests/unit/document-evidence-view.test.tsx
git commit -m "feat: style document evidence like scanned paper"
```

### Task 3: Give photo evidence subtype-aware framing

**Files:**
- Modify: `/Users/gregoryhochard/Development/mm_ac/.worktrees/evidence-visual-styling/src/features/cases/components/photo-evidence-view.tsx`
- Modify: `/Users/gregoryhochard/Development/mm_ac/.worktrees/evidence-visual-styling/tests/unit/photo-evidence-view.test.tsx`

- [ ] **Step 1: Write the failing test**

Add a second photo-view test that expects a different visual treatment for a surveillance still or portrait-style photo than for a scene photo.

Run: `pnpm test -- tests/unit/photo-evidence-view.test.tsx`
Expected: FAIL on the new subtype-specific expectation.

- [ ] **Step 2: Implement the framed-photo variants**

Add distinct photo surfaces for scene shots, object close-ups, surveillance stills, found photos, and portrait cards, using borders, overlays, and layout differences instead of raw dark cards.

- [ ] **Step 3: Re-run the photo tests**

Run: `pnpm test -- tests/unit/photo-evidence-view.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/features/cases/components/photo-evidence-view.tsx tests/unit/photo-evidence-view.test.tsx
git commit -m "feat: give photo evidence framed presentation variants"
```

### Task 4: Turn audio evidence into a recorder deck

**Files:**
- Modify: `/Users/gregoryhochard/Development/mm_ac/.worktrees/evidence-visual-styling/src/features/cases/components/audio-evidence-view.tsx`
- Modify: `/Users/gregoryhochard/Development/mm_ac/.worktrees/evidence-visual-styling/tests/unit/audio-evidence-view.test.tsx`

- [ ] **Step 1: Write the failing test**

Assert that the audio viewer exposes a recorder-style surface, not just a flat player and transcript block.

Run: `pnpm test -- tests/unit/audio-evidence-view.test.tsx`
Expected: FAIL on the new recorder-surface expectation.

- [ ] **Step 2: Implement the audio deck treatment**

Add a waveform or meter strip, stronger provenance chips, and subtype-aware styling for voicemail, interview, dispatch, radio, and confession clips.

- [ ] **Step 3: Re-run the audio tests**

Run: `pnpm test -- tests/unit/audio-evidence-view.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/features/cases/components/audio-evidence-view.tsx tests/unit/audio-evidence-view.test.tsx
git commit -m "feat: style audio evidence like a recorder deck"
```

## Chunk 3: Record and thread presentation modes

### Task 5: Give record evidence a ledger and timeline mode

**Files:**
- Modify: `/Users/gregoryhochard/Development/mm_ac/.worktrees/evidence-visual-styling/src/features/cases/components/record-evidence-view.tsx`
- Modify: `/Users/gregoryhochard/Development/mm_ac/.worktrees/evidence-visual-styling/src/features/cases/components/record-table.tsx`
- Create: `/Users/gregoryhochard/Development/mm_ac/.worktrees/evidence-visual-styling/src/features/cases/components/record-timeline-view.tsx`
- Create: `/Users/gregoryhochard/Development/mm_ac/.worktrees/evidence-visual-styling/tests/unit/record-evidence-view.test.tsx`

- [ ] **Step 1: Write the failing test**

Add a test that expects the `timeline` subtype to render as a vertical chronology rather than a standard table.

Run: `pnpm test -- tests/unit/record-evidence-view.test.tsx`
Expected: FAIL because the timeline branch does not exist yet.

- [ ] **Step 2: Implement the record layout split**

Keep the table layout for standard record subtypes, but add a dedicated timeline presentation for `timeline` and give the general table a more ledger-like frame, stronger row bands, and clearer sort/filter chrome.

- [ ] **Step 3: Re-run the record tests**

Run: `pnpm test -- tests/unit/record-evidence-view.test.tsx tests/unit/record-table.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/features/cases/components/record-evidence-view.tsx src/features/cases/components/record-table.tsx src/features/cases/components/record-timeline-view.tsx tests/unit/record-evidence-view.test.tsx
git commit -m "feat: style record evidence as ledger and timeline views"
```

### Task 6: Make thread evidence read like a captured conversation

**Files:**
- Modify: `/Users/gregoryhochard/Development/mm_ac/.worktrees/evidence-visual-styling/src/features/cases/components/thread-evidence-view.tsx`
- Create: `/Users/gregoryhochard/Development/mm_ac/.worktrees/evidence-visual-styling/tests/unit/thread-evidence-view.test.tsx`

- [ ] **Step 1: Write the failing test**

Assert that thread evidence shows the thread metadata and message cards with the new transcript/chat framing.

Run: `pnpm test -- tests/unit/thread-evidence-view.test.tsx`
Expected: FAIL because the new message framing is not present yet.

- [ ] **Step 2: Implement the conversation styling**

Add channel chips, participant framing, stronger sender/timestamp hierarchy, and subtype-sensitive layouts for handler messages, interviews, and message logs.

- [ ] **Step 3: Re-run the thread test**

Run: `pnpm test -- tests/unit/thread-evidence-view.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/features/cases/components/thread-evidence-view.tsx tests/unit/thread-evidence-view.test.tsx
git commit -m "feat: style thread evidence like captured conversations"
```

## Chunk 4: Diagram and webpage capture surfaces, then validation

### Task 7: Give diagrams a drafting-board treatment

**Files:**
- Modify: `/Users/gregoryhochard/Development/mm_ac/.worktrees/evidence-visual-styling/src/features/cases/components/diagram-evidence-view.tsx`
- Modify: `/Users/gregoryhochard/Development/mm_ac/.worktrees/evidence-visual-styling/tests/unit/diagram-evidence-view.test.tsx`

- [ ] **Step 1: Write the failing test**

Assert that the diagram viewer exposes a blueprint/map surface and not only the raw SVG frame.

Run: `pnpm test -- tests/unit/diagram-evidence-view.test.tsx`
Expected: FAIL on the new drafting-surface expectation.

- [ ] **Step 2: Implement the drafting presentation**

Add subtype-sensitive background treatments for maps, floorplans, site diagrams, and route sketches, plus a stronger legend presentation and clearer frame hierarchy.

- [ ] **Step 3: Re-run the diagram test**

Run: `pnpm test -- tests/unit/diagram-evidence-view.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/features/cases/components/diagram-evidence-view.tsx tests/unit/diagram-evidence-view.test.tsx
git commit -m "feat: style diagram evidence like drafted plans"
```

### Task 8: Turn webpages into cached browser captures

**Files:**
- Modify: `/Users/gregoryhochard/Development/mm_ac/.worktrees/evidence-visual-styling/src/features/cases/components/webpage-evidence-view.tsx`
- Modify: `/Users/gregoryhochard/Development/mm_ac/.worktrees/evidence-visual-styling/tests/unit/webpage-evidence-view.test.tsx`

- [ ] **Step 1: Write the failing test**

Assert that webpage evidence shows the new browser chrome or capture framing instead of generic stacked cards.

Run: `pnpm test -- tests/unit/webpage-evidence-view.test.tsx`
Expected: FAIL on the browser-capture expectation.

- [ ] **Step 2: Implement the captured-page layouts**

Add browser chrome, page source labeling, and subtype-aware block styling for directory listings, company sites, classified ads, portal screens, and schedule sites.

- [ ] **Step 3: Re-run the webpage tests**

Run: `pnpm test -- tests/unit/webpage-evidence-view.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/features/cases/components/webpage-evidence-view.tsx tests/unit/webpage-evidence-view.test.tsx
git commit -m "feat: style webpage evidence as cached page captures"
```

### Task 9: Run the full verification pass

**Files:**
- Modify: none expected

- [ ] **Step 1: Run the full unit suite**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 2: Run the production build**

Run: `pnpm build`
Expected: PASS

- [ ] **Step 3: Review the worktree and stage the final changes**

Run: `git status --short`
Expected: only the intended evidence-styling files and the two design/plan docs should appear as tracked changes.

- [ ] **Step 4: Commit the finished implementation**

```bash
git add docs/superpowers/specs/2026-04-02-evidence-visual-styling-design.md docs/superpowers/plans/2026-04-02-evidence-visual-styling.md src/features/cases/components tests/unit
git commit -m "feat: add visual styling for evidence families"
```
