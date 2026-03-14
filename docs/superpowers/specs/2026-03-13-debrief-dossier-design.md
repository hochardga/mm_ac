# Ashfall Debrief Dossier Design

Date: 2026-03-13

## Summary

Ashfall Collective already gives the player a satisfying loop up to the moment a case ends: notes persist, report attempts are graded, handler feedback appears after misses, and the vault recognizes terminal cases. The terminal debrief page does not cash in on that momentum yet. It currently renders only the stored debrief title and summary, which means a solved or failed investigation loses the context of what the player actually filed, how many attempts it took, and what Ashfall ultimately concluded.

This improvement should turn the debrief into a true case recap. The page should show the case outcome, the player's final submitted theory using human-readable labels, Ashfall's final reconstruction of the correct answer set, and a lightweight attempt timeline. That gives terminal states more emotional payoff, helps players learn from failures, and creates a clearer bridge back to the vault.

Because the user asked me to continue without waiting for questions or approval, this design assumes the best next improvement is debrief depth rather than another new gameplay mechanic.

## Goals

- Make the terminal debrief page feel like a complete dossier recap instead of a placeholder.
- Preserve the player's final submitted theory in readable form on the debrief page.
- Reveal Ashfall's final reconstruction for both solved and closed-unsolved outcomes.
- Show attempt history so the player can see how the case concluded.
- Reuse existing authored case content and persisted submissions without a schema migration.

## Non-goals

- Add new grading rules, hints, or post-debrief branching.
- Introduce new authored evidence types or change how cases are solved.
- Redesign the vault or case workspace.
- Add analytics, achievements, or progression systems.
- Store per-attempt snapshots beyond the data that already exists in `report_submissions`.

## Approaches Considered

### 1. Presentation-only debrief refresh

Keep the current data model and only restyle the debrief page with stronger typography and layout.

Pros:

- Lowest implementation risk.
- No new server-side data plumbing.

Cons:

- The page still lacks the player's filed theory and answer reveal.
- The outcome would look nicer without becoming materially more useful.

### 2. Debrief dossier with final theory, solution reveal, and attempt history

Extend the debrief loader to pull the terminal case snapshot, latest submission, all attempts, manifest labels, and protected-case answers, then render a multi-panel recap page.

Pros:

- Reuses data the app already has instead of inventing new persistence.
- Gives both wins and losses a stronger payoff.
- Helps players understand what happened without reopening the case workspace.

Cons:

- Touches both server data assembly and the debrief page surface.
- Requires careful handling so answer reveal only appears on terminal cases.

### 3. Full postmortem walkthrough with evidence citations

In addition to the recap, add a curated evidence-backed explanation tying the correct theory back to specific artifacts.

Pros:

- Highest narrative payoff.
- Strong teaching value for incorrect runs.

Cons:

- Requires new authored content for every case.
- Too large for a focused single PR.

## Recommendation

Choose approach 2.

It is the best balance of product value and implementation scope. Ashfall already knows the terminal outcome, the player's submissions, and the authored answer labels. Surfacing that as a debrief dossier creates a noticeable feature improvement in one PR without requiring migrations or case-authoring rewrites.

## Product Shape

The debrief should read like a post-operation summary. After the existing header, the page should show three core surfaces:

1. An outcome panel that frames whether the case was solved or closed unresolved.
2. A side-by-side recap of `Your Final Report` and `Ashfall Reconstruction`.
3. An attempt log that summarizes each filed report and the handler response.

This structure keeps the experience readable on mobile while still feeling substantive on desktop. It also aligns with the product's dossier framing instead of introducing a generic dashboard pattern.

## Data Model

`getDebrief()` should expand from a title/summary fetch into a terminal recap loader that returns:

- `title` and `summary` from the stored terminal snapshot on `player_cases`
- `status` from `player_cases.status`
- `finalReport` from the latest `report_submissions` row, mapped to manifest labels
- `solution` from `protected.json` canonical answers, also mapped to manifest labels
- `attempts` from all `report_submissions` rows in ascending attempt order

No schema migration is needed. The labels already live in `manifest.json`, and the answer keys already live in `protected.json`. The debrief route is already terminal-only in practice because `getDebrief()` throws when no terminal snapshot exists, so revealing the canonical solution here is safe.

## Page Layout

The page should keep the current dark case-route shell and `CaseReturnHeader`.

Below that, render:

- an outcome badge and summary card
- a two-column comparison section on large screens that stacks on mobile
- an attempt-history section with one card per submission

`Your Final Report` should show the submitted suspect, motive, and method labels exactly as the player last filed them. `Ashfall Reconstruction` should show the canonical suspect, motive, and method labels for the resolved case. For closed-unsolved outcomes, the comparison becomes especially valuable because it makes the miss legible without forcing the player to infer the correct answer from flavor text alone.

The attempt cards should show:

- attempt number
- resulting status (`In Progress`, `Completed`, or `Closed Unsolved`)
- submitted suspect, motive, and method labels
- handler feedback text

## Error Handling

- If a player-case is missing a stored debrief title or summary, keep the current error path and treat the debrief as unavailable.
- If a terminal case somehow lacks submissions, omit the comparison and attempt-history panels rather than crashing the page.
- If a manifest label cannot be resolved for a stored answer id, fall back to the raw id so the page still renders.
- If the protected case cannot be loaded for a published terminal case, fail closed through the route's existing not-found behavior rather than rendering a partial reveal.

## Testing Strategy

Required coverage:

- integration tests for `getDebrief()` or the debrief route proving it returns the player's final report, the canonical answer labels, and ordered attempt history
- route-level tests covering solved and closed-unsolved debrief rendering
- Playwright coverage proving a player who submits a correct report lands on the richer debrief and sees both their filed theory and Ashfall's reconstruction

The tests should stay behavior-focused and avoid brittle styling assertions beyond verifying the new headings, labels, and terminal content.

## Assumptions

- A stronger terminal recap is more valuable right now than adding another mid-case mechanic.
- Revealing the canonical answer set on the debrief page is acceptable because the route represents the end of the case.
- Reusing existing manifest labels and stored submissions is sufficient; we do not need case-specific authored postmortems in this iteration.
