# Ashfall Case Continuity Design

Date: 2026-03-13

## Approval Context

The user explicitly asked for autonomous execution while offline. This design records the assumptions and recommendation I would normally walk through interactively, then uses that documented direction as approval to proceed.

## Summary

Ashfall Collective already preserves the core state a returning player cares about: case status, saved notes, saved draft answers, submission feedback, and a computed `resumeTarget` when a case is reopened. The current UI does very little with that information. The vault cards stay generic, in-progress cases do not tell the player what work is waiting for them, and terminal cases still look like they should reopen the case file instead of the debrief.

This improvement should turn that latent continuity data into a clearer return loop. The vault should tell the player what is waiting in each dossier and point them at the most relevant next surface. The case workspace should confirm that Ashfall restored their progress and give them quick jumps back to evidence, notes, or the report panel.

## Goals

- Make returning-case cards in the vault feel specific instead of generic.
- Reuse existing saved note, draft, submission, and player-case timestamps to tell the player where to resume.
- Give in-progress cases a direct way to jump back to `Evidence Intake`, `Field Notes`, or `Draft Report`.
- Send completed or closed cases toward the debrief from the vault without changing deeper case-route behavior.
- Keep the implementation additive and low-risk, with no schema migration.

## Non-goals

- Introduce a new progress-tracking model such as per-evidence completion.
- Add live relative-time updates, notifications, or background reminders.
- Redesign the whole vault or case workspace.
- Change grading, attempt rules, or debrief content.
- Add a new persistence layer for UI-only continuity state.

## Approaches Considered

### 1. Vault-only continuity cues

Show resume labels and last-activity hints on vault cards, but leave the case page unchanged.

Pros:

- Smallest implementation.
- Immediate value before a player opens a case.

Cons:

- The case page still misses the chance to confirm restored progress.
- Existing `resumeTarget` logic remains underused after navigation.

### 2. Workspace-only resume banner

Keep the vault generic, but add a continuity banner inside the case workspace when a player reopens a case.

Pros:

- Directly uses the existing reopen flow.
- Makes the workspace feel more intentional for return visits.

Cons:

- Players still choose from vague vault cards.
- The return loop only becomes clearer after they have already opened the dossier.

### 3. Shared continuity loop across vault and workspace

Surface a concise resume summary on vault cards, route CTAs toward the most relevant next destination, and show a continuity banner with section jumps inside reopened case workspaces.

Pros:

- Solves the full return journey instead of only one half.
- Reuses existing persisted data without inventing a new subsystem.
- Gives terminal cases a better vault destination.

Cons:

- Touches more files and test surfaces than a one-screen tweak.

## Recommendation

Choose approach 3.

It gives Ashfall a stronger retention loop with modest scope: the player sees what is waiting in the vault, lands on a more meaningful destination, and gets an explicit confirmation that their notes or draft were restored. This is a better use of the already-computed continuity state than either a vault-only or workspace-only patch.

## Product Approach

The feature should expose one shared continuity summary for a player-case and let each surface render it differently.

For in-progress cases, the summary should answer:

- what stage the player should resume (`evidence`, `notes`, or `report`)
- what copy to show in the vault
- which section anchor should receive the player on case open
- when the latest activity happened

For completed or closed cases, the summary should pivot from "resume" language to "review debrief" language and point the vault CTA at `/cases/[caseSlug]/debrief`.

This keeps the continuity logic centralized while giving the vault and case page different presentations of the same underlying state.

## Continuity Summary Model

Extract the existing resume logic into a reusable helper instead of leaving it buried inside `openCase()`.

The helper should derive:

- `section`: `evidence | notes | report | debrief`
- `label`: short UI text such as `Resume report draft` or `Review debrief`
- `description`: one sentence of vault-facing context
- `href`: destination for the primary CTA, including a section anchor when appropriate
- `lastActivityAt`: best available timestamp for display

Data sources:

- `player_cases.status`
- saved note body and `updatedAt`
- saved draft fields, `attemptCount`, and `updatedAt`
- latest submission feedback when the case is still in progress after an attempt

No schema changes are needed. The logic should be shared by `openCase()` and `listAvailableCases()` so the same prioritization rules are used in both places.

## Vault Experience

Each dossier card should keep the existing status chip and summary, then add a small continuity block when a player-case exists.

Expected behavior:

- New case with no prior progress: keep a neutral `Open Case File` CTA.
- If only saved notes exist, the CTA becomes `Resume Notes` and links to `#field-notes`.
- When a saved draft or pending handler feedback exists, the CTA becomes `Resume Report` and links to `#draft-report`.
- When there are no notes or drafts but prior history exists, the CTA becomes `Return to Evidence` and links to `#evidence-intake`.
- Completed or closed case: CTA becomes `Review Debrief` and links to `/cases/[caseSlug]/debrief`.

The continuity block should also show:

- one sentence of context, for example that a report draft is waiting or notes were last updated
- an absolute, locale-formatted last-activity timestamp

The visual tone should match the existing dossier-card style: helpful, quiet, and in-world enough to feel intentional without turning into a dashboard.

## Case Workspace Experience

When an in-progress case is reopened and the continuity summary points to `notes` or `report`, show a compact restoration banner below the case header.

The banner should:

- confirm that Ashfall restored saved progress
- mention the most relevant resume area in plain language
- provide quick links to `Evidence Intake`, `Field Notes`, and `Draft Report`

The sections themselves should gain stable anchors:

- `#evidence-intake`
- `#field-notes`
- `#draft-report`

This keeps the deep links simple and removes the need for client-side scroll state. The existing page layout already keeps notes and report visible, so the main job is orientation rather than a complex guided flow.

The banner should not appear for truly fresh cases, because that would add noise without helping the player.

## Error Handling And Edge Cases

- If continuity data cannot be derived for a player-case, fall back to the current generic vault CTA instead of blocking the vault.
- Terminal cases should point to the debrief from the vault, but the case route itself should keep its current behavior to avoid a larger navigation-policy change.
- Missing timestamps should degrade gracefully by omitting the "last updated" line rather than showing placeholder text.
- The section anchor logic must stay server-renderable; no client-only scroll orchestration should be required.

## Testing Strategy

Required coverage:

- unit tests for the shared continuity-summary helper and its section/CTA decisions
- vault page tests covering new, in-progress, and terminal dossier CTA copy
- case page tests covering restoration-banner visibility and anchor rendering
- Playwright coverage proving a saved-note case resumes through the vault with the expected copy and a saved-draft case links toward the report section

The tests should stay behavior-focused. Styling assertions should remain lightweight and only verify the presence of the new surfaces and destinations.

## Assumptions

- The highest-value improvement is better continuity for returning players, not a brand-new evidence mechanic.
- A vault CTA that prefers the debrief for terminal cases is a positive UX improvement even if the underlying case route still technically works.
- Section anchors provide enough "resume" precision for this phase; we do not need to remember a specific evidence item yet.
