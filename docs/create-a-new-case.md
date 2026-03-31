# Create a New Case

This guide explains how to add a new staged case package to Ashfall Collective.

It is written for new work only. If you are adding a case today, use the staged format already present in [`content/cases/red-harbor`](../content/cases/red-harbor), [`content/cases/hollow-bishop`](../content/cases/hollow-bishop), and [`content/cases/briar-ledger`](../content/cases/briar-ledger).

## What You Are Creating

Each case lives in its own folder under `content/cases/<slug>/` and has three core authored layers plus an optional opening introduction:

- `manifest.json`: player-safe metadata, evidence index, stages, and objectives
- `protected.json`: canonical answers, grading limits, and debrief copy
- `evidence/`: the actual artifact files referenced by the manifest
- `introduction/`: optional opening narration transcript and audio, kept separate from evidence

These layers have to stay aligned:

- `manifest.json` defines every stage id, objective id, and evidence id
- `protected.json` uses the same objective ids for canonical answers
- each stage's `evidenceIds` must point at evidence entries in the manifest
- each evidence entry's `source` must point at a real file inside the case folder

## Quick Start

1. Create a new folder at `content/cases/<slug>/`.
2. Add `manifest.json` with top-level metadata, evidence entries, and at least one stage.
3. Add `protected.json` with `maxGradedFailures`, canonical answers, and both debrief outcomes.
4. Add the files referenced from `manifest.json` under `evidence/`. If the case has an opening introduction, add `introduction/transcript.md` and optional `introduction/audio.mp3`.
5. Run `pnpm validate:cases`.
6. Run `pnpm build`.

If you want the smallest possible starting point, copy the one-stage shape from [`content/cases/red-harbor/manifest.json`](../content/cases/red-harbor/manifest.json) and [`content/cases/red-harbor/protected.json`](../content/cases/red-harbor/protected.json), then expand it once the package validates.

## Folder Structure

Start with this layout:

```text
content/
  cases/
    your-case-slug/
      manifest.json
      protected.json
      introduction/
        transcript.md
        audio.mp3
      evidence/
        opening-brief.md
        witness-thread.json
        station-log.json
        scene-photo.json
        scene-photo.png
```

Notes:

- The folder name should match `slug` in both `manifest.json` and `protected.json`.
- `source` paths in the manifest are relative to the case folder, not the repo root.
- Photo evidence usually uses two files: a JSON metadata file plus the referenced image asset.

## Optional Introduction Folder

Use `content/cases/<slug>/introduction/` for a case-opening narration that should feel like part of the case opener instead of evidence.

The folder is separate from the manifest and evidence index:

- `transcript.md` is required for the introduction to count as present
- `audio.mp3` is optional, but when present the case page will try to autoplay it and fall back to a visible `Play Introduction` button if the browser blocks playback
- the case header gets a `Replay Introduction` action only when the loader finds a valid introduction bundle
- replay uses `intro=1` in the case URL; it does not change the evidence index or stage flow

Keep in mind:

- do not add the introduction transcript or audio to the evidence index
- do not create manifest entries, stage unlocks, or protected answers for the introduction
- if `transcript.md` is missing, empty, or unreadable, the introduction is treated as absent

## Starter Templates

### `manifest.json`

Use this as the starting point for a new staged case:

```json
{
  "slug": "your-case-slug",
  "revision": "rev-1",
  "title": "Your Case Title",
  "summary": "One or two sentences that explain the mystery without spoiling the solution.",
  "complexity": "standard",
  "evidence": [
    {
      "id": "opening-brief",
      "title": "Opening Brief",
      "family": "document",
      "subtype": "case_brief",
      "summary": "The first artifact the player reads when the case opens.",
      "source": "evidence/opening-brief.md"
    }
  ],
  "stages": [
    {
      "id": "opening-pass",
      "startsUnlocked": true,
      "title": "Opening Pass",
      "summary": "The first question the player should answer.",
      "handlerPrompts": [
        "Start with the opening brief.",
        "Focus on the clue that narrows the suspect pool first."
      ],
      "evidenceIds": ["opening-brief"],
      "objectives": [
        {
          "id": "identify-first-lead",
          "prompt": "Which lead should the player follow first?",
          "type": "single_choice",
          "stakes": "graded",
          "options": [
            { "id": "warehouse-ledger", "label": "The warehouse ledger" },
            { "id": "harbor-log", "label": "The harbor watch log" }
          ],
          "successUnlocks": {
            "stageIds": [],
            "resolvesCase": true
          }
        }
      ]
    }
  ]
}
```

Required fields:

- `slug`, `revision`, `title`, `summary`, and `complexity`
- at least one `evidence` entry
- at least one `stage`
- at least one stage with `startsUnlocked: true`
- at least one objective per stage

Keep aligned:

