# Ashfall Collective MVP Design

Date: 2026-03-11

## Summary

Ashfall Collective is a solo-first web application for digital murder mystery cases. The MVP is a free product with three full cases, strong in-universe agency framing, and a retention-focused loop that encourages players to return across multiple sessions and move from one case to the next.

The first release should optimize for clarity, immersion, and repeat engagement rather than subscriptions, multiplayer, or content-authoring sophistication.

## Product Scope

### Goals

- Deliver a responsive web app that works well on phones and laptops.
- Launch with three playable solo cases.
- Make signup feel like applying to Ashfall Collective as a special agent.
- Let players investigate cases in a semi-open structure rather than rigid chapters.
- Preserve progress, notes, and re-entry points across sessions.
- Preserve signed-in progress across supported devices using the same account.
- Measure whether players return to continue unfinished cases and start additional ones.

### Non-goals

- Paid subscriptions or recurring billing.
- Multiplayer or collaborative investigation.
- A rich internal CMS for authoring cases.
- Sandbox clue-board mechanics that require complex visual graph interactions.
- Large community/social systems.

## Product Approach

The MVP should use a case-library app with a strong agency shell.

This means the app behaves like a clear, usable product while presenting most player-facing language as in-universe communication from Ashfall Collective. The roleplay should be strong in onboarding, handler messaging, case status, and debriefing, but not at the expense of navigation clarity or reliable progress tracking.

This approach is preferred over a heavier simulation because it keeps the path to three high-quality cases realistic while still establishing a differentiated brand voice.

## User Experience

### Core Journey

1. A new player signs up through a themed intake flow framed as an agency application.
2. The player is immediately accepted and lands in the dossier vault.
3. The vault shows three cases with clear status markers such as New, In Progress, Solved, and Case Closed.
4. The player opens a case and browses evidence freely inside a semi-open workspace.
5. The player takes private notes, reviews evidence, and submits a handler-style report with exactly three deductions: suspect, motive, and method.
6. The system evaluates the submission, unlocks a solved or closed debrief outcome when appropriate, and points the player back to the vault with a next-case recommendation.

### Tone

- Strong in-universe framing.
- Clear product usability.
- Handler/director language for guidance and feedback.
- Minimal conventional product framing where it would weaken immersion.

### Retention Surfaces

- The dossier vault acts as the main return surface.
- Each case stores resume state so players can re-enter near their prior investigative context without hunting for their place again.
- Incomplete reports, unfinished evidence review, and post-case debriefs should all create clear reasons to return.
- Completion of one case should create a strong handoff to the next available assignment.

## Functional Design

### Onboarding

- Signup should be short and themed.
- Required information should stay close to standard account setup, with optional flavor fields only where they do not hurt activation.
- Successful signup should immediately create an account and start the player in the agency fiction.

### Case Library

- Show all three cases from the start.
- Display case metadata, progress, player-facing case status, and last-played context.
- Prioritize re-entry cues over ornamental browsing features.

Player-facing status labels should be:

- `New` for `new`
- `In Progress` for `in_progress`
- `Solved` for `completed`
- `Case Closed` for `closed_unsolved`

Vault availability is a separate concept from player progress status:

- `Available` means the player can start or resume the case normally.
- `Maintenance` means the case is temporarily unavailable to launch or resume because of an operational issue.
- `Hidden` means the case is not shown to new players because it has been unpublished or withdrawn from circulation.

### Investigation Workspace

- Present evidence in a browsable index.
- Make all player-safe evidence available immediately when the case workspace first loads.
- Provide a note-taking area tied to the current player and case.
- Provide a structured report form with exactly three required deductions: suspect, motive, and method.
- Provide handler prompts and feedback without forcing a fully scripted branching conversation model.
- Do not require chapter-based evidence unlocking for MVP.

Answer input contract:

- Each deduction field should be submitted as a canonical option identifier selected from case-authored choices with player-facing labels.
- MVP should not rely on free-text grading, typo correction, or synonym matching for core report evaluation.
- The client may render these choices as radios, selects, or other constrained inputs, but the submitted payload must use the canonical identifiers defined by the case package.

### Submission Policy

- Players may save draft deductions without grading.
- Players may submit at most three graded reports while a case remains unresolved.
- Each graded attempt should be stored with an attempt number and timestamp.
- Incorrect submissions should return handler feedback and keep the case in progress.
- The first correct submission should mark the case as completed, unlock the debrief, and freeze the final resolved outcome for later review.
- A third incorrect graded submission should close the case as unsolved, unlock the debrief, and freeze that unresolved outcome for later review.
- After case closure, players may review prior submissions and the final debrief, but may not generate conflicting new outcomes.
- Submission retries must be idempotent so network duplication cannot create extra attempts.

