# Evidence Generation Guide — Dead Air at Larkspur House

This case is intentionally designed around **short, low-complexity artifacts** so the AI generation step stays consistent and cheap.

## General generation rules

- Keep every text artifact under **220 words**.
- Keep every record to **3–5 rows**.
- Keep every thread to **5–6 messages**.
- Use **clean prose and obvious timestamps** rather than layered wordplay.
- Put the clue in **one primary contradiction** per artifact, not several subtle ones.
- Avoid dense handwriting, ciphers, legal jargon, or intricate maps.

## Evidence targets

### 1. Opening Brief
- **Format:** markdown document
- **Target length:** 140–180 words
- **Primary clue:** the official ruling is already shaky because station timing and a missing item matter.
- **Generation note:** tone should feel like an agency intake memo.

### 2. Engineering Lockout Log
- **Format:** JSON record
- **Target length:** 4 rows
- **Primary clue:** Studio B had no power during the alleged electrocution window.
- **Generation note:** use plain operational language.

### 3. Night Porter Interview
- **Format:** JSON thread
- **Target length:** 6 messages
- **Primary clue:** Mara was alive in the archive alcove after the booth was already dark.
- **Generation note:** witness should sound practical, not theatrical.

### 4. Studio B Scene Photo
- **Format:** JSON photo + PNG image
- **Primary clue:** dark booth, red breaker tag, cup, tote by the door.
- **Image prompt:**
  "A moody, non-graphic interior photo of a small community radio booth at night. The room is dark except for faint hallway spill light. A red lockout tag hangs beside a wall switch. A tipped paper coffee cup lies near a microphone cable on the floor. A worn canvas recorder tote sits just inside the doorway. Realistic documentary style, no body visible, no logos, no text overlays."

### 5. Anniversary Rundown Thread
- **Format:** JSON thread
- **Target length:** 5 messages
- **Primary clue:** Mara planned to bring an original founder reel to the board room.
- **Generation note:** keep conflict professional and terse.

### 6. Archive Checkout Log
- **Format:** JSON record
- **Target length:** 4 rows
- **Primary clue:** reel F-19 was checked out, its sleeve was found empty, and the reel was missing after the incident.
- **Generation note:** use catalog/archive wording, not police wording.

### 7. Archive Tote Photo
- **Format:** JSON photo + PNG image
- **Primary clue:** a round slot in the tote is empty and a torn label matches the missing reel.
- **Image prompt:**
  "A close evidence photo of a worn canvas audio tote resting on a table. One padded circular compartment is empty. A torn paper label fragment with only partial words remains attached inside. A loose metal spindle sits beside the empty slot. Neutral evidence-lighting, realistic texture, no hands, no logos, no graphic content."

### 8. Draft Gala Remarks
- **Format:** markdown document
- **Target length:** 100–150 words
- **Primary clue:** the full reel would have blocked the sale and Mara knew Jonas was hiding part of the transcript.
- **Generation note:** bullet points work better than long prose.

### 9. Production Intern Interview
- **Format:** JSON thread
- **Target length:** 6 messages
- **Primary clue:** Jonas left the archive corridor carrying the reel tin shortly before the body was found.
- **Generation note:** intern should sound nervous but clear.

### 10. Sale Briefing Memo
- **Format:** markdown document
- **Target length:** 90–140 words
- **Primary clue:** Jonas had ownership of the sale presentation and needed the founder archive to look clean.
- **Generation note:** make the margin note do the emotional work.
