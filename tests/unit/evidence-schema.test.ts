import {
  documentEvidenceSourceSchema,
  evidenceIndexEntrySchema,
  recordEvidenceSourceSchema,
  threadEvidenceSourceSchema,
} from "@/features/cases/evidence/schema";

test("accepts document, record, and thread index entries", () => {
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

test("parses the three authored payload families", () => {
  expect(
    documentEvidenceSourceSchema.parse({ subtype: "memo", body: "# Memo" }),
  ).toBeTruthy();
  expect(
    recordEvidenceSourceSchema.parse({
      subtype: "bank_ledger",
      columns: [],
      rows: [],
    }),
  ).toBeTruthy();
  expect(
    threadEvidenceSourceSchema.parse({
      subtype: "sms_log",
      thread: { subject: "night watch" },
      messages: [],
    }),
  ).toBeTruthy();
});
