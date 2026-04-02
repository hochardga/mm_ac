# Evidence Visual Styling Design

Date: 2026-04-02

## Summary

Ashfall Collective already supports seven evidence families, but most of the viewers still read like generic dark cards. This design gives each family a stronger in-world presentation while keeping the underlying data model, loader flow, and interaction model unchanged.

The core idea is to treat every evidence family as a different archival medium:

- `document` looks like a scanned paper artifact
- `record` looks like a structured ledger or export
- `thread` looks like a message transcript or chat log
- `photo` looks like a mounted photograph, contact print, or evidence board card
- `audio` looks like a recorder deck or playback console
- `diagram` looks like a blueprint, topo map, or drafted sketch
- `webpage` looks like a browser capture or cached in-world page

The recommended approach is a family-specific presentation system with subtype-aware variations inside the families that benefit most from them. The biggest visual lift should land on `document`, because that is the most natural place to sell a scanned-document illusion.

This is a presentation refresh only. It should not change evidence loading, case progression, routing, or the evidence intake list beyond minor visual polish where it supports the viewer.

## Goals

- Give each evidence family a distinct archival visual identity.
- Make document evidence feel like scanned paper rather than a dark text card.
- Add subtype-aware presentation variations where they improve readability or mood.
- Keep the viewers readable, accessible, and responsive on the existing case workspace.
- Preserve the current data flow and typed evidence model.
- Keep the evidence intake list text-led so scanability remains high.

## Non-goals

- Do not change the evidence schemas, loaders, or routing behavior.
- Do not add new interactions such as zoom, annotation, editing, or cropping.
- Do not introduce thumbnails into the evidence index.
- Do not build a new theming system for non-evidence parts of the app.
- Do not redesign the case workspace shell around the evidence viewer.

## Approaches Considered

### 1. Light-touch accent pass

Keep the current layouts and add a few family-colored borders, background tints, and chips.

Pros:

- Lowest implementation risk.
- Fast to ship and easy to test.
- Leaves current component structure mostly untouched.

Cons:

- The viewers would still feel like one generic design with different labels.
- Documents would not sell the scanned-paper concept strongly enough.

### 2. Family-specific editorial archive

Give each family a different archival medium and use subtype-aware variations where they add clarity or atmosphere.

Pros:

- Strongest thematic payoff.
- Documents, photos, audio, and webpages can all feel meaningfully different.
- Still fits the current component structure.

Cons:

- More component work.
- More styling branches to test.

### 3. Case-specific art direction

Let each authored case or evidence subtype introduce highly tailored visuals.

Pros:

- Maximum atmosphere.
- Could make the best individual clues look exceptional.

Cons:

- Too much variation for the current codebase.
- Harder to maintain and easier to make inconsistent.
- Risk of distracting from the evidence model.

## Recommendation

Choose approach 2.

It gives the app a clear visual identity without turning the viewers into one-off bespoke scenes. The family-level split keeps the system understandable, and the subtype-aware variation gives us room to make the most common evidence subtypes feel intentional.

## Visual System

### Shared frame

The shared evidence shell should stay dark and archive-like, but it should become a little more ceremonial:

- a family chip
- a subtype chip
- a stronger title hierarchy
- a calmer summary area
- subtle family-colored accents instead of one flat orange treatment

This shell stays responsible for the overall sense that the player is opening a dossier item. The family-specific component underneath is what changes the medium.

### Document

`document` is the highest-priority visual upgrade. The target look is a scanned page or archived sheet sitting inside the evidence shell.

Primary effects:

- warm paper background
- slightly irregular page shadow
- subtle noise or scan texture
- soft edge staining or vignette
- stamped handling marks
- occasional fold or staple cues
- body copy styled like printed or typewritten paper rather than a dark UI card

Subtype variations:

