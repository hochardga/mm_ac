# Evidence Variety Showcase Design

Date: 2026-03-30

## Summary

Ashfall Collective should expand its evidence system so authored cases can support a much broader range of artifact styles without abandoning the current `family + subtype + source` model.

The preferred approach is to deepen the existing families that already fit the product well, then add a small number of truly new families. The runtime should support seven evidence families:

- `document`
- `record`
- `thread`
- `photo`
- `audio`
- `diagram`
- `webpage`

`portrait` should remain a specialized `photo` subtype rather than becoming a separate top-level family.

This work should also introduce one new staged showcase case that explicitly exists to demonstrate every supported evidence family and representative subtype. The showcase case should be separate from existing narrative cases and must not modify `content/cases/larkspur-dead-air`.

Although this should ship as one cohesive product phase, planning should decompose the work into bounded implementation tracks so schema contracts, renderers, documentation, and authored showcase content can be built and verified independently.

## Goals

- Support significantly more evidence variety while preserving the current typed, file-backed case architecture.
- Add first-class runtime support for `audio`, `diagram`, and `webpage` evidence families.
- Expand subtype and template support within `document`, `record`, `thread`, and `photo`.
- Keep the player experience presentation-first, with distinct viewers but minimal new interactivity.
- Add reusable authoring examples and documentation so new evidence types are practical to ship.
- Create one dedicated showcase case that demonstrates every supported family and major subtype.
- Keep validation strict enough that malformed evidence packages fail before release.

## Non-goals

- Modify `content/cases/larkspur-dead-air`.
- Build a full evidence generation pipeline for TTS, HTML capture, or image synthesis in this phase.
- Add deep analysis widgets, annotation tools, or puzzle-specific interaction systems across evidence viewers.
- Support arbitrary embedded HTML, arbitrary external URLs, or unsafe asset resolution.
- Create long-lived one-off exceptions for the showcase case.

## Product Approach

The system should continue to use one shared evidence envelope in `manifest.json`, with each evidence item describing:

- `id`
- `title`
- `family`
- `subtype`
- `summary`
- `source`
- optional viewer hints

Each manifest entry should continue to point at a case-local payload file under `content/cases/<slug>/evidence/`. The runtime should still follow one consistent lifecycle:

1. validate the manifest entry
2. resolve the payload path safely inside the case directory
3. validate the family-specific payload
4. normalize the result into a typed evidence object
5. render it through a family-specific viewer

This approach keeps the architecture coherent while letting authored content grow much more varied.

## Evidence Family Model

### Existing Families With Deeper Subtype Support

`document` should remain the home for text-first artifacts, but phase one should add richer subtype and template coverage for artifacts such as:

- `legal_doc`
- `report`
- `memo`
- `letter`
- `manifest`
- `invoice`
- `policy`
- `lab_report`
- `incident_form`
- `evidence_tag`
- `coroner_report`

Documents should continue to be authored as Markdown plus structured metadata, with deterministic presentation treatments such as header blocks, signatures, stamps, redactions, or optional scan styling.

`record` should remain the home for structured row-and-column evidence. It should expand to better support subtypes such as:

- `phone_records`
- `bank_ledger`
- `shipping_log`
- `badge_swipes`
- `visitor_log`
- `vehicle_tolls`
- `email_headers`

The payload should remain normalized JSON with columns and rows, while the viewer can apply subtype-aware framing so the records feel like carrier exports, ledgers, rosters, or printed logs rather than generic tables.

`thread` should continue to support conversation-style evidence, with broader subtype coverage such as:

- `email_thread`
- `sms_log`
- `chat_export`
- `interview_transcript`
- `dispatcher_log`
- `handler_message`

The underlying model can stay message-list based, but presentation should vary by subtype so interviews, chats, and email chains feel materially different in the viewer.

`photo` should expand to cover both scene-style evidence and portrait-style evidence. In addition to the existing photo subtypes, phase one should support:

- `portrait_mugshot`
- `portrait_staff_directory`
- `portrait_social`

Portraits should stay image-backed and validated through the same safe asset path rules as other photos, but the viewer should frame them differently from scene evidence.

### New Families

`audio` should become a first-class family for artifacts such as:

