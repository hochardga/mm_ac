# Case Introduction Design

Date: 2026-03-31

## Summary

Add an optional, non-evidence case introduction that can auto-open the first time a player opens a case, play a short audio narration, and show the transcript in the same modal. The introduction should feel like part of the case opening, not like another evidence card, and it should be replayable later from the case header.

The first rollout should use the supplied Larkspur narration assets, but the feature itself must be case-agnostic so other cases can opt in by adding the same authored folder structure.

## Goals

- Present an immersive opening introduction above the dossier without adding it to the evidence index.
- Auto-open the introduction once per player case when a case is opened for the first time.
- Show transcript and audio together, with transcript always visible.
- Allow players to replay the introduction later without re-reading evidence state.
- Reuse the existing modal/focus behavior instead of inventing a second overlay system.
- Keep cases without an introduction unchanged.

## Non-Goals

- Do not convert the introduction into an evidence family.
- Do not change stage progression, objectives, report submission, or debrief logic.
- Do not make autoplay a hard requirement.
- Do not build a general media CMS or upload flow.
- Do not require every case to ship with an introduction.
- Keep the shared asset helper scope narrow: only the case-local path resolver and URL builder needed by photo and intro audio.
- Do not re-show an introduction to an existing player case just because the case content revision changes; that would be a separate feature.

## Approaches Considered

### Recommended: Full-screen modal with replay button

Open a dedicated modal on first visit, auto-play audio when the browser allows it, and keep a replay link in the case header for later. This makes the introduction feel cinematic without polluting the evidence rail.

### Inline top-of-page panel

Place the introduction directly under the hero/header as a visible section. This is easy to understand, but it weakens the sense of a deliberate opening and competes with the dossier layout.

### Collapsed expandable section

Render the introduction as a foldout or accordion. This is the least intrusive option, but it makes the opening feel optional in a way that undercuts the intended emotional beat.

## Selected Architecture

### Content contract

- Add an optional `introduction/` folder under each case root.
- The folder should contain `transcript.md`; `audio.mp3` is optional but supported.
- The introduction is loaded separately from the case manifest and evidence index.
- The transcript is plain markdown and is rendered with the existing markdown viewer stack.
- No manifest schema change is required just to support the introduction.
- When audio is present, the modal should try to play it automatically; if audio is absent or cannot play, the transcript-only intro still counts as a valid introduction.

For the first rollout, `content/cases/larkspur-dead-air/introduction/` should hold the supplied narration transcript and audio file.

### Loading and persistence

- Add a case-introduction loader that checks for the optional folder and returns `null` when it is absent.
- The page should load the introduction bundle alongside the manifest, then decide whether to auto-open it.
- Add a nullable `introduction_seen_at` column to `player_cases`.
- Define the page state as `shouldOpen = intro=1 OR (hasIntroduction && introduction_seen_at IS NULL)`.
- The authoritative query keys are `intro=1` for replay/open and `evidence=<evidenceId>` for the existing evidence selection flow.
- When `shouldOpen` is true, the modal should invoke a `markIntroductionSeenAction` once it mounts in the hydrated browser.
- `markIntroductionSeenAction` must only set `introduction_seen_at` when it is still null, and it should be idempotent if two tabs race.
- The action must only run from the hydrated client modal mount, never from server render.
- The intro write should happen only after `openCase` has produced a real `player_case` row; if the row is missing or the action fails, continue rendering the page and treat the write as best-effort.
- “Seen” means the intro has been opened at least once for that player case, not that playback completed or the user waited to close it.
- Reopen behavior should be URL-driven, not database-driven: a replay link can add `intro=1` to the case URL without changing the existing seen timestamp.
- Only `intro=1` is the explicit replay/open trigger; auto-open happens only when `introduction_seen_at` is null.
- If an evidence query is present on the same request, the introduction takes precedence on the first render and the evidence dialog should stay suppressed until the introduction closes.
- When the intro is open, do not call `rememberViewedEvidence` or pass a selected evidence into the workspace for that request.
- When the intro closes, remove only `intro` from the URL. Preserve `evidence`, the current hash, and any other case-local state so the evidence dialog can open afterward if `evidence` is still present.
- Because the evidence dialog is keyed off the current URL, removing only `intro` is enough to let an existing `evidence` query render the evidence modal on the next render or client-side state update.
- If `intro=1` is present but no valid introduction bundle exists, the page should `redirect()` before any intro modal render or seen-write; the redirect should preserve all other search params and behave like the normal server-side case-page redirect path.

