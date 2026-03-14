# Evidence-Aware Continuity Design

Date: 2026-03-14

## Summary

Ashfall Collective already remembers the broad shape of a returning player's progress. The vault can send them back to notes, objectives, report drafting, or terminal debrief, and the case page preserves a selected evidence item across save and submit redirects. What it does not remember yet is the exact artifact the player was using when they leave the case and return later. Reopening a dossier without an explicit `?evidence=` query falls back to the first visible item, which weakens the feeling of continuity and makes the saved notes or draft context less precise than it should be.

This improvement should make continuity evidence-aware. When a player works a case, Ashfall should remember the last evidence artifact they viewed. The vault and reopen flows should carry that artifact back into the case so the player lands on the same document, photo, record, or thread they were actively using, alongside the correct continuity section.

Prioritize stronger resume fidelity over adding a new mid-case mechanic.

## Goals

- Reopen in-progress cases on the last viewed evidence artifact when possible.
- Preserve the remembered evidence across vault resume links and direct case reopening.
- Keep existing continuity sections intact so notes, objectives, reports, and debrief still remain the primary resume targets.
- Fall back safely when a remembered evidence id is no longer valid or visible.
- Fit the existing persistence model instead of introducing browser-only state.

## Non-goals

- Add new authored evidence types or change case content.
- Redesign the evidence viewer or add evidence annotations.
- Introduce client-side local storage or cookie-only progress state.
- Change grading rules, objective unlock logic, or debrief behavior.
- Add analytics or activity feeds for every evidence interaction.

## Approaches Considered

### 1. Redirect-only continuity polish

Continue preserving `selectedEvidenceId` in existing form redirects and avoid any new persistence.

Pros:

- Lowest implementation cost.
- Keeps the current server data model untouched.

Cons:

- Does not help when the player leaves the case and returns from the vault later.
- Still resets to the first evidence artifact on a plain reopen.

### 2. Browser-local remembered evidence

Store the last viewed evidence in a cookie or local storage entry keyed by case slug.

Pros:

- Avoids a database migration.
- Can support direct client-side resume behavior.

Cons:

- Only works on the same browser and device.
- Sits awkwardly beside the app's server-backed case continuity model.
- Makes continuity less reliable for signed-in returning agents.

### 3. Server-backed evidence-aware continuity

Persist the last viewed evidence id and timestamp on the player case, then thread that information through continuity links and case-page selection.

Pros:

- Matches the app's existing persistence model.
- Works for vault resume, direct reopen, and existing continuity sections.
- Keeps the feature focused on one server-backed source of truth.

Cons:

- Requires a schema migration and a small amount of continuity plumbing.
- Needs careful fallback behavior for staged cases where visible evidence can change.

## Recommendation

Choose approach 3.

It delivers the clearest player-facing improvement without inventing a second continuity system. Ashfall already treats the player case as the durable record of progress, so remembering the last viewed evidence there is the most consistent and least surprising place to store resume context.

## Product Shape

Evidence-aware continuity should feel additive rather than flashy:

- If the player opens a case, reviews `Dispatch Log`, leaves, and later returns from the vault, the case should reopen on `Dispatch Log` instead of the first dossier item.
- If continuity points to notes, objectives, or report drafting, that section should still be the main destination, but the reopened case should carry the remembered evidence into the page so the surrounding context matches what the player last examined.
- If continuity points to debrief, the behavior remains unchanged because terminal cases no longer use the evidence workspace.

The vault can remain visually close to its current design. The key product change is that continuity links become more precise, not that the card layout changes dramatically.

## Data Model

Extend `player_cases` with:

- `lastViewedEvidenceId` - nullable text
- `lastViewedEvidenceAt` - nullable timestamp with timezone

These fields represent the most recent evidence artifact the player successfully opened inside the workspace. They do not replace broader case status or note/report persistence.

No separate table is needed because the feature only needs the latest viewed artifact, not a full browsing history.

## Runtime Flow

### Persisting evidence context

When the case page resolves a valid evidence artifact to display, it should persist that artifact onto the current player case. This should happen only after the selected evidence has been validated against the current visible evidence list so authored changes, staged gating, or malformed query params do not store bad ids.

### Reopening a case

When no explicit `?evidence=` query is present, the case page should choose the evidence artifact in this order:

1. the remembered evidence on the player case, if it is still visible
2. the first visible evidence artifact

When an explicit `?evidence=` query is present and valid, it wins and becomes the new remembered artifact.

### Building continuity links

`buildCaseContinuity()` should keep deciding the primary resume section exactly as it does today. The new behavior is that, for non-terminal sections, the generated `href` should include the remembered evidence id when present. That lets vault cards and reopen flows land on both the right section and the right artifact together.

Example outcomes:

- notes continuity: `/cases/red-harbor?evidence=dispatch-log#field-notes`
- objectives continuity: `/cases/hollow-bishop?evidence=vestry-interview#active-objectives`
- evidence continuity: `/cases/red-harbor?evidence=night-watch-thread#evidence-intake`
- debrief continuity: `/cases/briar-ledger/debrief`

## Boundaries and Responsibilities

- `src/db/schema.ts` and the next migration own the stored continuity fields.
- A focused case-level helper should own persisting remembered evidence so the page component does not inline database update details.
- `buildCaseContinuity()` should remain responsible for deciding the section, label, description, timestamp, and resume `href`.
- The case page should remain responsible for resolving the selected visible evidence item from query params, remembered continuity, and manifest visibility.
- The vault listing should continue to reuse `buildCaseContinuity()` instead of duplicating link-building logic.

This keeps each unit understandable on its own and avoids scattering continuity URL logic across multiple routes.

## Error Handling

- If the remembered evidence id no longer exists in the manifest, ignore it and fall back to the first visible artifact.
- If the remembered evidence exists in authored content but is not currently visible because staged progression has not unlocked it yet, ignore it and fall back to the first visible artifact.
- If the case has no visible evidence at all, keep the current null-render behavior on the workspace rather than inventing a partial fallback.
- If the persistence update fails while resolving the case page, the page should still render the selected evidence rather than crashing purely because the remembered context could not be refreshed.

## Testing Strategy

Required coverage:

- unit tests for `buildCaseContinuity()` proving remembered evidence ids are threaded into notes, objectives, report, and evidence resume links while debrief links stay unchanged
- integration tests for reopening a case without a query param and landing on the remembered evidence artifact
- integration tests for vault continuity links proving they preserve both the section anchor and remembered evidence query
- regression coverage proving invalid or no-longer-visible remembered evidence falls back to the first visible artifact

The tests should stay behavior-focused. They should assert concrete routing and rendered evidence titles rather than CSS details.

## Assumptions

- Remembering the latest evidence artifact is more valuable right now than recording a full evidence activity history.
- Reusing the existing server-backed player-case record is preferable to adding browser-only continuity state.
- The current continuity model is strong enough; it needs more precision, not a new navigation concept.