### Grading Contract

- Every MVP case must use the same required deduction fields: suspect, motive, and method.
- A case is considered solved only when all required fields are correct.
- The system may record partial correctness by field internally for analytics and review purposes, but player-facing feedback should stay coarse.
- Near-miss feedback should acknowledge that the report is not yet correct without identifying which specific deduction field is wrong.
- The grading contract should be case-configurable through structured authored data rather than case-specific application code.

### Case Lifecycle

- A case is `new` as a derived vault status for any case the player has not started yet. It does not require a persisted player-case record.
- On the first successful case-open request that creates the player-case record and pins the revision, the case transitions from derived `new` status to persisted `in_progress`. This transition is the canonical trigger for `Case started`.
- A case remains `in_progress` through drafts and incorrect graded submissions.
- A case becomes `completed` on the first correct graded submission.
- A case becomes `closed_unsolved` on a third incorrect graded submission.
- Completed and closed-unsolved cases both expose a stable debrief and outcome record on later visits.

State transition summary:

- `new` -> `in_progress`: triggered once when the server creates the player-case record and pins the revision.
- `in_progress` -> `completed`: triggered by the first correct graded submission.
- `in_progress` -> `closed_unsolved`: triggered by the third incorrect graded submission.
- Retries after a partial failure must reuse the existing player-case record, pinned revision, and analytics identifiers rather than creating a new start.

### Debrief

- Show final outcome and handler commentary after case resolution.
- Record the result so it remains stable on later visits.
- Point the player back to the next recommended case.

## Architecture

### System Shape

The MVP should be built as:

- One responsive web application.
- A small authenticated application layer.
- Structured case content storage.
- Relational persistence for accounts and player progress.
- Minimal internal operations tooling for case publishing and fixes.

### Major Components

#### Player application

Responsible for onboarding, dossier vault, evidence viewing, notes, report submission, and debriefs.

#### Application layer

Responsible for authentication, session handling, player progress, submission evaluation, resume-state updates, and handler feedback generation.

#### Case content model

Responsible for reusable authored case definitions including evidence entries, prompts, narrative metadata, and debrief content templates. It should not own mutable player state.

#### Operations tooling

Responsible for narrow internal workflows such as validating case packages, publishing or unpublishing cases, and correcting urgent content issues. This should stay intentionally small in MVP.

Publishing rules for MVP:

- Unpublishing a case removes it from availability for new players.
- Players who already started a case keep access to their pinned revision unless an admin explicitly retires that revision for safety or legal reasons.
- Retiring a revision should be treated as an exceptional manual action because it may interrupt player continuity.
- In the vault, unpublished cases should render as `Hidden` for new players rather than `Maintenance`.

#### Analytics

Responsible for capturing behavior needed to evaluate retention and exposing usage reporting. It must not own gameplay decisions, grading rules, or player-facing case state.

### Ownership Boundaries

- The application layer owns grading logic and the server-side comparison between player submissions and canonical case answers.
- The case content model owns authored source material, public-facing narrative structure, and protected authored answer/debrief data.
- The application layer is the only component allowed to authorize reads and writes of player-private state such as notes, drafts, submissions, resume targets, and player-case records.
- Operations tooling owns validation and publishing workflows for case packages.
- Analytics owns event capture and reporting only.
- Handler feedback in MVP should be authored or template-driven, not open-ended generated content.

## Data Flow

### Core Principle

Shared case content and per-player state must stay separate, and spoiler-sensitive answer logic must stay server-side.

Case packages should be authored once and reused by all players. Player progress, notes, viewed evidence, drafts, submissions, and timestamps should remain private mutable state.

Player-visible case payloads should include only safe dossier material such as case metadata, evidence entries, public prompts, and asset references. Canonical answers, grading rules, and gated debrief payloads should remain server-side until submission evaluation or completion requires them.

### Case Package Schema

Each case package should be authored as one logical unit with two explicit sections:

#### Player-safe payload

- Case metadata
- Evidence entries
- Report option lists for suspect, motive, and method
- Public handler prompts
- Asset references
- Presentation order and grouping

#### Protected authored payload

- Canonical answers
- Grading configuration
- Completion rules
- Debrief payloads
- Feedback templates