- `case_brief`: a clean intake sheet with a bold header block and a stamped archive label
- `incident_form`: boxed sections, stronger form lines, and a more official look
- `memo`: clipped memo paper with a compact header and a confidential feel
- `letter`: address block, salutation spacing, and signature-like spacing near the bottom
- `transcript`: monospaced transcript styling, speaker labels, and denser line spacing
- `notice`: centered or poster-like heading treatment
- `policy` / `report`: structured, formal spacing with section headers

The document viewer should remain readable first. The scan effect should support the fiction, not overpower the text.

### Record

`record` should feel like a structured printout, ledger, or export from a system that likes rows and columns.

Primary effects:

- ruled or grid-like background
- monospaced or tabular-feeling row presentation
- alternating row bands
- stronger header strip
- subtle terminal or ledger cues
- row cards or a timeline mode when the subtype is more narrative than tabular

Subtype variations:

- `badge_swipes`: access-control and door-log styling, with crisp timestamps and a punch-in feel
- `access_log`: terminal or operations log styling, with line-number energy
- `inventory_log`: ledger or stock sheet styling, with heavier table borders
- `timeline`: a vertical chronology layout instead of a plain table, because chronology reads better as a sequence than as a spreadsheet

The important distinction is that record evidence should always feel structured and scannable, even when the layout changes.

### Thread

`thread` should feel like a captured conversation, not a generic message list.

Primary effects:

- a transcript rail or message spine
- sender and timestamp chips with stronger hierarchy
- compact chat-card or transcript-card bodies
- channel and participant metadata treated like an operational header
- alternating emphasis to keep long threads readable

Subtype variations:

- `handler_message`: ops relay or internal chat styling with clean message cards
- `interview_thread`: transcript styling with stronger speaker labels and more formal spacing
- `message_log`: compact chat export styling
- `email_thread`: if introduced later, header blocks and quoted reply styling would fit naturally here

This family should feel conversational but controlled. The viewer should help the player scan for who said what and when.

### Photo

`photo` should feel like mounted evidence rather than a full-bleed image card.

Primary effects:

- framed image with visible mat or print border
- caption strip
- source/date provenance nearby
- slight analog texture or camera-still feeling
- optional corner tape or contact-sheet cues

Subtype variations:

- `scene_photo`: larger framed scene still, more documentary in tone
- `object_photo`: macro-style specimen card with a tighter crop and a more clinical frame
- `surveillance_still`: monitor-like frame with timestamp and grain
- `found_photo`: slightly informal snapshot styling, like a recovered personal photo
- `portrait_staff_directory`: formal directory card treatment
- `portrait_mugshot`: stricter ID-board treatment
- `portrait_social`: more casual portrait card with a softer frame

The photo family should feel like the image could have been physically filed and labeled by someone on the case.

### Audio

`audio` should feel like playback hardware or a recorded message archive rather than an ordinary player card.

Primary effects:

- recorder deck or console framing
- waveform or level-meter decoration
- duration and source chips
- transcript presented as the authoritative text artifact
- stronger contrast between the control surface and the transcript block

Subtype variations:

- `voicemail`: tape-machine or message-deck styling
- `interview_audio`: interview-recorder styling with a calmer transcript presentation
- `dispatch_audio`: radio or field-ops styling
- `radio_call`: stronger signal/frequency cues
- `confession_audio`: more severe and spotlighted presentation, with a restrained red accent

The transcript stays central. The decorative surface should make the evidence feel captured, not gimmicky.

### Diagram

`diagram` should feel drafted, measured, or mapped.

Primary effects:

- graph-paper or blueprint background
- crisp geometry framing
- legend presentation like a drafting note block
- stronger line color discipline
- subtle scale or compass-like cues where appropriate

Subtype variations:

- `floorplan`: blueprint treatment, typically the strongest drafting look
- `site_diagram`: schematic or technical drawing feel
- `map`: warmer topo-map or cartographic feel
- `route_sketch`: hand-drawn sketch feel with lighter lines and looser callouts