- every `evidenceIds` entry must match an evidence `id`
- every objective `id` must be unique across the whole case
- every `successUnlocks.stageIds` entry must match a real stage id

Watch out for:

- duplicate evidence ids, stage ids, or objective ids
- unlock graphs with missing, cyclic, or unreachable stages
- a `source` value that does not exist on disk

Optional manifest note:

- evidence entries can include an optional `viewer` object with `density`, `newestFirst`, or `defaultExpanded`, but you can skip that for a first case.

### `protected.json`

Use this as the matching protected payload:

```json
{
  "slug": "your-case-slug",
  "revision": "rev-1",
  "grading": {
    "maxGradedFailures": 3
  },
  "canonicalAnswers": {
    "identify-first-lead": {
      "type": "single_choice",
      "choiceId": "warehouse-ledger"
    }
  },
  "debriefs": {
    "solved": {
      "title": "Debrief: Your Case Title",
      "summary": "A short explanation of what happened and why the player's answer was correct."
    },
    "closed_unsolved": {
      "title": "Case Closed: Your Case Title",
      "summary": "A short explanation of what Ashfall knows if the case closes without a solved outcome."
    }
  }
}
```

Required fields:

- the same `slug` and `revision` used in `manifest.json`
- `grading.maxGradedFailures`
- one canonical answer for every objective id in the manifest
- both debrief outcomes: `solved` and `closed_unsolved`

Canonical answer shapes by objective type:

```json
{
  "type": "single_choice",
  "choiceId": "option-id"
}
```

```json
{
  "type": "multi_choice",
  "choiceIds": ["option-a", "option-b"]
}
```

```json
{
  "type": "boolean",
  "value": true
}
```

```json
{
  "type": "code_entry",
  "value": "DW"
}
```

Keep aligned:

- the key inside `canonicalAnswers` must match an objective `id`
- the answer `type` must match the objective `type`
- choice ids must come from the option ids defined in the manifest

Watch out for:

- mismatching `slug` or `revision`
- missing answers for an objective
- using `choiceId` for a `multi_choice` objective or `choiceIds` for a `single_choice` objective

### Markdown document evidence

Use markdown for letters, briefs, transcripts, notices, and other text-first artifacts.

Path example: `evidence/opening-brief.md`

```md
---
subtype: "case_brief"
meta:
  sourceLabel: "Ashfall intake file"
  handlingNote: "Prepared for field review"
---
# Opening Brief

The courier was found dead two blocks from the river gate with a sealed ledger page missing from the satchel.

Two witnesses place a customs runner near the scene, but neither saw who handed off the satchel before dawn.
```

Required pieces:

- frontmatter `subtype`
- markdown body with actual content

Good fit when:

- the player should read a narrative artifact from top to bottom
- formatting and headings help sell the artifact

Watch out for:

- a frontmatter `subtype` that does not match the manifest entry `subtype`

### JSON record evidence

Use record evidence for logs, ledgers, rosters, inventories, and tabular artifacts the player should scan or compare.

Path example: `evidence/station-log.json`

```json
{
  "subtype": "station_log",
  "columns": [
    { "id": "timestamp", "label": "Timestamp", "sortable": true },
    { "id": "location", "label": "Location", "filterable": true },
    { "id": "note", "label": "Note" }
  ],
  "rows": [
    {
      "id": "log-1",
      "timestamp": "2026-03-14T05:10:00Z",
      "location": "River Gate",
      "note": "Courier admitted through the east postern."
    },
    {
      "id": "log-2",
      "timestamp": "2026-03-14T05:21:00Z",
      "location": "Warehouse Yard",
      "note": "Unscheduled lantern signal recorded near pier storage."
    }
  ]
}
```

Required pieces:

- top-level `subtype`
- `columns` array
- `rows` array with an `id` on every row

Good fit when:

- the important clue comes from comparing rows
- the player needs sortable or filterable structured data

Watch out for:

- missing row ids
- a `subtype` mismatch between the JSON file and manifest entry

### JSON thread evidence

Use thread evidence for interviews, message chains, email-style exchanges, or handler transcripts.

Path example: `evidence/witness-thread.json`

```json
{
  "subtype": "interview_transcript",
  "thread": {
    "subject": "Dockside witness interview",
    "channel": "Interview room",
    "participants": ["Handler Rowan", "Witness Mara Vale"]
  },
  "messages": [
    {
      "id": "thread-1",
      "sender": "Handler Rowan",
      "timestamp": "2026-03-14T06:02:00Z",
      "body": "Tell me what you saw before the bell tower sounded."
    },
    {
      "id": "thread-2",
      "sender": "Witness Mara Vale",
      "timestamp": "2026-03-14T06:03:00Z",
      "body": "A customs runner crossed the yard alone, but someone else had already moved the satchel."
    }
  ]
}
```

Required pieces:

- top-level `subtype`
- `thread.subject`
- at least one message with `id`, `sender`, `timestamp`, and `body`

