# Staged Case Progression Design

Date: 2026-03-14

## Summary

Ashfall Collective should move from a single universal `suspect / motive / method` solve flow to a stage-based case system that supports both simple one-step cases and richer multi-unlock investigations.

The new model should let authored cases reveal additional evidence and objectives over time, while keeping the product grounded in a small, structured authoring system rather than a full branching narrative engine. The vault should stop promising estimated duration and instead show an authored complexity tier: `Light`, `Standard`, or `Deep`.

This redesign is a clean relaunch. Existing case content and active progress do not need migration.

## Goals

- Support a variety of case structures, from single-step cases to deeper multi-stage investigations.
- Let stages unlock both new evidence and new objectives.
- Expand objective variety beyond the current fixed deduction trio while keeping inputs structured.
- Preserve the current dossier-style investigation workspace rather than replacing the app shell.
- Replace guessed runtime metadata with an authored complexity label.
- Launch with a varied lineup: one single-step case, one medium staged case, and one deeper staged case.

## Non-goals

- A fully generic rule engine for arbitrary narrative branching.
- Free-text grading, fuzzy matching, or typo-tolerant answer evaluation for core progression.
- Migration logic that preserves existing player progress.
- Building a rich internal CMS for case authoring.

## Product Approach

The preferred approach is an objective-driven stage model.

Each case is authored as one or more stages. A stage can expose handler prompts, evidence, and active objectives. Solving objectives unlocks later stages or resolves the case. A one-step case is simply a case with one stage whose objective unlocks the final resolution.

This approach gives Ashfall more of the layered feeling seen in products like Hunt A Killer and Unsolved Case Files while keeping the implementation bounded enough for the current codebase.

## Player Experience

### Core Flow

1. The player opens a case from the vault.
2. The case workspace shows only currently unlocked evidence and currently active objectives.
3. The player reviews evidence, takes notes, and submits an answer for an active objective.
4. A correct answer unlocks additional evidence, additional objectives, or the final resolution.
5. An incorrect answer either blocks progress with feedback or consumes a graded failure, depending on the authored stakes for that objective.
6. Completing the final objective unlocks the case debrief.

### Case Variety

- `Light` cases can contain a single stage with one final solve objective.
- `Standard` cases can contain a small number of unlocks and a modest objective chain.
- `Deep` cases can contain several unlocks, multiple objective types, and a more layered evidence reveal.

This creates a published lineup with clear variation rather than three cases that all feel structurally identical.

## Content Model

### Public Manifest

The public manifest should retain the current top-level narrative metadata while replacing runtime estimates and fixed report options with stage-based authored content.

Top-level fields:

- `slug`
- `revision`
- `title`
- `summary`
- `complexity`: `"light" | "standard" | "deep"`
- `stages`

Each stage should include:

- `id`
- `title`
- `summary`
- `handlerPrompts`
- `evidenceIds`
- `objectives`

Each objective should include:

- `id`
- `prompt`
- `type`
- optional `options`
- `stakes`: `"advisory" | "graded"`
- `successUnlocks`
- optional authored feedback copy

### Objective Types

Version 1 should support a small structured toolkit:

- `single_choice`
- `multi_choice`
- `boolean`
- `code_entry`

This is intentionally broader than the current deduction trio while still narrow enough to validate, render, and grade consistently.

### Protected Case Data

Protected authored data should move from one case-level answer block to per-objective answers and final-resolution metadata.

Protected payload should contain:

- canonical answers keyed by objective id
- grading rules that remain server-side
- final debrief payloads
- any final resolution metadata needed for solved or closed-unsolved outcomes

### Authoring Constraints

- Progression should be finite and validated.
- Stages may unlock one or more later stages.
- Loops should not be allowed in version 1.
- Single-step cases must be representable without special-case app code.
- Staged evidence gating must be driven by authored stage unlocks, not hardcoded per case.

## Persistence And Grading Model

### Case-Level State

`player_cases` should remain the top-level player record for a case. It should continue to own:

- pinned `caseRevision`
- overall `status`
- terminal debrief snapshot

It should also add a case-wide graded failure counter so mixed-stakes cases can share one failure budget.

### Objective-Level State

Add a `player_case_objectives` table for mutable per-objective progress:

- `playerCaseId`
- `stageId`
- `objectiveId`
- `status` such as `locked | active | solved | failed`
- `draftPayload`
- attempt counters and timestamps

