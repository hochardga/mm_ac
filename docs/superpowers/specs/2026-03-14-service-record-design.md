# Service Record Design

Date: 2026-03-14

## Summary

Ashfall Collective currently treats each dossier as an isolated island. The vault shows per-case status and continuity, and the debrief page closes one investigation well, but the app still lacks a cross-case sense of the player's Ashfall career.

This feature adds a Service Record: a shared summary of cleared dossiers, active investigations, unresolved closures, and the next assignment Ashfall wants the player to take. The goal is to turn progress across cases into a visible retention loop without introducing a heavy achievement system or a new progression model.

## Async Assumptions

The user asked for an overnight autonomous pass and will not be available for iterative design review. I am proceeding with these assumptions:

- Favor visible player progression over internal analytics or operator tooling.
- Reuse existing case, continuity, and terminal-state data rather than adding schema.
- Keep the feature additive so it can land in one PR and remain easy to revise or discard.
- Avoid game-y ranks, badges, or score inflation that would weaken the Ashfall tone.

## Problem

Today the app knows more about the player than it shows:

- `player_cases` already tracks whether cases are new, in progress, completed, or closed unresolved.
- the vault already computes continuity for each dossier.
- the debrief already knows when a case has just been solved or closed.

But none of that rolls up into a career view. The player can finish a case and still feel like Ashfall forgot the broader arc.

That creates two gaps:

- the vault lacks a strong "where do I stand overall?" answer
- the debrief lacks a "what should I do next?" handoff

## Goals

- Show a cross-case Service Record on the vault page.
- Summarize active, solved, and closed-unsolved dossier counts.
- Show cleared-dossier progress against the currently published case roster.
- Recommend the most relevant next assignment using existing continuity data.
- Reuse the same service record summary on the debrief page after a terminal outcome.

## Non-goals

- Introducing ranks, badges, XP, or cosmetic achievement systems.
- Changing case unlock rules or hiding cases behind progression gates.
- Creating a new persistence model for career progression.
- Reworking vault cards, grading rules, or debrief logic beyond the shared service record layer.

## Approaches Considered

### 1. Vault-only stats ribbon

Add a simple counts-only panel to the vault and stop there.

Pros:

- Smallest implementation.
- Immediate improvement to the main return surface.

Cons:

- Misses the post-debrief handoff opportunity.
- Feels informational rather than directional.

### 2. Shared service record plus recommended next assignment

Build one server-side service record summary and render it on both the vault and debrief pages.

Pros:

- Gives the vault a cross-case identity and the debrief a stronger next step.
- Reuses existing continuity logic instead of inventing a second routing system.
- Keeps the scope focused on one shared data shape and two surfaces.

Cons:

- Touches both vault and debrief rendering.
- Needs careful recommendation rules so the CTA feels intentional.

### 3. Full rank-and-achievement system

Add named ranks, award thresholds, and special career milestones.

Pros:

- High visibility.
- Could create a stronger long-term metagame later.

Cons:

- Too game-like for the current Ashfall tone.
- Requires additional design decisions and copy that are out of scope for one PR.

## Recommendation

Choose approach 2.

It gives players a meaningful sense of career progress while staying grounded in data the app already has. The combination of summary plus recommendation is more valuable than a pure stats widget and far more disciplined than a premature badge system.

## Product Shape

### Vault page

Add a Service Record panel near the top of the vault, ahead of the dossier cards.

The panel should show:

- dossiers cleared
- active investigations
- unresolved closures
- a concise progress sentence such as `1 of 3 dossiers cleared`
- a primary `Recommended Assignment` link
- a short reason for the recommendation

Recommendation rules:

1. Prefer the most recently active in-progress case.
2. Otherwise recommend the first available new case.
3. If every available case is terminal, fall back to the vault without a special assignment CTA.

### Debrief page

Add a companion Service Record section after the outcome summary.

The debrief variant should:

- confirm the updated cross-case totals after the terminal outcome
- reuse the same recommendation logic
- point the player toward their next dossier from the moment the debrief lands

This makes the end of a case feel like a handoff instead of a dead end.

## Architecture

### Shared service record loader

Create one server-side loader, `getServiceRecord`, that accepts:

- `userId`
- optional `excludeCaseSlug` for recommendation fallback on the current debriefed case

It should return a stable shape with:

- `totals`
  - `availableCases`
  - `clearedCases`
  - `activeCases`
  - `closedUnresolvedCases`
- `progressLabel`
- `latestOutcome` summary when one exists
- `recommendedAssignment`
  - `label`
  - `href`
  - `reason`

### Recommendation inputs

The loader should reuse `listAvailableCases({ userId })` so it inherits current availability, continuity, and authored case metadata rather than rebuilding that logic by hand.

For latest outcome, the loader can query the player's terminal cases directly and choose the most recently updated one.

### UI decomposition

Keep rendering split into small, testable units:

- `ServiceRecordPanel` for the shared presentation
- vault page owns placement and introductory copy
- debrief page owns its local framing copy

The loader should stay server-only, and the panel should remain a pure presentational component.

## Data Flow

1. The vault or debrief route resolves the current user id.
2. The route calls `getServiceRecord`.
3. `getServiceRecord` loads available cases, player-case totals, and latest terminal outcome.
4. The route renders a shared `ServiceRecordPanel` with surface-specific copy.
5. The recommendation link routes directly to the next meaningful dossier surface.

## Error Handling

- If the user is unauthenticated, keep the existing route guards and redirects.
- If the player has no prior cases, totals should gracefully show zero cleared, zero closed, and a recommendation toward the first available dossier.
- If no recommended assignment exists, the panel should still render the totals without a broken CTA.
- If a terminal outcome summary is unavailable, omit that line rather than rendering placeholder copy.

## Testing Strategy

- Unit tests for `getServiceRecord` totals and recommendation priority rules.
- Vault integration tests for:
  - new-player service record totals
  - recommendation toward an in-progress case
  - recommendation toward a new case when no active case exists
- Debrief integration tests for:
  - service record totals after a solved case
  - recommendation that points toward the next dossier instead of the just-finished one when appropriate

## Expected Outcome

After this change, the vault should feel like a live personnel dossier instead of a list of unrelated cases. The player will see what they have cleared, what is still open, and where Ashfall wants them next. The debrief page will no longer end with a full stop; it will actively feed the next return loop.
