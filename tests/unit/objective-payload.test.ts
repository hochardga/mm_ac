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