The diagram viewer should preserve legibility first. The visual treatment should reinforce the kind of diagram the player is reading.

### Webpage

`webpage` should feel like a cached page, browser snapshot, or portal capture.

Primary effects:

- browser chrome at the top
- URL or source label in a visible bar
- page content presented inside a captured frame
- controlled blocks with distinct card surfaces
- subtle desktop-capture or offline-archive energy

Subtype variations:

- `directory_listing`: browser-like intranet snapshot with clean listing cards
- `company_site`: richer landing-page snapshot with a stronger hero block
- `classified_ad`: newspaper clipping or ad-column treatment
- `portal_screen`: portal or system-screen styling with a heavier UI feel
- `harbor_schedule_site`: timetable or schedule-board presentation with grid emphasis

This family works best when the chrome tells the player, immediately, that they are looking at a captured page rather than a live browser.

## Component Boundaries

The implementation should stay inside the evidence viewer layer:

- `src/features/cases/components/evidence-panel-shell.tsx` should own the shared dossier frame and family chip treatment.
- `src/features/cases/components/markdown-content.tsx` should gain a paper-friendly tone mode so scanned documents do not have to reuse the dark transcript palette.
- `src/features/cases/components/document-evidence-view.tsx` should own the scanned-page treatment.
- `src/features/cases/components/record-evidence-view.tsx` and `src/features/cases/components/record-table.tsx` should own the structured-printout and timeline variants.
- `src/features/cases/components/thread-evidence-view.tsx` should own the conversation styling.
- `src/features/cases/components/photo-evidence-view.tsx` should own all photo-frame variations.
- `src/features/cases/components/audio-evidence-view.tsx` should own the recorder/waveform treatment.
- `src/features/cases/components/diagram-evidence-view.tsx` should own the drafting-board styling.
- `src/features/cases/components/webpage-evidence-view.tsx` should own the captured-browser styling.

If a shared variant helper is useful, it should be narrow and presentation-only. This work should not introduce a new runtime abstraction that starts influencing loader or routing code.

## Data Flow

The data flow remains unchanged:

1. the case loader normalizes the evidence payload
2. `EvidenceViewer` dispatches by family
3. the family-specific viewer chooses a subtype presentation
4. the viewer renders the archive surface and the evidence content

The styling decisions should only consume existing normalized fields such as `family`, `subtype`, `meta`, `columns`, `rows`, `thread`, `messages`, `image`, `audio`, `viewport`, `elements`, and `blocks`.

## Fallbacks And Accessibility

- If a subtype is unknown, fall back to the base family presentation.
- If a family has no subtype-specific styling branch, keep the family treatment consistent rather than inventing a one-off.
- Preserve strong text contrast on all surfaces.
- Keep keyboard and screen-reader behavior unchanged.
- Do not let decorative textures or overlays reduce legibility.

## Testing Strategy

The testing goal is to prove that the new visuals are present without turning the suite into brittle CSS snapshot tests.

Recommended coverage:

- update or add unit tests for document evidence so the paper/scanned treatment is exercised
- update photo tests to cover at least one framed-photo variation and one surveillance-style variation
- add a record test for the timeline presentation if the subtype branch is introduced
- keep the existing audio, diagram, webpage, and record-table behavior tests passing
- verify that the shared shell still renders the expected title, summary, and metadata

The tests should assert stable text, roles, and a few key structural hooks. They should not depend on pixel-perfect class strings unless the class is the behavior under test.

## Verification

The implementation should be considered complete only after:

- `pnpm test` passes for the updated viewer tests
- `pnpm build` passes
- the affected cases still render in the workspace without layout breakage

## Assumptions

- The current evidence loader and manifest format are good enough.
- The user wants stronger presentation, not new interaction mechanics.
- The most important visual change is the scanned-document treatment for `document`.
- Family-level variation is more valuable than case-by-case bespoke artwork.
