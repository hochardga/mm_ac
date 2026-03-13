import { afterEach, expect, test, vi } from "vitest";

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((target: string) => {
    throw new Error(`NEXT_REDIRECT:${target}`);
  }),
}));
const { saveReportDraftMock } = vi.hoisted(() => ({
  saveReportDraftMock: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/features/drafts/save-report-draft", () => ({
  saveReportDraft: saveReportDraftMock,
}));

vi.mock("@/features/notes/save-note", () => ({
  saveNote: vi.fn(),
}));

vi.mock("@/features/submissions/submit-report", () => ({
  submitReport: vi.fn(),
}));

import { saveReportDraftAction } from "@/app/(app)/cases/[caseSlug]/actions";

afterEach(() => {
  redirectMock.mockClear();
  saveReportDraftMock.mockReset();
});

test("encodes the selected evidence id when redirecting after a draft save", async () => {
  saveReportDraftMock.mockResolvedValue({
    id: "draft-1",
  });

  const formData = new FormData();
  formData.set("caseSlug", "red-harbor");
  formData.set("playerCaseId", "player-case-1");
  formData.set("selectedEvidenceId", "night/watch & thread");
  formData.set("suspectId", "dispatcher");
  formData.set("motiveId", "smuggling");
  formData.set("methodId", "signal-room");

  await expect(saveReportDraftAction(formData)).rejects.toThrow(
    "NEXT_REDIRECT:/cases/red-harbor?evidence=night%2Fwatch%20%26%20thread",
  );
  expect(redirectMock).toHaveBeenCalledWith(
    "/cases/red-harbor?evidence=night%2Fwatch%20%26%20thread",
  );
});