This keeps the “first open only” behavior simple while still giving the player an explicit replay path.

### State Sequence

- `openCase` returns the pinned `player_case` row and case revision first.
- The page then loads the optional introduction bundle and computes `shouldOpen`.
- If `shouldOpen` is true, the intro modal renders open and the hydrated client effect can call `markIntroductionSeenAction`.
- If the intro bundle is missing and `intro=1` is present, the page redirects before any modal render or seen-write.

### Content validation rules

- `transcript.md` is required for an introduction bundle to count as present.
- `audio.mp3` is optional for the bundle contract, but the first Larkspur rollout will include it.
- If `transcript.md` is missing, empty, or unreadable, the introduction loader should return `null` and the page should behave as if no introduction exists.
- If `audio.mp3` exists without a valid transcript, the introduction still does not count as present.
- If `transcript.md` exists and `audio.mp3` is missing, the intro may still render transcript-only.
- The shared asset route must only expose the existing case-local photo asset paths it already serves today, plus the new `introduction/audio.mp3` path. Markdown, JSON, and arbitrary case-local binaries are not downloadable through the asset route.
- This allowlist must not reduce current behavior for existing photo evidence; it keeps the current photo asset paths and only adds the intro audio path to what is already served today.

### UI composition

- Introduce a new `CaseIntroductionModal` component that uses the same portal, focus trap, and escape-to-close behavior as the existing evidence dialog.
- The modal should render the audio player first, with the transcript visible in the same modal body.
- On desktop, use a two-column or media-first layout if space allows.
- On mobile, collapse to a stacked layout with the player above the transcript.
- The modal title should be `Introduction`, not `Story` or `Briefing`.
- The case header should gain a small `Replay Introduction` action when an introduction exists.
- Show the replay action only when `loadCaseIntroduction` returns a valid bundle, not merely when the folder exists.
- The replay action should preserve any existing evidence selection query so it does not wipe the player’s current place in the dossier.
- The replay action should open the same modal through `intro=1`, not through a separate state channel.
- The modal should have a close button, `role="dialog"`, `aria-modal="true"`, and an accessible label that includes the case name, while the visible title remains `Introduction`.
- Escape should close the modal, and focus should return to the opener when one exists or the case header area when the intro auto-opened.
- Closing the modal should use client-side URL replacement to remove only `intro` and preserve the rest of the URL state.
- While the intro is open, the evidence dialog must not mount in the background even if `evidence=` is still present.
- The modal should include a custom `Play Introduction` button so the fallback focus target is deterministic.
- Initial focus should land on the close button for a normal auto-open, or on the play button if autoplay is blocked.
- The transcript region should be labelled by the modal heading so screen readers can jump between the player and the narrative text.

### Audio playback behavior

- Attempt autoplay whenever the intro modal opens, including the first auto-open and any explicit `intro=1` replay open.
- If the browser blocks playback, show a visible `Play Introduction` control and keep the transcript accessible.
- If the audio asset fails to load, degrade gracefully to transcript-only rather than failing the case page.
- Transcript visibility must never depend on successful playback.
- Audio asset serving should support byte-range requests so the browser can seek or stream the introduction normally.
- For audio responses, support `Range: bytes=...`, return `206` plus `Content-Range`, `Content-Type: audio/mpeg`, and the correct `Content-Length` for valid partials, `416` for invalid ranges, and advertise `Accept-Ranges: bytes`.
- For v1, only the Larkspur `.mp3` narration needs to be served; multipart ranges, waveform UI, and transcoding are out of scope.
- For a normal `GET` without `Range`, return the full file with `200`. `HEAD` is not required for v1.
- Keep the authorization model the same as the existing case asset route: case-local traversal protection, no cross-case reads, and no additional auth surfaces.
- No special cache headers are required beyond the current route behavior.
- Keep the asset route on the Node.js runtime so it can stream from the filesystem and satisfy range requests; Edge runtime is out of scope.
- When the user closes the intro, stop or pause audio and restart from the beginning on the next open rather than resuming mid-stream.