The protected payload should live in authored case data managed by the case content model, but it should only be loaded by the application layer and operations tooling. It must never be shipped to the client before grading or completion rules allow it.

Deployment boundary for MVP:

- Player-safe payloads may be delivered to clients as case manifests and assets.
- Protected authored payloads must be stored and served only from trusted server-side systems.
- Client bundles, public asset manifests, and cached browser payloads must not include canonical answers, protected debriefs, or grading configuration.

For MVP, protected rules are limited to grading, completion, and debrief unlocking. They should not support chapter-style evidence gating.

### Case Revisioning

- Every published case package must have an immutable revision identifier.
- New players should receive the latest published revision when they start a case.
- Revision assignment must happen atomically when the application layer first creates the player-case record for that player and case.
- In-progress players should remain pinned to the revision they started.
- Stored submissions, grades, and resolved outcomes must reference the case revision used for evaluation.
- Once a case is completed, the recorded result and debrief should remain stable for that player even if a newer revision is later published.
- Completed cases should store a solve-time snapshot of the graded result and final debrief payload.
- Closed-unsolved cases should also store a close-time snapshot of the terminal outcome and final debrief payload.
- Older revisions only need to remain available server-side while any active player record is pinned to them or any frozen terminal snapshot depends on them.
- MVP does not support automated migration of player progress between revisions.
- Broken revisions must never be repaired in place; fixes require publishing a new revision.

### Gameplay Flow

1. Player signs in and loads the dossier vault.
2. The app loads account identity, available cases, progress summaries, and a canonical resume target for each in-progress case.
3. When a player opens a case, the application layer atomically creates or confirms the player-case record, pins the case revision, emits `Case started` once, and then returns the player-safe case package and related assets.
4. Evidence browsing mostly reads shared content.
5. Player activity writes private state such as notes, viewed evidence, timestamps, and draft answers.
6. On report submission, the application layer validates and scores the answers against server-side case-answer data.
7. The result is stored and reflected back into dossier-vault progress, attempt history, and debrief state.

### Data Categories

#### Case content

- Case metadata
- Evidence items
- Prompt text
- Public handler framing
- Asset references

#### Server-side case logic

- Protected authored payload from the case package
- Evaluation execution in the application layer

#### Player state

- Account record
- Active case revision per started case
- Case status
- Viewed evidence
- Personal notes
- Draft and final reports
- Submission outcomes
- Attempt history
- Resume target
- Resume timestamps

#### Resume target contract

The resume target should minimally include:

- Case identifier
- Last active workspace section
- Last opened evidence item, if any
- Last evidence group or list context, if any
- Active report draft state, if any
- Last note-edit context, if any
- Last activity timestamp

This contract is intended to return players to their recent investigative context, not to restore exact scroll position or every transient UI detail.

### Submission Idempotency

- Every graded submission request must include a client-generated submission token.
- The application layer must treat the tuple of player, case, case revision, and submission token as idempotent.
- If the same request is retried, the server should return the original stored result rather than creating a new attempt.
- Attempt numbers should increment only for unique accepted submissions.
- On first receipt, the submission token must be bound to the exact submitted deduction payload.
- The client must persist an unresolved submission token with the related draft until a definitive success or failure response is recovered.
- If the player retries after a timeout, reconnect, or app reload without changing the submitted answers, the client must reuse the same unresolved token.
- A new token should only be generated after the player changes the submitted deductions or receives a definitive stored result.
- Reuse of an existing submission token with a different deduction payload must be rejected as invalid rather than evaluated.

### Concurrent Device Policy

- MVP supports cross-device continuity for the same signed-in user, but it does not attempt real-time multi-device collaboration.
- Resume target, notes, and draft-report state should use server-timestamped last-write-wins behavior.
- Graded submissions should rely on submission-token idempotency rather than last-write-wins semantics.
- If conflicting draft edits occur across devices, the latest persisted server timestamp becomes the canonical draft state.
- The application layer must serialize graded submissions per player, case, and case revision so only one unique attempt can advance attempt count or terminal case state at a time.
- If concurrent graded submissions arrive near a terminal transition, later requests must either return the already-recorded winning result or fail cleanly without consuming an extra attempt.

### Analytics events

- Signup completed
- Case started
- Session returned
- Case resumed
- Evidence opened
- Report draft saved
- Graded report submitted
- Case completed
- Next case launched

### Analytics Event Definitions

