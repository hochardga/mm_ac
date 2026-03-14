import { normalizeObjectivePayload } from "@/features/cases/objective-payload";

test("normalizes single-choice payloads", () => {
  const formData = new FormData();
  formData.set("choiceId", "bookkeeper");

  expect(normalizeObjectivePayload("single_choice", formData)).toEqual({
    type: "single_choice",
    choiceId: "bookkeeper",
  });
});

test("normalizes multi-choice payloads", () => {
  const formData = new FormData();
  formData.append("choiceIds", "ledger");
  formData.append("choiceIds", "ledger");
  formData.append("choiceIds", "chalice");

  expect(normalizeObjectivePayload("multi_choice", formData)).toEqual({
    type: "multi_choice",
    choiceIds: ["ledger", "chalice"],
  });
});

test("normalizes boolean payloads", () => {
  const formData = new FormData();
  formData.set("value", "true");

  expect(normalizeObjectivePayload("boolean", formData)).toEqual({
    type: "boolean",
    value: true,
  });
});

test("normalizes code-entry payloads", () => {
  const formData = new FormData();
  formData.set("value", "VESPER-17");

  expect(normalizeObjectivePayload("code_entry", formData)).toEqual({
    type: "code_entry",
    value: "VESPER-17",
  });
});

test("rejects missing single-choice values", () => {
  const formData = new FormData();

  expect(() => normalizeObjectivePayload("single_choice", formData)).toThrow(
    "single_choice objective requires choiceId",
  );
});

test("rejects empty multi-choice payloads", () => {
  const formData = new FormData();

  expect(() => normalizeObjectivePayload("multi_choice", formData)).toThrow(
    "multi_choice objective requires at least one choice",
  );
});

test("rejects invalid boolean values", () => {
  const formData = new FormData();
  formData.set("value", "not-boolean");

  expect(() => normalizeObjectivePayload("boolean", formData)).toThrow(
    "Boolean objective values must be true or false",
  );
});

test("rejects missing code-entry values", () => {
  const formData = new FormData();

  expect(() => normalizeObjectivePayload("code_entry", formData)).toThrow(
    "code_entry objective requires value",
  );
});

test("rejects unsupported objective types", () => {
  const formData = new FormData();

  expect(() => normalizeObjectivePayload("unsupported_type", formData)).toThrow(
    "Unsupported objective type: unsupported_type",
  );
});
