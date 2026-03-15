# Case Workspace Feedback Design

Date: 2026-03-15

## Context

Recent user testing surfaced a cluster of related issues in the case workspace:

- Native dropdown answers become awkward when option labels are long.
- The current case layout feels too narrow, especially on mobile and in the evidence viewer column.
- Objective actions emphasize saving drafts over submitting answers.
- Evidence is displayed inline in a thin middle column that is difficult to read.
- Submission results do not clearly tell the player whether they were correct.
- The continuity banner adds noise without enough value.
- Newly unlocked evidence is not clearly distinguishable from already-seen evidence.

These concerns all point to the same product need: the case workspace should feel more legible, more decisive, and more rewarding after each interaction.

## Problem

The current workspace splits attention across three compressed columns inside a `max-w-5xl` shell. That makes evidence hard to consume, especially on smaller screens. It also weakens the player’s sense of momentum because the UI does not strongly surface successful progress, recent results, or newly unlocked content.

In short:

- Evidence is technically accessible, but not comfortable to read.
- Form controls work, but long-answer choices degrade the presentation.
- Submission flows function, but the outcome is visually under-communicated.
- Progression reveals new content, but the UI does not celebrate or flag that reveal.

## Approaches Considered

### 1. Recommended: keep the existing server-first workflow and move evidence into a URL-driven modal

Use the current `?evidence=` routing model, remove the inline middle evidence column, and render every evidence family in a shared modal shell.

Pros:

- Preserves deep-linking and resume behavior.
- Minimizes architectural churn.
- Solves the thin evidence column problem directly.
- Keeps the current evidence-selection mental model intact.

Cons:

- Still relies on page navigation for evidence changes unless enhanced later.
- Native browser dropdown menus still cannot be made to wrap reliably across browsers.

### 2. Introduce a client-side workspace shell for modal state and richer transitions

Move more of the workspace into client state so evidence, submission results, and progression cues can update more fluidly without full navigations.

Pros:

- Smoother transitions and more app-like interactions.
- Easier future path for richer inline feedback.

Cons:

- Meaningfully larger scope.
- More client complexity than this feedback round requires.

### 3. Replace native dropdowns with custom answer controls

Use radio-card groups or a custom combobox for long-answer choices.

Pros:

- Full control over wrapping, spacing, and accessibility behavior.
- Best visual answer for verbose options.

Cons:

- Conflicts with the user preference for native simplicity.
- Expands scope far beyond the other requested fixes.

## Chosen Direction

Approach 1: preserve the current server-first workspace flow, but widen the page, collapse the layout to two columns, and move all evidence viewing into a shared modal.

This direction fixes the most important usability issues with the smallest product and technical footprint. It also keeps the option open to add richer client-side behavior later without throwing away the current data flow.

## Design

### Layout

The case page should widen beyond the current `max-w-5xl` container so the workspace no longer feels cramped on desktop. Inside that shell, the three-column workspace should become:

- Left column: evidence index
- Right column: directives, notes, objectives, or legacy report form

On smaller screens, those sections should stack into a single-column flow with no fixed-width column math that risks horizontal scrolling.

The middle inline evidence viewer should be removed entirely.

### Evidence Flow

`Open Evidence` should open a modal for every evidence type, not just photos. The modal should become the single evidence reading surface for:

- documents
- records
- threads
- photos

The existing evidence-specific viewer components should continue to render the content itself, but inside a shared modal shell with consistent heading, close behavior, and scroll treatment.

Evidence selection should remain URL-driven through `?evidence=<id>`, so refresh, restore, and deep-link behavior remain intact. Opening evidence should therefore mean “navigate to the same page with the selected evidence in query state,” and the modal opens whenever a valid selected evidence exists.

### Form Controls

The app should keep native `<select>` controls for simple browser behavior. However, the closed controls should become full-width, less pill-shaped inputs so long labels render more cleanly in the control itself.

No promise should be made that the browser’s native option popup will wrap long lines, because that behavior is not reliably controllable across browsers. If long-answer option lists remain a major pain point later, that should trigger a separate custom-control redesign rather than an unreliable CSS workaround.

### Action Hierarchy

Primary and secondary action emphasis should flip:

- `Submit Objective` / `Submit Report` becomes the primary filled button.
- `Save Draft` becomes the secondary outlined button.

This better reflects the player’s main intent while preserving draft-saving as a lower-emphasis fallback.

### Submission Feedback

Submission feedback should become outcome-forward.

For staged objectives:

- The latest submission card in an active objective should clearly lead with a status such as `Incorrect` when the objective remains unsolved.
- When an objective is solved, its latest feedback should surface in the completed section with clear success language such as `Correct` or `Objective completed`.

For legacy reports:

- If a report submission returns the player to the in-progress workspace, the feedback card should also lead with a clear result-oriented label instead of only generic handler feedback framing.

### Objective Ordering

When at least one objective has been solved, `Completed Objectives` should render above `Active Objectives`. That gives the player a clearer sense of payoff immediately after a successful submission.

If no objectives are solved yet, only the active section needs to appear.

### Continuity Banner

The `Progress Restored` banner should be removed from the workspace. Resume logic still matters functionally, but the banner does not provide enough value to justify the space it occupies at the top of the case page.

### New Evidence Marking

Newly unlocked evidence should display a `New` badge in the evidence index until the player opens that evidence item.

This should persist across refreshes and devices for the same player case. The least invasive implementation is to store `viewedEvidenceIds` on `player_cases` and treat any currently visible evidence that is absent from that set as new.

Opening an evidence modal should mark that evidence item as viewed through the existing remembered-evidence pathway.

### Data Changes

Add a new `viewedEvidenceIds` JSON-backed column on `player_cases`.

Behavior:

- New player cases start with an empty viewed-evidence list.
- Opening a case with a selected evidence item records that evidence as viewed.
- New evidence badges are derived from `visibleEvidence - viewedEvidenceIds`.

This avoids creating a new table while still supporting durable, player-specific evidence visibility state.

### Error Handling

- If a query parameter references evidence that is not visible in the current progression, the workspace should fall back to the default visible evidence and render without opening a misleading modal target.
- If persisting viewed evidence fails, the page should still render successfully, as it does today for remembered evidence.
- Legacy cases should continue to work without staged-objective sections or new-evidence logic beyond what applies to the shared evidence index and modal flow.

## Testing

Add or update tests to cover:

- case page rendering with the wider two-column workspace shape
- evidence modal rendering for document, record, thread, and photo evidence
- primary versus secondary action order in objective and report forms
- completed-objectives rendering above active objectives after a solved submission
- explicit success and failure labels in submission feedback
- `New` badge appearance for newly unlocked evidence and disappearance after that evidence is viewed
- mobile-safe layout expectations that avoid horizontal overflow regressions where practical

## Out Of Scope

- Replacing native selects with fully custom answer components
- Reworking case progression rules or authored case content
- Adding animations, toast systems, or celebratory transitions beyond clearer static feedback
- Converting the case workspace into a fully client-managed application shell