- `Signup completed`: emitted once when account creation succeeds and the player enters the authenticated product experience for the first time.
- `Case started`: emitted once when the application layer first creates the player-case record and pins the case revision for that case.
- `Session returned`: emitted when an authenticated player begins a new server-tracked session after at least 30 minutes of inactivity since the prior session’s last activity timestamp.
- `Case resumed`: emitted when an authenticated player opens an in-progress case in a new session after that case was previously left incomplete.
- `Evidence opened`: emitted when a player opens a distinct evidence item for viewing within a case revision. Reopening the same item in the same session should not emit a duplicate event unless a new session begins.
- `Report draft saved`: emitted when a player explicitly saves or autosaves a deduction draft that changes persisted draft state.
- `Graded report submitted`: emitted when the player sends a unique graded submission attempt that is accepted for evaluation.
- `Case completed`: emitted when a case transitions to `completed` on the first correct graded submission.
- `Next case launched`: emitted when a player starts a different case after already completing at least one prior case.
- The application layer is the source of truth for session boundaries and should mint a session identifier when an authenticated session begins.
- KPI events should be deduplicated by player identifier, case identifier where applicable, and canonical session identifier or submission token so reporting stays stable across retries.
- Analytics events should carry `player_id`, `session_id`, `case_id` when applicable, `case_revision` when applicable, and `submission_token` for graded submissions.

### Minimum MVP KPIs

- Signup-to-first-case-start conversion.
- Percentage of players who return for another session within 7 days of first case start.
- Percentage of players with an in-progress case who later resume that same case.
- Case completion rate per case.
- Percentage of players who start a second case after completing their first.
- Median number of sessions per player across the first 14 days.

## Error Handling

- Authentication failures should return players to a clean sign-in state without discarding saved case state.
- Asset or evidence-loading failures should degrade at the item level where possible rather than blocking the entire case.
- Report submission should behave safely under retries so duplicate requests do not create contradictory outcomes.
- Misconfigured case content should fail visibly in internal workflows and degrade gracefully in the player experience.
- Resume state should be updated continuously enough that abrupt exits do not meaningfully reset progress.
- If server-only case logic is unavailable, the player may continue reading evidence and notes, but grading actions should fail cleanly with a retry path instead of exposing partial or inconsistent results.

Broken published case fallback:

- If validation detects a broken case before launch, the case should be blocked from publishing.
- If a published case is later found broken for new players, the vault should show a maintenance state and prevent new starts for that revision.
- Players already pinned to a broken revision should either continue if the defect is non-blocking or see a maintenance message that preserves their notes and progress until support resolves the issue outside the normal MVP product flow.
- New players should not be automatically routed to an older revision during MVP; the case should remain unavailable until a healthy revision is published.

### Handler Feedback Model

Handler feedback should be deterministic and constrained.

- Pre-submission prompts should be authored case content.
- Submission feedback should be selected from authored or template-driven outcome classes such as `incorrect attempt remaining`, `final incorrect closure`, and `solved`.
- Feedback templates may vary by overall outcome class, but they must not reveal field-by-field correctness.
- The MVP should not rely on freeform generated narrative responses.

## Testing Strategy

### Highest-value automated coverage

- Signup and sign-in flows.
- Case library visibility and state rendering.
- Case package loading.
- Notes persistence.
- Report scoring and debrief unlocking.
- Resume behavior across sessions and devices.
- Submission idempotency under retries and reconnects.
- Duplicate graded-request recovery with reused submission tokens.
- Concurrent graded submissions from two devices against the same case and revision.

Cross-device continuity for MVP means a signed-in player can leave on one supported device and resume their recent investigative context on another after the latest saved state has been written.

### Content validation

Case content should be checked independently of UI tests so incomplete answer schemas, broken references, or malformed evidence packages are caught before release.

### End-to-end coverage

At minimum, the test suite should cover this retention-critical path:

1. Sign up.
2. Start a case.
3. Leave mid-investigation.
4. Return and resume correctly.
5. Finish the case.
6. Start a second case.

## Rollout Notes

- MVP access is free for all users.
- Future membership monetization should be treated as a later phase once repeat engagement is proven.
- The architecture should avoid blocking later subscriptions, but subscriptions are not a release requirement for this design.

## Open Decisions Deferred

- Exact case-authoring format and editorial workflow details.
- Pricing and packaging for a future membership.
- Whether later releases add multiplayer or synchronous collaborative play.
- Whether later releases expand into richer clue-board or connection-mapping mechanics.