### Larkspur rollout

- Add the supplied Larkspur transcript and audio into the new introduction folder.
- Keep the existing `Opening Brief` evidence item separate unless a later content pass intentionally revises it.
- Do not add the introduction to the evidence index, stage unlocks, or active objectives.
- The introduction is shown once per `player_case`, not once per revision.
- The product meaning of `introduction_seen_at` is intentional: “seen” here means “opened at least once,” not “finished playing.”

## Definition Of Done

- Cases without an `introduction/` folder behave exactly as they do today.
- The intro never appears in the evidence index.
- No extra database writes happen for cases without an introduction.
- No replay action appears for cases without an introduction.
- The intro opens exactly once per `player_case` the first time it is seen.
- `introduction_seen_at` is written the first time the intro modal opens and only when it is still null.
- `intro=1` replays the intro without overwriting an existing seen timestamp.
- Closing the intro preserves `evidence` so the evidence modal can appear afterward if that query is still present.
- Autoplay blocks and audio load failures still leave the transcript visible.
- `intro=1` on a case without a valid intro bundle falls back to normal case behavior instead of leaving a dead modal state.
- The replay button only appears when the loader returns a valid introduction bundle, not merely when the folder exists.

## Files And Responsibilities

### Create

- `src/features/cases/load-case-introduction.ts`: load the optional introduction bundle and return a normalized object or `null`.
- `src/features/cases/case-asset.ts`: shared safe case-asset resolver with traversal protection and content-type lookup for both image and audio assets.
- `src/features/cases/case-asset-url.ts`: shared URL builder for case-local assets.
- `src/features/cases/components/case-introduction-modal.tsx`: the reusable modal for the intro narration and transcript.
- `content/cases/larkspur-dead-air/introduction/transcript.md`: the first authored introduction transcript.
- `content/cases/larkspur-dead-air/introduction/audio.mp3`: the first authored introduction audio.

### Modify

- `src/app/(app)/cases/[caseSlug]/page.tsx`: load introduction data and wire intro open/replay state from query params.
- `src/app/(app)/cases/[caseSlug]/actions.ts`: add the intro-seen server action invoked when the modal mounts open in the browser.
- `src/components/case-return-header.tsx`: add the replay action for cases that have an introduction.
- `src/db/schema.ts`: add `player_cases.introduction_seen_at`.
- `src/db/migrations/*`: add the schema migration for the new column.
- `src/app/api/cases/[caseSlug]/assets/[...assetPath]/route.ts`: serve audio assets through the same safe route as images.
- `docs/create-a-new-case.md`: document the new optional introduction folder and replay behavior for case authors.
- `tests/integration/case-workspace-page.test.tsx`: verify the modal auto-opens once and the evidence index remains untouched.
- `tests/integration/case-navigation.test.tsx`: verify the replay link and return navigation semantics.
- `tests/unit/load-case-introduction.test.ts`: cover optional bundle loading and missing-folder behavior.
- `tests/unit/case-introduction-modal.test.tsx`: cover transcript rendering, focus behavior, and autoplay fallback.
- `tests/integration/case-asset-route.test.ts`: cover audio content type support and safe asset resolution.

## Verification

The implementation should be considered done only after the relevant tests pass and the repository builds cleanly:

```bash
pnpm vitest run tests/unit/load-case-introduction.test.ts tests/unit/case-introduction-modal.test.tsx tests/integration/case-asset-route.test.ts
pnpm build
```

## Rollout

1. Land the generic introduction loader and modal plumbing.
2. Add the shared case-asset helpers and extend the asset route to audio.
3. Add the `player_cases.introduction_seen_at` column and wire the page-level auto-open state.
4. Author the Larkspur introduction bundle with the supplied transcript and audio.
5. Verify the intro auto-opens once, replays later from the header, and never appears in the evidence index.