- `voicemail`
- `interview_audio`
- `dispatch_audio`
- `radio_call`
- `confession_audio`

The phase-one audio payload should be a JSON object with:

- `subtype`
- `audio`
- `transcript`
- `sourceLabel`
- optional `date`
- optional `durationSeconds`

Allowed phase-one audio extensions should be limited to `.mp3`, `.wav`, and `.m4a`.

Recommended example:

```json
{
  "subtype": "voicemail",
  "audio": "evidence/dock-voicemail.mp3",
  "transcript": "I saw the transfer happen before sunrise. Check pier locker seven.",
  "sourceLabel": "Harbor dispatch archive",
  "date": "2026-03-20T05:42:00Z",
  "durationSeconds": 34
}
```

The normalized audio object should include `audio`, `transcript`, `sourceLabel`, `date`, and `durationSeconds`. The transcript should be treated as authoritative rather than optional support text.

`diagram` should become a first-class family for:

- `map`
- `floorplan`
- `site_diagram`
- `route_sketch`

The phase-one diagram payload should be a JSON object with:

- `subtype`
- `viewport`
- `elements`
- optional `legend`

`viewport` should define the canvas size:

- `width`
- `height`

`elements` should be a list of structured render primitives using a small allowed set:

- `area`
- `line`
- `marker`
- `label`

Each element should carry only the coordinates and text required by its type. The payload should use structured geometry or positioned elements rather than image-generated text or raw SVG strings.

Recommended example:

```json
{
  "subtype": "floorplan",
  "viewport": { "width": 1200, "height": 800 },
  "elements": [
    { "id": "room-a", "type": "area", "x": 80, "y": 90, "width": 260, "height": 180, "label": "Records Room" },
    { "id": "hall-1", "type": "line", "points": [[340, 180], [620, 180]] },
    { "id": "cam-1", "type": "marker", "x": 660, "y": 180, "label": "Camera" },
    { "id": "note-1", "type": "label", "x": 700, "y": 220, "text": "Power loss reported here" }
  ],
  "legend": [
    { "id": "camera", "label": "Camera" }
  ]
}
```

The normalized diagram object should include `viewport`, `elements`, and `legend`, ready for controlled SVG or HTML rendering.

`webpage` should become a first-class family for:

- `webpage`
- `portal_screen`
- `directory_listing`
- `classified_ad`
- `company_site`
- `harbor_schedule_site`

The phase-one webpage payload should be a JSON object with:

- `subtype`
- `page`
- `blocks`

`page` should include:

- `title`
- optional `urlLabel`
- optional `sourceLabel`

`blocks` should use a small controlled set of block types:

- `hero`
- `notice`
- `list`
- `table`
- `posts`
- `directory`

Recommended example:

```json
{
  "subtype": "directory_listing",
  "page": {
    "title": "Harbor Service Directory",
    "urlLabel": "harbor.local/services",
    "sourceLabel": "Cached port intranet"
  },
  "blocks": [
    {
      "id": "intro",
      "type": "hero",
      "heading": "Night Services",
      "body": "Verified services available after the third bell."
    },
    {
      "id": "vendors",
      "type": "directory",
      "items": [
        { "title": "Pier Locker Rentals", "meta": "Warehouse Row", "body": "After-hours access by coded key." },
        { "title": "Graywake Cartage", "meta": "Slip 4", "body": "Cargo transfers and bonded storage." }
      ]
    }
  ]
}
```

The normalized webpage object should include `page` and `blocks` only after schema validation against the controlled template contract. Raw arbitrary HTML should remain out of scope.

## Authored Content Model

Phase one should preserve one case-local evidence directory per case package and one payload file per evidence item.

Recommended payload expectations:

- `document`: Markdown body plus structured metadata/frontmatter
- `record`: JSON columns and rows
- `thread`: JSON thread metadata plus ordered messages
- `photo`: JSON metadata plus referenced still image asset
- `audio`: JSON metadata plus referenced audio asset, transcript, and optional date or duration
- `diagram`: JSON viewport plus structured render elements and optional legend
- `webpage`: JSON page metadata plus controlled content blocks

This keeps authoring readable and aligns with the existing validation and loading flow. The new showcase case should also ship representative payload examples that can double as authoring references.