Add an append-only `objective_submissions` table for submission history:

- `playerCaseId`
- `objectiveId`
- `submissionToken`
- normalized answer payload
- correctness result
- feedback returned
- created timestamp

### Grading Rules

- `advisory` objectives can be retried freely and do not consume the case failure budget.
- `graded` objectives consume from a case-wide graded failure budget.
- The default case-wide budget should preserve the current feel of three graded failures closing the case.
- Solving an objective unlocks later stages based on authored `successUnlocks`.
- Solving the final objective marks the case `completed` and unlocks the solved debrief.
- Exhausting the graded failure budget marks the case `closed_unsolved` and unlocks the closed-unsolved debrief.

The case-wide failure budget is preferred over per-objective failure trees because it supports mixed stakes without making authoring and persistence much more complex.

## Server Flow

### Load Path

When the player opens a case, the server should:

1. Load the public manifest and protected case payload.
2. Load player case state and per-objective progress.
3. Compute active stages and visible evidence from the set of solved objectives and unlocked stages.
4. Return only the evidence and objectives that are currently available to the player.

### Draft Save

Saving draft progress should:

- validate the payload shape against the objective type
- persist the draft against that specific objective state
- avoid grading or consuming attempts

### Submission

Submitting an objective answer should:

1. Verify the objective is active and the case is still open.
2. Validate payload shape for the authored objective type.
3. Enforce idempotency through the submission token.
4. Grade server-side against protected canonical answers.
5. Persist submission history and update objective state.
6. Update case-level failure count, unlocked stages, and terminal status when applicable.

### Error Handling

- Locked objectives should reject submissions.
- Already resolved objectives should reject additional submissions.
- Malformed payloads should fail validation before grading.
- Duplicate submission tokens with matching payload should return the stored result.
- Duplicate submission tokens with different payload should hard-fail.
- Broken authored case packages should remain unavailable in the vault instead of partially rendering.

## UI Changes

### Vault

The vault should replace `estimatedMinutes` badges with authored complexity badges:

- `Light`
- `Standard`
- `Deep`

Vault progress cues should stay light and non-spoilery. Case cards can show broad progress states such as `New`, `In Progress`, `Solved`, or `Case Closed`, while the detailed objective breakdown should live inside the case itself.

### Case Workspace

The current three-column investigation layout should remain.

- Left rail: evidence index, filtered to unlocked evidence only
- Center column: evidence viewer
- Right rail: stage-aware handler prompts, notes, and an `Active Objectives` panel

The current `Draft Report` panel should be replaced with objective-driven controls that render the correct input type for each active objective.

Completed objectives should collapse into a resolved state with their returned feedback, while newly unlocked objectives become active.

### Debrief

The debrief flow can remain structurally similar, but it should summarize the final case resolution and key outcome instead of always reflecting one fixed suspect/motive/method selection.

## Rollout Strategy

This redesign should be treated as a content and schema relaunch rather than a compatibility layer over the MVP contract.

- Replace the current published case lineup rather than adapting legacy one-step content in place.
- Reset existing progress rather than building migration logic.
- Launch with three newly authored cases that deliberately demonstrate the new structure:
  - one single-step case
  - one medium staged case
  - one deeper staged case

## Testing Strategy

### Schema And Validation

- validate staged public manifests
- validate protected per-objective answers
- reject cycles or invalid unlock references
- verify objective type payload validation

### Server Logic

- advisory objective retry behavior
- graded objective failure counting
- stage unlock progression
- final objective resolution
- closed-unsolved behavior when the failure budget is exhausted
- idempotent submission token handling

### UI

- vault renders complexity badges instead of minutes
- vault hides spoiler-heavy objective counts
- case workspace only shows unlocked evidence
- active objectives render the correct control by type
- objective completion updates the rendered state as progression advances

### End-To-End

- one single-step case flow
- one medium staged case flow
- one deeper staged case flow
- at least one mixed-stakes case where advisory and graded objectives coexist

## Implementation Notes

- Follow the current dossier workspace and vault presentation patterns instead of redesigning the overall shell.
- Keep authoring and runtime schemas intentionally narrow so validation stays strong.
- Prefer a computed progression model from authored stage/objective state over ad hoc UI conditionals.
- Avoid building authoring affordances that are only needed by hypothetical future case types.
