# Supported Evidence Types

This reference covers every evidence family the staged case loader currently supports. Use it when deciding how to package a clue under `content/cases/<slug>/evidence/`.

## At A Glance

| Family | Source file | Companion asset | Best for | Subtype shape |
| --- | --- | --- | --- | --- |
| `document` | Markdown with frontmatter | None | Briefs, notices, letters, transcripts, memos | Free-form string |
| `record` | JSON | None | Logs, inventories, trackers, tables | Free-form string |
| `thread` | JSON | None | Message threads, interviews, handler exchanges | Free-form string |
| `photo` | JSON sidecar | Image file | Scene stills, portraits, found photos | Fixed enum |
| `audio` | JSON sidecar | Audio file | Voicemails, interviews, dispatch clips | Fixed enum |
| `diagram` | JSON | None | Floorplans, maps, route sketches | Fixed enum |
| `webpage` | JSON | None | Cached pages, portal screens, directories | Fixed enum |

## Shared Rules

- The manifest entry `subtype` and the source file `subtype` must match.
- `source` paths are relative to the case folder, not the repository root.
- Markdown documents are the only family that use frontmatter.
- Photo and audio entries point to a JSON sidecar file that in turn points to the binary asset.
- If an authored clue needs a sparse Ashfall reference to "the system," keep that line short and controlled.

## Document

Use `document` for the text-first clues that read like a file, letter, memo, transcript, or notice.

Source shape:

```md
---
subtype: case_brief
meta:
  sourceLabel: "Ashfall intake archive"
  handlingNote: "Use this as the opening brief."
---
# Archive Brief

This is the body of the document evidence.
```

Required fields:

- frontmatter `subtype`
- non-empty markdown body

Optional fields:

- `meta`, a string-keyed object whose values may be strings, numbers, booleans, or `null`

Supported subtype values:

- Free-form. Common choices in this repo include `case_brief`, `incident_form`, `memo`, `notice`, `letter`, and `transcript`.

Good uses:

- opening briefs
- handler notes
- witness statements
- internal memos
- redacted letters

Watch out for:

- empty body content
- missing or mismatched frontmatter subtype
- frontmatter that uses unsupported metadata types

## Record

Use `record` for structured lists, logs, and tables that should sort or filter cleanly.

Source shape:

```json
{
  "subtype": "badge_swipes",
  "columns": [
    { "id": "timestamp", "label": "Timestamp", "sortable": true },
    { "id": "holder", "label": "Holder", "filterable": true }
  ],
  "rows": [
    {
      "id": "access-1",
      "timestamp": "2026-03-20T05:12:00Z",
      "holder": "Handler Rowan"
    }
  ]
}
```

Required fields:

- `subtype`
- `columns`, with at least one column
- `rows`, with at least one row
- every row must include an `id`

Column fields:

- `id`
- `label`
- optional `sortable`
- optional `filterable`

Row values:

- use keys that match the column ids
- values may be strings, numbers, booleans, or `null`

Supported subtype values:

- Free-form. Common choices in this repo include `badge_swipes`, `inventory_log`, `access_log`, and `timeline`.

Good uses:

- access logs
- custody logs
- inventory lists
- schedule tables
- numbered evidence trackers

Watch out for:

- column ids that do not match the row keys
- rows with no `id`
- tables that try to carry narrative prose better suited to `document`

## Thread

Use `thread` for message-based evidence that should feel like a conversation or chat transcript.

Source shape:

```json
{
  "subtype": "handler_message",
  "thread": {
    "subject": "Archive routing",
    "channel": "Operations relay",
    "participants": ["Handler Rowan", "Archivist Mira Sol"]
  },
  "messages": [
    {
      "id": "thread-1",
      "sender": "Handler Rowan",
      "timestamp": "2026-03-20T05:15:00Z",
      "body": "Start with the brief."
    }
  ]
}
```

Required fields:

- `subtype`
- `thread.subject`
- `messages`, with at least one message
- every message must include an `id`, `sender`, `timestamp`, and `body`

Optional fields:

- `thread.channel`
- `thread.participants`

Supported subtype values:

- Free-form. Common choices in this repo include `handler_message`, `witness_thread`, `interview_thread`, `message_log`, and `slack_thread`.

Good uses:

- witness interviews
- handler exchanges
- internal chat logs
- email-like back-and-forth captured as messages

Watch out for:

- non-ISO timestamps
- conversations that are really just a list of bullet points
- missing subject context for the thread header

## Photo