Good fit when:

- the player should reconstruct meaning from back-and-forth conversation
- the timing of statements matters

Watch out for:

- non-ISO timestamps
- a `subtype` mismatch between the JSON file and manifest entry

### JSON photo evidence

Use photo evidence when the visual artifact itself matters and you need a caption plus source label in the viewer.

Path example: `evidence/scene-photo.json`

```json
{
  "subtype": "scene_photo",
  "image": "evidence/scene-photo.png",
  "caption": "A lantern sits beside the torn satchel while river mud dries across the warehouse threshold.",
  "sourceLabel": "Field photography unit",
  "date": "2026-03-14"
}
```

Required pieces:

- `subtype`
- `image`
- `caption`
- `sourceLabel`

Good fit when:

- the clue is spatial, visual, or best understood by inspection

Watch out for:

- forgetting to add the image asset itself
- using a photo `subtype` outside the allowed set: `scene_photo`, `object_photo`, `surveillance_still`, `found_photo`

## Authoring Tips

### Pick the right complexity

Use complexity as a promise about structure, not just length:

- `light`: one stage or one clean reveal, usually one main objective
- `standard`: a small chain of unlocks, usually two stages or one stage with a meaningful follow-up
- `deep`: several linked reveals, multiple evidence types, and more layered progression

If a case is still fun when collapsed to one decisive question, start with `light`. Move to `standard` or `deep` only when the extra stage changes what the player knows or how they reason.

### Pick the right objective type

- `single_choice`: best for one correct answer from a short suspect or theory list
- `multi_choice`: best when the player must identify a set of related findings
- `boolean`: best for a clean yes or no conclusion
- `code_entry`: best for short extracted strings, initials, room numbers, or other exact text clues

Keep the prompt tightly matched to the input. If the player needs to explain themselves in prose, the current system is probably not the right fit for that objective.

### Design stages around discoveries

Good stage boundaries usually follow new information:

1. the player extracts or confirms something
2. that answer unlocks new evidence or a narrower question
3. the next stage asks for a meaningfully different conclusion

Keep stages small. If one stage contains every piece of evidence and three unrelated objectives, it probably wants to be split.

### Pick the right evidence family

- `document`: use for text artifacts the player reads straight through
- `record`: use for tables, rosters, and logs the player compares row by row
- `thread`: use for conversations, interviews, and message chains
- `photo`: use when the image itself carries the clue

If the clue lives in prose flow, choose `document`. If the clue lives in comparison, choose `record`. If the clue lives in timing and responses, choose `thread`. If the clue lives in what the player sees, choose `photo`.

### Write spoiler-light summaries and prompts

- evidence summaries should tell the player why an artifact matters without giving away the answer
- handler prompts should steer attention, not solve the step
- debrief summaries should explain the resolution clearly once the case ends

As a rule of thumb, if the summary names the correct answer directly, it is probably too revealing for the manifest.

## Validation And Common Mistakes

Run these commands after authoring a case:

```bash
pnpm validate:cases
pnpm build
```

`pnpm validate:cases` checks every authored case package in `content/cases/`. It will fail fast if the manifest, protected payload, or referenced evidence files do not match the current contract.

Common mistakes:

- using different `slug` or `revision` values between `manifest.json` and `protected.json`
- forgetting to mark any stage as `startsUnlocked: true`
- reusing a stage id, objective id, or evidence id
- referencing an evidence id from a stage that is not present in `evidence`
- referencing a stage id in `successUnlocks.stageIds` that does not exist
- creating an unlock graph with unreachable or cyclic stages
- pointing `source` at a file that is missing
- using a document, record, thread, or photo `subtype` that does not match the manifest entry
- giving `protected.json` an answer shape that does not match the objective type
- putting the opening introduction into the evidence index instead of `introduction/`
- forgetting that `introduction/transcript.md` must exist and contain real text for the intro to count as present

When in doubt, compare against:

- [`content/cases/red-harbor`](../content/cases/red-harbor) for a simple one-stage case
- [`content/cases/hollow-bishop`](../content/cases/hollow-bishop) for a staged case with photo and thread evidence
- [`content/cases/briar-ledger`](../content/cases/briar-ledger) for a deeper staged case with `code_entry`, `multi_choice`, and `single_choice` objectives

## Final Checklist

Before opening a PR:

- the case folder name matches the `slug`
- `manifest.json` and `protected.json` share the same `slug` and `revision`
- every evidence, stage, and objective id is unique
- every objective in the manifest has a matching answer in `protected.json`
- every referenced evidence file exists under `evidence/`
- any optional introduction lives under `introduction/` and is not duplicated in `evidence/`
- stage unlocks point at real stage ids and still form a reachable graph
- both debrief outcomes are written
- `pnpm validate:cases` passes
- `pnpm build` passes
