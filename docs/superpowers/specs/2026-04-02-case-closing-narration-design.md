# Case Closing Narration Design

Date: 2026-04-02

## Summary

Replace the generic debrief narrative paragraph with an authored, status-specific case closing bundle that can include a transcript and optional audio. The closing content should live in a separate case-local `closing/` folder, stay out of `protected.json`, and render differently for solved versus closed-unsolved outcomes.

The debrief page should keep its current title, summary, outcome badge, report recaps, and attempt history. Only the narrative paragraph underneath the outcome header changes: when a closing bundle exists, it becomes an audio-first transcript panel; when a bundle is absent, the page falls back to the current short outcome paragraph so older cases continue to work.

## Goals

- Replace the current debrief narrative paragraph with status-specific closing narration.
- Keep closing narration separate from `protected.json` and the evidence index.
- Support both solved and closed-unsolved closing copy.
- Require a transcript, allow optional audio, and degrade gracefully to transcript-only.
- Reuse the existing case asset route for audio instead of adding a new media endpoint.
- Keep cases without a closing folder working with the current fallback paragraph.

## Non-Goals

- Do not change report grading, case progression, or terminal status logic.
- Do not add a new route, modal, or replay mechanism for closing narration.
- Do not move the debrief title or summary out of the existing terminal debrief flow.
- Do not introduce a new evidence family or make closing narration visible in the evidence index.
- Do not require every published case to ship with closing narration immediately.
- Do not change the existing introduction flow.

## Approaches Considered

### Recommended: Status-specific closing bundle with inline narrated panel

Load a small case-local closing bundle for the terminal status and render it directly in the debrief page where the current paragraph lives. The panel can autoplay audio when allowed, fall back to a visible play button when blocked, and always keep the transcript visible.

Pros:

- Matches the user request closely.
- Keeps the debrief flow on a single page.
- Uses the same content shape as the introduction without adding a second overlay system.
- Preserves backward compatibility by falling back when a bundle is absent.

Cons:

- Requires a new loader and a small client component.
- Adds one more content folder convention for authors.

### Inline text only in `protected.json`

Keep the closing copy as plain text fields in `protected.json` and optionally point to audio files separately.

Pros:

- Smallest data-model change.
- Easy to read from the debrief loader.

Cons:

- Mixes authored narrative with terminal metadata.
- Does not satisfy the separate-folder direction.
- Makes audio feel bolted on instead of authored as a bundle.

### Separate closing route or modal

Send players to a dedicated closing page or overlay before showing the debrief recap.

Pros:

- Strong cinematic separation.
- Could support more elaborate presentation later.

Cons:

- Adds navigation and state complexity for little gain.
- Competes with the existing terminal debrief page.
- Over-engineers a feature that should stay lightweight.

## Selected Architecture

### Content contract

- Add an optional `closing/` folder under each case root.
- The folder contains one subfolder per terminal outcome:
  - `closing/solved/transcript.md`
  - `closing/solved/audio.mp3`
  - `closing/closed-unsolved/transcript.md`
  - `closing/closed-unsolved/audio.mp3`
- `transcript.md` is required for a closing bundle to count as present.
- `audio.mp3` is optional.
- If the transcript is missing, unreadable, or empty, the loader returns `null`.
- If audio is present without a valid transcript, the bundle still does not count as present.
- The loader maps `completed` to `solved` and `closed_unsolved` to `closed-unsolved`.

This keeps closing narration separate from manifest metadata and from the evidence rail, while still giving authors a simple folder-based convention.

### Loading and data flow

- Add `loadCaseClosing(slug, status)` beside the existing case introduction loader.
- The loader should read the terminal-status subfolder, return `{ transcript, audioPath? }` when valid, and return `null` when absent.
- Extend `getDebrief()` so it loads the closing bundle after it has confirmed the case is terminal and has resolved the case slug.
- Add a `closingNarrative` field to the debrief summary it returns.
- The debrief page should render that field in place of the current narrative paragraph.
- If `closingNarrative` is `null`, the page should keep the existing short outcome paragraph as a fallback.
- Audio should use the existing case asset URL helper and the existing `/api/cases/[caseSlug]/assets/...` route, which already serves audio files by extension.

