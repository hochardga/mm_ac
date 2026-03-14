# Live Attempt Ledger Design

Date: 2026-03-14

## Summary

Ashfall currently preserves objective attempt history only after a case is already over. During the investigation itself, the player can see the latest feedback on an objective, but not the full chain of what they already tried or how close they are to exhausting the case's graded failure budget.

This feature adds a Live Attempt Ledger to staged case workspaces. It will surface the remaining graded-failure budget and show readable per-objective attempt history while the case is still active, so agents can make better decisions before filing another answer.

## Async Assumptions

The user asked for an unattended overnight run and will not be available for design review. I am proceeding with these assumptions:

- The most valuable remaining product gap is in-case reasoning support rather than more cross-case progression.
- Improving transparency around failed submissions is worth modest additional UI density in the workspace.
- It is acceptable to scope this feature to staged cases, because all currently published dossiers use staged objectives.
- Reusing existing submission history is preferable to inventing a new authoring or hint system.

## Problem

The app already records rich staged-case state:

- every objective submission is persisted with an attempt number, answer payload, feedback, and next status
- the player case tracks how many graded failures have already been spent
- protected case data defines the graded failure budget
- the debrief reconstructs attempt history after the case is terminal

But the active workspace hides most of that until it is too late. That creates two avoidable frustrations:

- players can repeat earlier wrong answers because the case view only shows the latest feedback
- players can be surprised by a closure because the remaining graded-failure budget is invisible

The result is a harsher, more opaque investigation loop than the product intends.

## Goals

- Show the remaining graded-failure budget during staged investigations.
- Render readable objective attempt history while the case is still in progress.
- Reuse existing authored objective labels and answer formatting so previous submissions make sense at a glance.
- Keep the feature inside the current case workspace without adding new routes or persistence.

## Non-goals

- Changing grading rules, failure limits, or objective evaluation behavior.
- Adding hints, automated answer suggestions, or evidence-to-objective matching.
- Reworking the debrief flow.
- Extending the feature to legacy report-style cases in this pass.

## Approaches Considered

### 1. Budget-only warning banner

Add a small risk panel showing graded failures spent and remaining.

Pros:

- Smallest implementation.
- Removes the most surprising hidden mechanic.

Cons:

- Still leaves the player without in-case memory of prior answers.
- Solves transparency, but not investigative recall.

### 2. Shared live attempt ledger plus pressure summary

Add a pressure summary and render formatted submission history for staged objectives directly in the active workspace.

Pros:

- Makes the player's prior reasoning visible before the next submission.
- Reuses data and formatting logic that already exists for debrief reconstruction.
- Delivers a meaningfully new investigation aid without extra schema.

Cons:

- Touches both server-side loading and the objective UI.
- Needs careful formatting to stay legible.

### 3. Inline expandable history inside each objective only

Keep the budget hidden and add per-objective history toggles inside existing cards.

Pros:

- Preserves the current layout.
- Gives targeted context where the player is already working.

Cons:

- Keeps global case pressure invisible.
- Spreads the feature across many repeated cards instead of making stakes obvious once.

## Recommendation

Choose approach 2.

The combination of failure-budget visibility and readable submission history addresses both sources of frustration at once. It is more impactful than a warning strip alone and more coherent than only sprinkling history into individual cards.

## Product Shape

### Pressure summary

Add a compact summary at the top of the staged objective rail that shows:

- graded failures spent
- remaining safe failures
- a short urgency label such as `2 safe graded submissions remain`
- the latest graded-feedback note when one exists

The copy should stay operational and grounded in Ashfall's tone rather than feeling game-like.

### Live attempt ledger

Render a history block for objectives that have prior submissions.

Each entry should show:

- attempt number
- formatted filed answer
- resulting status
- feedback text

Solved objectives should continue to appear in the completed section, but any prior submissions should remain understandable from the active review context before the player reaches debrief.

## Architecture

### Shared formatting helper

Extract staged-objective answer formatting out of debrief-specific code into a shared helper so both debriefs and the active workspace present answers consistently.

The helper should convert authored payloads into readable text for:

- boolean objectives
- code-entry objectives
- single-choice objectives
- multi-choice objectives

### Review-state helper

Create a server-safe helper that derives review state from:

- the staged manifest
- protected grading limits
- player case graded-failure count
- objective submission rows

It should return:

- failure-budget summary
- latest graded feedback, if present
- per-objective attempt history with formatted answers and status labels

### UI integration

Keep rendering changes centered in the staged objective surface:

- `CasePage` loads the protected staged case when applicable
- `CaseWorkspace` passes review-state data into `ActiveObjectivesPanel`
- `ActiveObjectivesPanel` renders the pressure summary and attempt ledger

This keeps the new logic isolated from notes, evidence rendering, and vault/debrief surfaces.

## Data Flow

1. The staged case page loads the manifest, objective rows, and objective submissions as it already does.
2. For staged cases, the page also loads the protected case grading config.
3. A new helper derives live review state from manifest plus current submission history.
4. The objective panel renders the budget summary and per-objective attempt entries.
5. When new submissions arrive, the normal re-render path updates the ledger automatically.

## Error Handling

- Legacy cases should continue to render without the live attempt ledger.
- Objectives without prior submissions should not render empty history chrome.
- If formatted labels cannot be resolved, fall back to raw authored ids or values instead of crashing.
- If graded feedback does not exist yet, omit the latest-feedback callout while still showing the budget summary.

## Testing Strategy

- Unit tests for the shared staged-answer formatter.
- Unit tests for review-state derivation, including failure-budget math and per-objective history shaping.
- Case-page integration tests that verify:
  - the pressure summary appears for staged cases
  - the remaining graded-failure count updates from seeded player-case state
  - previous submissions appear with readable answers and feedback
  - legacy behavior remains unaffected when no staged review state exists

## Expected Outcome

After this change, Ashfall investigations should feel less like a memory test and less like a hidden fail-state. Agents will be able to review what they already filed, read the feedback in context, and understand how much graded risk remains before committing to another answer.