The authoring contract for the new families should be locked before viewer work begins so schemas, loaders, validation, and docs all target the same payload shape.

## Viewer Experience

The workspace should continue to use one shared evidence index and one shared viewer entry point, but each family should render through a dedicated family-specific view.

The viewer goal for this phase is distinct presentation, not deep interactivity.

`document` should feel like reviewing a formatted artifact rather than reading a raw Markdown blob.

`record` should still support lightweight sorting and filtering where already useful, but the focus should remain on strong presentation and scanability.

`thread` should keep the current timeline-style readability while improving subtype-specific framing.

`photo` should distinguish portrait-style and scene-style presentation without splitting into separate families.

`audio` should present:

- a clear title and summary
- source and optional date/duration metadata
- an embedded player
- the full transcript in the same viewer

`diagram` should present maps and floorplans as clean, legible visual artifacts with consistent labels and framing.

`webpage` should present in-world page snapshots through controlled templates. Phase one should remain mostly read-only and should avoid broad interactive browsing behavior.

## Validation And Safety

Validation should remain strict and family-aware through `pnpm validate:cases`.

The validation flow should confirm:

- every manifest evidence entry uses a supported family
- every payload matches the declared family schema
- payload `subtype` values match the manifest `subtype`
- every referenced asset path resolves inside the case directory
- image and audio assets exist on disk and use allowed extensions
- diagram payloads normalize into a valid render model
- webpage payloads match the structured template contract
- every normalized evidence item parses through the shared discriminated union

Failure handling should stay author-strict and player-contained:

- authored package validation should fail fast with precise errors
- development loads should surface path and schema failures clearly
- deployed runtime rendering should contain failure to the broken evidence item instead of collapsing the full case workspace

## Showcase Case

Phase one should add one new staged case whose explicit purpose is to showcase the full evidence system.

This case should be framed as an Ashfall training or archive package rather than a conventional mystery that hides its structure. It should still be playable, but its stage progression should intentionally surface different evidence families and presentation modes so the player encounters the breadth of the system in one run.

The showcase case should:

- include all seven runtime evidence families
- demonstrate representative subtypes within the deepened existing families
- act as a regression target for loaders, viewers, and validation
- act as the strongest example package for future case authors

The showcase case should live alongside the existing cases and should not require special-case runtime behavior.

## Documentation And Templates

Phase one should expand the case authoring guide so each supported family has:

- a recommended use case
- a concrete payload example
- required fields
- common mistakes
- asset expectations where relevant

Where helpful, the repo should also include reusable example payloads or templates that authors can adapt when creating future cases.

## Rollout Strategy

This work should be implemented in one product phase covering runtime support plus authoring guidance, but with a clear order of operations:

1. core family contracts
2. loader and safe asset-resolution support
3. viewer implementation
4. validation and automated tests
5. docs and reusable templates
6. showcase case package

This sequence keeps the showcase case from becoming a speculative design exercise and ensures it is authored against the real finished contracts.

Planning should treat those steps as bounded tracks even if they land in one release:

- `core family contracts`: schemas, normalized types, subtype lists, and payload examples
- `loader and asset support`: case-local path resolution, allowed extensions, and normalization
- `viewer implementation`: new family renderers plus deeper presentation for existing families
- `validation and tests`: package validation, schema tests, loader tests, and render coverage
- `docs and templates`: case-authoring guide updates and reusable examples
- `showcase case package`: one training/archive case authored against the finished contracts

## Verification Strategy

Verification should cover schema, loading, rendering, docs, and authored content.

Required coverage should include:

- unit tests for new payload schemas and normalized evidence unions
- loader tests for subtype mismatches, invalid paths, missing assets, and unsupported extensions
- validation coverage for new family contracts
- rendering or integration tests proving each family can be opened in the workspace
- case-package validation coverage for the showcase case
- `pnpm validate:cases`
- `pnpm build`

## Open Design Decisions Resolved

The following decisions are intentionally locked for this phase:

- use the existing family-based architecture rather than a showcase-only custom path
- keep `portrait` inside `photo`
- optimize for high-fidelity presentation over heavy interactivity
- add runtime support and reusable authoring templates, but not a generation pipeline
- create a dedicated showcase case instead of retrofitting `larkspur-dead-air`