This keeps the debrief page self-contained and avoids introducing any new auth or media serving surface.

### UI composition

- Keep the current `CaseReturnHeader`, outcome badge, report recap cards, and attempt history.
- Replace the paragraph in the outcome card with a new `CaseClosingNarrative` client component when a bundle exists.
- The component should render audio first, then the markdown transcript.
- The transcript should use the existing markdown renderer so authored formatting stays consistent.
- The component should attempt autoplay on mount when audio exists.
- If autoplay is blocked, show a visible play button and keep the transcript visible.
- If audio is missing, render transcript-only without any broken controls.

The result should feel like the intro pattern, but inline and terminal rather than modal-based.

### Backward compatibility and fallback behavior

- Cases without a `closing/` folder should continue to render the current short narrative paragraph.
- Cases with only one status-specific bundle should only replace the paragraph for that status.
- Audio load failures should not block the debrief page or hide the transcript.
- The existing debrief title and summary remain the source of truth for the page header.
- No database migration is needed for the closing bundle itself.

## Error Handling

- If the closing transcript is missing or blank, treat the bundle as absent and use the existing paragraph fallback.
- If the closing audio file is missing, render transcript-only.
- If the case is not terminal, keep the existing debrief availability checks unchanged.
- If `getDebrief()` cannot resolve the protected case or manifest labels, keep the current error behavior rather than rendering partial closing content.
- If the audio request fails after render, the transcript must still remain visible and readable.

## Testing Strategy

Required coverage:

- unit tests for `loadCaseClosing()` covering:
  - solved bundle loads
  - closed-unsolved bundle loads
  - transcript-only bundle loads
  - missing or empty transcript returns `null`
- unit tests for the client closing narration component covering:
  - transcript rendering
  - autoplay attempt on mount
  - play-button fallback when autoplay is blocked
- integration tests for the debrief page covering:
  - solved cases render the solved closing bundle in place of the old paragraph
  - closed-unsolved cases render the closed-unsolved closing bundle in place of the old paragraph
  - cases without a closing bundle still fall back to the current paragraph
- docs coverage in `docs/create-a-new-case.md` explaining the new `closing/` folder convention

The tests should focus on content and behavior, not on brittle layout details.

## Assumptions

- Replacing the narrative paragraph is enough; the rest of the debrief page should stay as-is.
- A fallback paragraph is the right compatibility story for cases that do not yet have authored closing content.
- The first rollout should include closing bundles for the cases used in debrief regression coverage so the feature is visible immediately.

## Files And Responsibilities

### Create

- `src/features/cases/load-case-closing.ts`: load the optional status-specific closing bundle and return a normalized object or `null`.
- `src/features/cases/components/case-closing-narrative.tsx`: render the closing audio and transcript inline on the debrief page.
- `content/cases/<slug>/closing/solved/transcript.md`: authored closing transcript for solved cases.
- `content/cases/<slug>/closing/solved/audio.mp3`: optional solved closing audio.
- `content/cases/<slug>/closing/closed-unsolved/transcript.md`: authored closing transcript for closed-unsolved cases.
- `content/cases/<slug>/closing/closed-unsolved/audio.mp3`: optional closed-unsolved closing audio.

### Modify

- `src/features/debrief/get-debrief.ts`: load the closing bundle and expose it in the debrief summary.
- `src/app/(app)/cases/[caseSlug]/debrief/page.tsx`: render the closing bundle in place of the current narrative paragraph when present.
- `docs/create-a-new-case.md`: document the new optional closing folder structure and fallback behavior.
- `tests/unit/load-case-closing.test.ts`: cover bundle loading, missing-transcript behavior, and transcript-only fallback.
- `tests/unit/case-closing-narrative.test.tsx`: cover autoplay behavior and transcript rendering.
- `tests/integration/debrief-page.test.tsx`: cover solved and closed-unsolved closing narration rendering.

## Rollout

1. Add the closing loader and the inline narrated transcript component.
2. Wire the closing bundle into `getDebrief()` and the debrief page.
3. Author closing bundles for the current debrief regression cases.
4. Update the case authoring docs with the new folder convention.
5. Verify the page still falls back cleanly when a case has no closing bundle.

