# Progress Snapshots Design

Date: 2026-03-14

## Context

Ashfall Collective now supports staged case progression, but the player-facing UI still leaves too much of that state implicit. The app can resume a player into notes, objectives, reports, or debrief, yet the vault and case workspace do not clearly summarize what stage the player is in, how much casework is already complete, or what question currently needs attention.

This design adds lightweight progress snapshots for staged dossiers so players can re-enter the experience with stronger orientation and less friction.

## Async Assumptions

The user asked for an overnight, autonomous pass and will not be available for review during implementation. I am proceeding with these assumptions:

- Prefer a player-facing improvement over internal tooling.
- Stay inside the current staged-case architecture and avoid new persistence unless the value is unusually strong.
- Keep the change self-contained and easy to discard if the direction does not resonate after review.

## Problem

Today, staged progression is technically present but visually buried:

- The vault shows continuity links, but not meaningful stage progress.
- The case page shows objectives and evidence, but not a concise summary of where the investigation currently stands.
- A returning player must infer progress by scanning several regions instead of getting a quick operational snapshot.

That creates avoidable cognitive load in the exact moments where the app is trying to preserve momentum and retention.

## Approaches Considered

### 1. Progress snapshots in vault and case workspace

Surface a compact staged-progress summary derived from existing manifest and objective state data.

Pros:

- Improves both re-entry points: the vault and the live case page.
- Requires no new authored content or schema changes.
- Reuses the staged progression model that already exists.

Cons:

- Adds some view-model complexity to the staged progression helper.

### 2. Unlock bulletin after successful objective submissions

Show a transient “new stage unlocked” or “new evidence revealed” panel after objective success.

Pros:

- Strong moment-to-moment payoff.
- Makes progression transitions feel more dramatic.

Cons:

- Helps only during unlock events, not during later return visits.
- Requires more careful transition-state handling.

### 3. Persist last-viewed evidence

Resume the player directly into the exact evidence item they last inspected.

Pros:

- High fidelity resume behavior.
- Helps deep-dive investigators continue where they left off.

Cons:

- Requires new persistence and a broader behavioral change.
- Less obviously valuable than clearer progress framing across the whole app.

## Chosen Direction

Approach 1: progress snapshots in the vault and case workspace.

This is the strongest fit for an overnight product improvement because it is valuable in every staged dossier, builds directly on recent staged-progression work, and stays inside the current data model.

## Design

### Snapshot Model

Extend the staged progression derivation so it can return a compact snapshot that answers these questions:

- What stage should the player focus on right now?
- How many objectives are solved versus total?
- How many stages are visible versus total?
- How many evidence items are currently unlocked?
- What is the next active objective prompt, if any?

The focus stage should be the first visible stage that still contains an active objective. If all visible objectives are solved, the snapshot should fall back to the last visible stage so completed cases still feel coherent.

### Vault Experience

For staged dossiers, each card should gain a progress snapshot block beneath the summary and above the continuity or action button. The block should surface:

- Stage progress such as “Stage 1 of 2”
- Current focus stage title
- Solved objective count versus total
- Unlocked evidence count
- The next active objective prompt when one exists

Legacy or non-staged cases should keep the current vault card layout with no synthetic placeholder snapshot.

### Case Workspace Experience

The case page should surface the same underlying snapshot near the header area so the player immediately understands the current state of the investigation before diving back into evidence or objectives.

This should read as an operational briefing rather than a dashboard:

- Current focus stage title and summary
- Stage progress
- Objective progress
- Unlocked evidence count
- The next active objective, if present

The snapshot should only render for staged manifests.

### Revision Safety

When a player already has a pinned case revision, staged progress should be derived from that same revision so the snapshot reflects the actual version of the case the player is playing.

### Error Handling

- If a staged snapshot cannot be derived for a dossier, omit it rather than rendering misleading data.
- Legacy cases continue using the existing UI unchanged.
- Completed and closed-unsolved staged cases can still render a snapshot using the last visible stage and solved counts.

## Testing

Add or update tests at three levels:

- Unit tests for the progression helper to verify focus-stage selection and count derivation.
- Integration tests for vault and case page rendering so staged snapshots appear with the expected copy.
- Targeted end-to-end coverage to prove the snapshot updates after a staged objective unlocks the next step.

## Out of Scope

- New database tables or authored manifest fields.
- Timeline/history systems.
- Persisting last-viewed evidence.
- New animations or celebratory transition states.