Use `photo` for still images that need a caption, source label, and optional date.

Source shape:

```json
{
  "subtype": "scene_photo",
  "image": "evidence/scene-board.png",
  "caption": "The training board with the archive artifacts arranged by evidence family.",
  "sourceLabel": "Training floor unit",
  "date": "2026-03-20"
}
```

Required fields:

- `subtype`
- `image`
- `caption`
- `sourceLabel`

Optional fields:

- `date`

Supported subtype values:

- `scene_photo`
- `object_photo`
- `surveillance_still`
- `found_photo`
- `portrait_mugshot`
- `portrait_staff_directory`
- `portrait_social`

Supported image extensions:

- `.jpg`
- `.jpeg`
- `.png`
- `.webp`

Good uses:

- scene stills
- portrait cards
- object closeups
- surveillance grabs
- found-item documentation

Watch out for:

- image paths that do not resolve inside the case folder
- unsupported image extensions
- captions that depend on the image to explain the entire clue

## Audio

Use `audio` for sound files that need a transcript and optional duration metadata.

Source shape:

```json
{
  "subtype": "voicemail",
  "audio": "evidence/handler-voicemail.wav",
  "transcript": "Check pier locker seven.",
  "sourceLabel": "Harbor dispatch archive",
  "date": "2026-03-20T05:42:00Z",
  "durationSeconds": 34
}
```

Required fields:

- `subtype`
- `audio`
- `transcript`
- `sourceLabel`

Optional fields:

- `date`
- `durationSeconds`

Supported subtype values:

- `voicemail`
- `interview_audio`
- `dispatch_audio`
- `radio_call`
- `confession_audio`

Supported audio extensions:

- `.mp3`
- `.wav`
- `.m4a`

Good uses:

- voicemails
- overheard radio traffic
- recorded interviews
- confession clips
- dispatch calls

Watch out for:

- missing transcripts
- unsupported audio extensions
- duration values that are not positive integers

## Diagram

Use `diagram` for structured visual layouts such as maps, floorplans, and route sketches.

Source shape:

```json
{
  "subtype": "floorplan",
  "viewport": { "width": 1200, "height": 800 },
  "elements": [
    {
      "id": "room-a",
      "type": "area",
      "x": 80,
      "y": 90,
      "width": 260,
      "height": 180,
      "label": "Core Archive"
    }
  ],
  "legend": [
    { "id": "room", "label": "Room" }
  ]
}
```

Required fields:

- `subtype`
- `viewport`
- `elements`, with at least one element

Optional fields:

- `legend`

Supported subtype values:

- `map`
- `floorplan`
- `site_diagram`
- `route_sketch`

Element types:

- `area` with `x`, `y`, `width`, `height`, and optional `label`
- `line` with at least two `points` pairs
- `marker` with `x`, `y`, and `label`
- `label` with `x`, `y`, and `text`

Good uses:

- building plans
- route diagrams
- crime-scene layouts
- annotated site maps

Watch out for:

- missing viewport dimensions
- empty element arrays
- line elements with fewer than two points

## Webpage

Use `webpage` for cached or reconstructed web pages, portal screens, directory listings, and similar browser-like views.

Source shape:

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
    }
  ]
}
```

Required fields:

- `subtype`
- `page`
- `blocks`, with at least one block

Optional fields on `page`:

- `urlLabel`
- `sourceLabel`

Supported subtype values:

- `webpage`
- `portal_screen`
- `directory_listing`
- `classified_ad`
- `company_site`
- `harbor_schedule_site`

Supported block types:

- `hero`
- `notice`
- `list`
- `table`
- `posts`
- `directory`

Block rules:

- `list` blocks need at least one item
- `table` blocks need at least one column and one row
- every `table` row must match the declared column count
- `posts` and `directory` blocks need at least one item

Good uses:

- cached intranet pages
- public company pages
- local schedule sites
- classified listings
- directory snapshots

Watch out for:

- mismatched table column and row lengths
- empty blocks that do not give the page a readable structure
- treating a webpage as a free-form document when the layout itself matters

## Picking The Right Family

- Use `document` when the clue is mostly prose and the layout does not matter much.
- Use `record` when the clue is best understood as a sortable or filterable grid.
- Use `thread` when the clue needs conversational flow.
- Use `photo` when the clue depends on what is visible in a still image.
- Use `audio` when the clue depends on what someone said.
- Use `diagram` when spatial relationships are the clue.
- Use `webpage` when the artifact should feel like a site, portal, or structured browser view.
