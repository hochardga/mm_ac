# Investigation Board Design

Date: 2026-03-14

## Summary

Ashfall Collective now supports richer evidence families and deeper staged progression, but the player still has only one unstructured note field to hold onto case theory. In practice that means important evidence gets mentally tracked or copied into prose, which weakens the feeling of working an active dossier.

This feature adds an Investigation Board: a lightweight, persistent shortlist of pinned evidence inside each case. Players can pin the artifact they are studying, reopen those pins later, and keep their working set visible without turning the app into a full clue-graph sandbox.

## Async Assumptions

The user asked for an overnight autonomous pass and will not be available for design review. I am proceeding with these assumptions:

- Prefer a player-facing investigation tool over internal authoring or ops work.
- Keep the feature additive and self-contained so it can ship in one PR or be discarded cleanly.
- Preserve the current Ashfall dossier feel rather than introducing a generic productivity UI.
- Stop well short of a fully custom clue-board or freeform graph editor.

## Problem

The current workspace gives players strong evidence viewing and persistence, but weak curation:

- Every case note lives in one large text area.
- There is no durable way to mark a document, photo, record, or thread as "important."
- Returning players can resume on the last viewed evidence, but they cannot see the small set of artifacts they already decided mattered.
- As staged cases deepen, the cost of re-finding pivotal evidence rises.

That leaves the app with good memory for location, but not yet for theory building.

## Goals

- Let players pin evidence items into a persistent per-case investigation board.
- Make pinned evidence easy to reopen from the workspace.
- Keep the feature compatible with all current evidence families.
- Preserve the selected evidence context after pin and unpin actions.
- Avoid exposing locked or invalid evidence through the board.

## Non-goals

- Building a freeform clue graph with draggable cards and relationship lines.
- Adding per-pin annotations, tags, or color coding in phase one.
- Changing case evaluation, progression, or grading rules.
- Replacing the existing notes panel.
- Adding vault-level cross-case bookmarking.

## Approaches Considered

### 1. Inline note references only

Add helper actions that insert evidence titles into the notes textarea, but keep no separate board.

Pros:

- No new persistence model.
- Smallest UI footprint.

Cons:

- Buries important evidence inside long-form notes.
- Gives no navigable shortlist.
- Does not feel like a meaningful new investigative tool.

### 2. Persistent investigation board with evidence pins

Store pinned evidence ids per player-case and render them in a dedicated board panel inside the workspace.

Pros:

- Clear player value with modest scope.
- Works across sessions and devices.
- Reuses existing evidence ids and viewer routes.
- Keeps the feature focused on curation instead of full sandbox mechanics.

Cons:

- Requires a schema migration and one new persistence surface.
- Adds a little more case-page loading and panel logic.

### 3. Full clue-board workspace

Let players create custom cards, link evidence, and arrange a visual theory map.

Pros:

- Highest ceiling for immersion.
- Strong long-term differentiation if fully developed.

Cons:

- Too large for a focused overnight feature.
- Requires significantly more interaction design, persistence, and testing.
- Risks becoming a half-built version of a much bigger system.

## Recommendation

Choose approach 2.

It delivers a meaningful new investigation mechanic without overcommitting the product to a heavyweight clue-board system. The player gains a real memory aid, the case page becomes more tactical, and the implementation stays bounded enough for one isolated PR.

## Product Shape

### Workspace experience

The case workspace gains a new `Investigation Board` panel in the right rail. It sits alongside the existing notes and objective/report tools and acts as the player's curated shortlist of important evidence.

Each pinned card should show:

- evidence title
- family and subtype
- summary
- a direct link back to that evidence item

When the board is empty, the panel should explain that the player can pin evidence from the active viewer.

### Evidence viewer action

The active evidence view gains one prominent toggle action:

- `Pin to Board` when the selected evidence is not pinned
- `Remove from Board` when it is already pinned

The action should feel native to the dossier UI and should preserve the current `?evidence=` selection after the round trip.

### Staged-case behavior

The board should only render evidence that is currently visible in the player's active progression state. If a pinned evidence id is no longer present in the visible set for any reason, the UI should quietly omit it rather than leaking hidden or broken content.

## Architecture

### Persistence

Add a new `player_case_evidence_bookmarks` table keyed to `playerCaseId` plus `evidenceId`.

Required fields:

- `id`
- `playerCaseId`
- `evidenceId`
- `createdAt`

Add a uniqueness constraint on `(playerCaseId, evidenceId)` so repeat pin actions cannot duplicate rows.

### Server responsibilities

Create focused server helpers for:

- listing pinned evidence ids for a player case
- toggling one evidence pin on or off

The toggle helper should:

- verify the player owns the case
- verify the evidence id exists in the currently loadable manifest for that case revision
- insert or delete the bookmark
- keep the implementation idempotent

### UI responsibilities

The workspace should stay decomposed into small units:

- `InvestigationBoardPanel` renders the shortlist state
- `EvidenceBookmarkButton` owns the pin/unpin form UX
- the case page loader assembles bookmark data and passes it into `CaseWorkspace`

`CaseWorkspace` should remain the composition boundary rather than absorbing bookmark persistence logic itself.

## Data Flow

1. The case page loads the player's case, manifest, progression state, and pinned evidence rows.
2. The page filters pinned evidence ids against the currently visible evidence set.
3. `CaseWorkspace` receives both the visible evidence and the filtered pinned evidence records.
4. The selected evidence viewer renders its bookmark toggle state.
5. When the player pins or unpins, a server action updates persistence, revalidates the case path, and redirects back to the same evidence selection.

## Error Handling

- Unauthorized bookmark attempts should fail the server action rather than mutating another player's case.
- Unknown evidence ids should be rejected during toggle handling.
- Duplicate pin attempts should collapse into a single stored bookmark.
- Stale bookmarked evidence ids from future content changes should not break page rendering; the board should simply omit unresolved entries.

## Testing Strategy

- Unit tests for bookmark persistence and toggle semantics.
- Action-level tests to verify selected evidence context is preserved after pin or unpin.
- Integration tests for case-page rendering:
  - empty board state
  - pinned evidence shown in the board
  - selected evidence button label switches between pinned and unpinned states
  - hidden or invalid evidence ids are not rendered

## Expected Outcome

After this change, Ashfall cases should feel less like a read-only dossier plus notes box and more like an active investigation surface. Players can keep a working set of crucial artifacts in view, return to them quickly, and build stronger continuity across longer cases without the complexity of a full clue-map system.
