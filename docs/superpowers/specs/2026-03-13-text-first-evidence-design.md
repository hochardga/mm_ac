# Text-First Evidence Expansion Design

Date: 2026-03-13

## Summary

Ashfall Collective should expand from a flat evidence model into a typed text-first evidence system that supports richer authored artifacts and more useful investigation workflows. Phase one should introduce three evidence families:

- `document`
- `record`
- `thread`

Each evidence item should move from inline manifest content into a file-backed source model, with `manifest.json` acting as the evidence index and separate files under `content/cases/<slug>/evidence/` holding the payloads. The case workspace should also evolve from stacked sections into a unified investigation layout where the player can view evidence and keep persistent case notes at the same time.

This phase should be a full authored-content cutover rather than a compatibility layer. Existing cases should migrate to the new model, and the old `kind + content` evidence shape should be removed once the new loaders and renderers are in place.

## Goals

- Support multiple text-first evidence types beyond a single paragraph blob.
- Establish one clean evidence model for authored case content.
- Keep authoring readable by separating the case index from large evidence payloads.
- Render evidence through family-specific viewers that feel more investigative and less generic.
- Keep notes interactive while the player is viewing evidence.
- Add strong validation so broken authored evidence is caught before release.

## Non-goals

- Introduce photo, portrait, audio, map, floorplan, or in-world webpage evidence in phase one.
- Build a full compile step or authoring pipeline before the product needs it.
- Preserve backward compatibility with the old evidence schema.
- Add per-evidence notes, annotations, or collaborative features.
- Turn the workspace into a tool-heavy dashboard with deep analysis mechanics.

## Product Approach

The preferred approach is a shared evidence envelope with typed evidence families and family-specific renderers.

`manifest.json` should remain the top-level case index, but each evidence entry should become a lightweight descriptor that points to a file-backed payload. The app should load evidence through a typed loader layer and render it through a shared viewer boundary that dispatches to the correct family renderer.

Phase one should support:

- `document` for templated authored documents such as reports, memos, letters, manifests, invoices, policies, and coroner-style forms
- `record` for structured logs and tables such as phone records, bank ledgers, visitor logs, badge swipes, toll records, and email header summaries
- `thread` for communications and transcript-style evidence such as email threads, SMS logs, chat exports, interview transcripts, and dispatcher logs

Subtypes should exist as variants inside those families rather than as independent top-level systems. Examples include `invoice`, `legal_doc`, `bank_ledger`, `sms_log`, and `interview_transcript`.

## Authored Content Model

Each case should gain an `evidence/` directory under `content/cases/<slug>/`.

The manifest should answer:

- what each evidence item is
- how it should be ordered and labeled
- which renderer family owns it
- where its payload lives

Each manifest evidence entry should include:

- `id`
- `title`
- `family`
- `subtype`
- `summary`
- `source`
- optional viewer hints for lightweight presentation choices

The actual evidence payload should live in a separate file referenced by `source`.

Payload expectations by family:

- `document`: markdown body with optional structured metadata for headers, signatories, totals, stamps, redactions, or embedded table sections
- `record`: structured JSON containing column definitions, rows, and light viewer hints
- `thread`: structured JSON containing thread metadata and ordered message or transcript entries

This model preserves a readable case manifest while keeping long transcripts, tables, and formatted documents out of one oversized JSON blob.

## Player Experience

The current case route should evolve from a stacked page into a unified investigation workspace with three persistent areas:

- an evidence index for selecting artifacts
- a main viewer for the currently opened evidence item
- one persistent case notebook

The evidence index should still feel like dossier intake, but previews should be family-aware:

- `document` previews emphasize type and short abstract
- `record` previews emphasize subtype, row count, and clue-oriented summary
- `thread` previews emphasize participants, channel, and timing context

The main viewer should use one shared entry point with family-specific rendering:

- `document` renders styled HTML from Markdown plus structured metadata blocks
- `record` renders a readable table with light sort and filter affordances where they materially help investigation
- `thread` renders strongly formatted messages or transcript turns with clear metadata hierarchy

Interaction should remain selective and useful. Records may support sorting and lightweight filtering. Threads may support basic expansion or jumps if needed. Documents should remain primarily read-first.

## Notes Experience

Notes should become part of the investigation act rather than a separate form below the evidence list.

Phase one should use one persistent case notebook, not evidence-scoped notes. The notebook should remain available while viewing any evidence item so the player can record hypotheses in context without leaving the artifact they are reading.

The note data model should stay case-wide. The workspace may still show the currently viewed evidence title near the note editor and offer lightweight insert-reference affordances, but the saved note remains one continuous notebook for the case.

## System Boundaries and Data Flow

The existing separation between player-safe case content and protected answer data should remain intact.

`manifest.json` remains player-safe and becomes the typed evidence index. Each evidence entry points to a file in the case `evidence/` directory. During case load, the application should:

1. validate the manifest envelope
2. resolve each evidence source path
3. validate the payload against the family-specific schema
4. normalize the payload into a stable typed object for the UI

The UI should consume normalized evidence objects rather than raw markdown or ad hoc JSON files.

Phase one should keep normalization and rendering preparation on the server side. Markdown-to-HTML conversion, record shaping, and thread formatting inputs should all be prepared during case load rather than pushed into the browser. This keeps the client simpler and makes authoring failures surface earlier.

## Validation

Case validation should expand beyond basic manifest parsing.

The validation workflow should confirm:

- every `source` path exists
- the payload file shape matches the declared evidence family
- subtype-specific required fields are present
- Markdown documents, records, and threads normalize successfully

This validation should run through the existing case validation tooling so authored evidence problems are caught before shipping.

## Cutover Strategy

Phase one should perform a full authored-content cutover.

All existing cases should be migrated to the new manifest envelope plus `evidence/` payload files during the same implementation phase. Once migration is complete, the old `kind + content` evidence shape should be removed from the schema, loaders, and UI.

This avoids a long-lived compatibility path and keeps the codebase centered on one clear evidence model.

## Failure Handling

Failure handling should be strict for authors and graceful for players.

- Validation should fail hard when a case package is malformed, missing files, or cannot be normalized.
- Development loads should surface precise path and schema errors.
- Runtime rendering should avoid taking down an entire case page because one evidence item is invalid.

If a specific evidence item fails to render in a deployed environment, the UI should show a contained in-world failure state for that item while keeping the rest of the workspace usable.

## Verification Strategy

Verification should cover schema, loaders, rendering, and authored content.

Required coverage should include:

- schema tests for manifest entries and each phase-one family payload type
- loader tests that prove documents, records, and threads normalize into stable typed UI objects
- integration or render tests proving the workspace can switch between evidence items while preserving the persistent notebook
- updated case-package validation coverage so all authored cases are checked under the new model

## Future Extension Path

This design intentionally leaves room for later evidence families such as photos, portraits, audio, maps, floorplans, and in-world webpages.

Those future families should plug into the same high-level system:

- manifest envelope
- file-backed payloads
- typed loader normalization
- family-specific renderer dispatch

That keeps phase one focused while ensuring later media expansion does not require rethinking the entire evidence architecture.
