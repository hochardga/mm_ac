import {
  caseEvidenceSchema,
  documentEvidenceSourceSchema,
  evidenceIndexEntrySchema,
  photoEvidenceSourceSchema,
  recordEvidenceSourceSchema,
  threadEvidenceSourceSchema,
} from "@/features/cases/evidence/schema";

test("accepts document, record, thread, and photo index entries", () => {
  expect(
    evidenceIndexEntrySchema.parse({
      id: "ledger",
      title: "Ledger",
      family: "document",
      subtype: "legal_doc",
      summary: "A damaged parish ledger.",
      source: "evidence/ledger.md",
    }),
  ).toMatchObject({ family: "document" });
  expect(
    evidenceIndexEntrySchema.parse({
      id: "access-log",
      title: "Access Log",
      family: "record",
      subtype: "badge_swipes",
      summary: "Door entries near the vestry.",
      source: "evidence/access-log.json",
    }),
  ).toMatchObject({ family: "record" });
  expect(
    evidenceIndexEntrySchema.parse({
      id: "interview",
      title: "Interview Transcript",
      family: "thread",
      subtype: "interview_transcript",
      summary: "Transcript from the vestry interview.",
      source: "evidence/interview.json",
    }),
  ).toMatchObject({ family: "thread" });
  expect(
    evidenceIndexEntrySchema.parse({
      id: "vestry-scene-photo",
      title: "Vestry Scene Photo",
      family: "photo",
      subtype: "scene_photo",
      summary: "The chalice rests beside the desk after the alarm.",
      source: "evidence/vestry-scene-photo.json",
    }),
  ).toMatchObject({ family: "photo" });
});

test("rejects the legacy kind + content shape", () => {
  expect(() =>
    evidenceIndexEntrySchema.parse({
      id: "legacy",
      title: "Legacy",
      kind: "document",
      content: "inline text",
    }),
  ).toThrow();
});

test("parses the four authored payload families", () => {
  expect(
    documentEvidenceSourceSchema.parse({ subtype: "memo", body: "# Memo" }),
  ).toMatchObject({
    subtype: "memo",
    body: "# Memo",
  });
  expect(
    recordEvidenceSourceSchema.parse({
      subtype: "bank_ledger",
      columns: [],
      rows: [],
    }),
  ).toMatchObject({
    subtype: "bank_ledger",
    columns: [],
    rows: [],
  });
  expect(
    threadEvidenceSourceSchema.parse({
      subtype: "sms_log",
      thread: { subject: "night watch" },
      messages: [],
    }),
  ).toMatchObject({
    subtype: "sms_log",
    thread: { subject: "night watch" },
    messages: [],
  });
  expect(
    photoEvidenceSourceSchema.parse({
      subtype: "scene_photo",
      image: "evidence/vestry-scene-photo.png",
      caption: "The silver chalice lies on the vestry floor.",
      sourceLabel: "Parish evidence locker",
    }),
  ).toMatchObject({
    subtype: "scene_photo",
    image: "evidence/vestry-scene-photo.png",
    caption: "The silver chalice lies on the vestry floor.",
    sourceLabel: "Parish evidence locker",
  });
});

test("rejects unsupported photo subtypes", () => {
  expect(() =>
    photoEvidenceSourceSchema.parse({
      subtype: "crime_scene",
      image: "evidence/photo.png",
      caption: "A mislabeled subtype.",
      sourceLabel: "Archive",
    }),
  ).toThrow(/subtype/i);
});

test("rejects non-ISO thread timestamps", () => {
  expect(() =>
    threadEvidenceSourceSchema.parse({
      subtype: "sms_log",
      thread: { subject: "night watch" },
      messages: [
        {
          id: "message-1",
          sender: "Handler Rowan",
          timestamp: "March 12, 2026 8:00 AM",
          body: "Check the ledger transfer.",
        },
      ],
    }),
  ).toThrow(/timestamp/i);
});

test("normalized document evidence keeps the non-empty body constraint", () => {
  expect(() =>
    caseEvidenceSchema.parse({
      id: "ledger",
      title: "Ledger",
      family: "document",
      subtype: "memo",
      summary: "A damaged parish ledger.",
      source: "evidence/ledger.md",
      body: "",
      meta: {},
    }),
  ).toThrow();
});

test("normalized photo evidence keeps caption and sourceLabel required", () => {
  expect(() =>
    caseEvidenceSchema.parse({
      id: "photo-1",
      title: "Photo",
      family: "photo",
      subtype: "scene_photo",
      summary: "Summary",
      source: "evidence/photo.json",
      image: "evidence/photo.png",
      caption: "",
      sourceLabel: "",
    }),
  ).toThrow();
});
