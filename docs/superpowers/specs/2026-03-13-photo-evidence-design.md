# Photo Evidence Expansion Design

Date: 2026-03-13

## Summary

The case workspace should expand beyond the current text-first families by adding a fourth evidence family: `photo`.

Phase one should support four authored photo subtypes:

- `scene_photo`
- `object_photo`
- `surveillance_still`
- `found_photo`

Each photo evidence item should remain file-backed and typed. `manifest.json` should continue to act as the evidence index, while each photo entry points to a small JSON payload file that describes one still image plus the shared metadata needed by the viewer.

The player experience should stay consistent with the current workspace. Photo evidence should appear in the same intake list, open in the shared viewer area, and support a larger preview dialog for closer inspection without introducing zoom, galleries, or subtype-specific UI.

## Goals

- Add one new `photo` evidence family that fits the current typed evidence architecture.
- Support `scene_photo`, `object_photo`, `surveillance_still`, and `found_photo` as the first photo subtypes.
- Keep authoring consistent with the existing manifest-index plus payload-file model.
- Render one still image per evidence item with caption, source, and an optional date.
- Show `Unknown` in the UI when a photo does not include a date.
- Let players open a larger preview without losing notebook or report context.
- Validate image paths and payload files as strictly as the current text-first evidence families.

## Non-goals

- Support galleries, alternate shots, or multiple images inside one evidence item.
- Add optional metadata blocks such as camera details or chain-of-custody fields in phase one.
- Add thumbnails to the evidence intake list.
- Add zoom, pan, annotation, or other deep inspection controls.
- Introduce subtype-specific UI layouts.

## Product Approach

The preferred approach is to add a real `photo` family rather than squeezing images into `document` or making photos a manifest-only exception.

This keeps the evidence model consistent:

- `manifest.json` remains the case-level evidence index
- each evidence entry declares the family, subtype, summary, and payload source
- the payload file carries the family-specific data
- the loader normalizes each evidence item into one typed UI object
- the shared viewer dispatches to a family-specific renderer

Using a small payload JSON file for photos costs one extra authored file per image, but it preserves the architecture already established for `document`, `record`, and `thread`. That gives the system a clean place to grow later if photo evidence ever needs richer metadata or more advanced presentation.

## Authored Content Model

Photo evidence should use the existing manifest entry envelope:

- `id`
- `title`
- `family`
- `subtype`
- `summary`
- `source`
- optional viewer hints

For photo evidence, `family` should be `photo` and `source` should point to a JSON payload file under the case directory, typically inside `content/cases/<slug>/evidence/`.

The phase-one photo payload should stay intentionally small:

- `subtype`: one of `scene_photo`, `object_photo`, `surveillance_still`, or `found_photo`
- `image`: a case-local still image path such as `evidence/signal-room.jpg`
- `caption`: required descriptive copy
- `sourceLabel`: required provenance/source label shown in the UI as `Source`
- `date`: optional string

Example payload:

```json
{
  "subtype": "scene_photo",
  "image": "evidence/signal-room.jpg",
  "caption": "The signal room desk with a burned relay box near the harbor log.",
  "sourceLabel": "Harbor Patrol Archive",
  "date": "2026-03-12T01:14:00Z"
}
```

The normalized UI object should carry the existing evidence envelope plus:

- `image`
- `caption`
- `sourceLabel`
- `date`

No optional metadata layer should exist in phase one. That keeps authoring simple and avoids premature schema branching.

## Player Experience

Photo evidence should plug into the existing three-panel workspace without changing the layout.

In the evidence intake list, photo items should follow the same pattern as the current entries:

- family and subtype label
- title
- summary
- open/view action

Phase one should not add thumbnail previews to the intake list. Keeping the index text-led preserves scanability and avoids letting image entries dominate the left rail.

In the main viewer, the photo renderer should show:

- the shared active-evidence heading treatment
- the evidence title and summary
- a compact metadata row with `Source` and `Date`
- `Date: Unknown` when the optional field is absent
- the still image in a framed presentation sized for the workspace
- the caption near the image
- one clear action to open a larger preview

The larger preview should use a lightweight overlay or dialog:

- show the same image at a larger size
- repeat the caption and the same core metadata nearby
- support open and close only

The dialog should not add zoom, pan, galleries, or subtype-specific controls in phase one.

## System Boundaries and Data Flow

`loadEvidenceSource` should gain a `photo` branch alongside `document`, `record`, and `thread`.

That branch should:

1. parse the photo payload JSON
2. validate the payload schema
3. confirm the payload `subtype` matches the manifest entry `subtype`
4. resolve the referenced image path through the existing safe case path helpers
5. verify the resolved image stays inside the case directory
6. normalize the result into a typed `PhotoEvidence` object

The shared `EvidenceViewer` dispatcher should gain a `photo` case that renders a dedicated `PhotoEvidenceView`.

The browser should not receive arbitrary filesystem paths. If the app does not already expose a safe case-asset image route, this work should add one narrow asset-serving boundary limited to still-image files inside the selected case directory.

Phase one should allow common still-image extensions only, such as:

- `.jpg`
- `.jpeg`
- `.png`
- `.webp`

## Validation

Validation should expand beyond the current three families.

The schema and loader flow should confirm:

- photo manifest entries use `family: "photo"`
- photo payloads match the expected shape
- photo payload `subtype` is one of the four supported phase-one subtypes
- image paths resolve inside the case directory
- referenced image files exist on disk
- image paths use an allowed still-image extension
- normalized photo evidence parses through the shared discriminated union

Validation errors should stay author-facing and precise. Missing files, invalid paths, unsupported extensions, or subtype mismatches should fail clearly during development and case-package checks.

## Failure Handling

Failure handling should stay strict for authors and contained for players.

- Case validation should fail hard when photo payloads are malformed or assets are missing.
- Development loads should surface precise payload and path errors.
- Deployed runtime rendering should keep the workspace usable if one photo item fails to load.

If a specific photo cannot render in a deployed environment, the workspace should show a contained failure state for that evidence item rather than collapsing the full case page.

## Verification Strategy

Verification should cover schema, loading, rendering, and authored fixtures.

Required coverage should include:

- schema tests for the new `photo` family payload and normalized evidence shape
- loader tests for subtype mismatches, missing assets, invalid paths, and invalid extensions
- case-package validation coverage proving photo assets are checked during validation
- integration tests proving the workspace can render a photo item and show `Date: Unknown`
- e2e coverage proving a player can open the larger preview while the notebook and report workflow remain intact

## Future Extension Path

This design intentionally keeps the first photo family small, but it leaves room for later expansion.

Future phases could add:

- optional metadata groups if investigation play starts to benefit from them
- thumbnail previews in the evidence index if the list remains usable
- richer inspection controls if puzzle design begins to require visual analysis
- adjacent media families such as audio, maps, or video clips using the same manifest-plus-payload pattern

The important architectural rule is that future media should continue to plug into the same system:

- manifest envelope
- file-backed payload
- safe asset resolution
- typed normalization
- family-specific renderer dispatch
