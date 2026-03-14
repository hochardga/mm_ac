import { afterEach, expect, test, vi } from "vitest";
import { randomUUID } from "node:crypto";

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((target: string) => {
    throw new Error(`NEXT_REDIRECT:${target}`);
  }),
}));
const { saveReportDraftMock } = vi.hoisted(() => ({
  saveReportDraftMock: vi.fn(),
}));
const { saveObjectiveDraftMock } = vi.hoisted(() => ({
  saveObjectiveDraftMock: vi.fn(),
}));
const { submitObjectiveMock } = vi.hoisted(() => ({
  submitObjectiveMock: vi.fn(),
}));
const { toggleEvidenceBookmarkMock } = vi.hoisted(() => ({
  toggleEvidenceBookmarkMock: vi.fn(),
}));
const { cookiesMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
}));
const { getServerSessionMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/features/drafts/save-report-draft", () => ({
  saveReportDraft: saveReportDraftMock,
}));

vi.mock("@/features/drafts/save-objective-draft", () => ({
  saveObjectiveDraft: saveObjectiveDraftMock,
}));

vi.mock("@/features/notes/save-note", () => ({
  saveNote: vi.fn(),
}));

vi.mock("@/features/submissions/submit-objective", () => ({
  submitObjective: submitObjectiveMock,
}));

vi.mock("@/features/cases/evidence-bookmarks", () => ({
  toggleEvidenceBookmark: toggleEvidenceBookmarkMock,
}));

vi.mock("@/features/submissions/submit-report", () => ({
  submitReport: vi.fn(),
}));

import * as caseActions from "@/app/(app)/cases/[caseSlug]/actions";
import { caseDefinitions, playerCases, users } from "@/db/schema";
import { closeDb, getDb } from "@/lib/db";

afterEach(async () => {
  redirectMock.mockClear();
  saveReportDraftMock.mockReset();
  saveObjectiveDraftMock.mockReset();
  submitObjectiveMock.mockReset();
  toggleEvidenceBookmarkMock.mockReset();
  cookiesMock.mockReset();
  getServerSessionMock.mockReset();
  await closeDb();
});

async function seedPlayerCase(userId: string) {
  const db = await getDb();
  const caseDefinitionId = randomUUID();
  const playerCaseId = randomUUID();

  await seedUser(userId);
  await db.insert(caseDefinitions).values({
    id: caseDefinitionId,
    slug: "red-harbor",
    title: "Signal at Red Harbor",
    currentPublishedRevision: "rev-1",
  });
  await db.insert(playerCases).values({
    id: playerCaseId,
    userId,
    caseDefinitionId,
    caseRevision: "rev-1",
    status: "in_progress",
  });

  return playerCaseId;
}

async function seedUser(userId: string) {
  const db = await getDb();

  await db.insert(users).values({
    id: userId,
    email: `${userId}@example.com`,
    passwordHash: "hashed-password",
    alias: "Agent Actions",
  });
}

function setAuthenticatedSession(userId: string) {
  getServerSessionMock.mockResolvedValue({
    user: {
      id: userId,
    },
  });
  cookiesMock.mockResolvedValue({
    get: () => undefined,
  });
}

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

test("encodes selected evidence id when redirecting after objective draft save", async () => {
  const userId = randomUUID();
  const playerCaseId = await seedPlayerCase(userId);
  setAuthenticatedSession(userId);
  saveObjectiveDraftMock.mockResolvedValue({
    id: "objective-1",
  });

  const formData = new FormData();
  formData.set("caseSlug", "red-harbor");
  formData.set("playerCaseId", playerCaseId);
  formData.set("objectiveId", "pick-suspect");
  formData.set("objectiveType", "single_choice");
  formData.set("choiceId", "bookkeeper");
  formData.set("selectedEvidenceId", "night/watch & thread");

  await expect(saveObjectiveDraftAction(formData)).rejects.toThrow(
    "NEXT_REDIRECT:/cases/red-harbor?evidence=night%2Fwatch%20%26%20thread",
  );
  expect(saveObjectiveDraftMock).toHaveBeenCalledWith({
    playerCaseId,
    objectiveId: "pick-suspect",
    payload: {
      type: "single_choice",
      choiceId: "bookkeeper",
    },
  });
  expect(redirectMock).toHaveBeenCalledWith(
    "/cases/red-harbor?evidence=night%2Fwatch%20%26%20thread",
  );
});

test("rejects objective draft saves for a player case owned by another agent", async () => {
  const ownerId = randomUUID();
  const attackerId = randomUUID();
  const playerCaseId = await seedPlayerCase(ownerId);
  await seedUser(attackerId);
  setAuthenticatedSession(attackerId);

  const formData = new FormData();
  formData.set("caseSlug", "red-harbor");
  formData.set("playerCaseId", playerCaseId);
  formData.set("objectiveId", "pick-suspect");
  formData.set("objectiveType", "single_choice");
  formData.set("choiceId", "bookkeeper");

  await expect(saveObjectiveDraftAction(formData)).rejects.toThrow(/not authorized/i);
  expect(saveObjectiveDraftMock).not.toHaveBeenCalled();
});

test("rejects objective submissions for a player case owned by another agent", async () => {
  const ownerId = randomUUID();
  const attackerId = randomUUID();
  const playerCaseId = await seedPlayerCase(ownerId);
  await seedUser(attackerId);
  setAuthenticatedSession(attackerId);

  const formData = new FormData();
  formData.set("caseSlug", "red-harbor");
  formData.set("playerCaseId", playerCaseId);
  formData.set("objectiveId", "pick-suspect");
  formData.set("objectiveType", "single_choice");
  formData.set("submissionToken", "submission-token");
  formData.set("choiceId", "bookkeeper");

  await expect(submitObjectiveAction(formData)).rejects.toThrow(/not authorized/i);
  expect(submitObjectiveMock).not.toHaveBeenCalled();
});

const {
  saveObjectiveDraftAction,
  saveReportDraftAction,
  submitObjectiveAction,
} = caseActions;

test("exports a bookmark toggle action", () => {
  expect("toggleEvidenceBookmarkAction" in caseActions).toBe(true);
});

test("encodes selected evidence id when redirecting after a bookmark toggle", async () => {
  const userId = randomUUID();
  const playerCaseId = await seedPlayerCase(userId);
  const toggleEvidenceBookmarkAction = (
    caseActions as Record<string, unknown>
  ).toggleEvidenceBookmarkAction as ((formData: FormData) => Promise<unknown>) | undefined;

  setAuthenticatedSession(userId);
  toggleEvidenceBookmarkMock.mockResolvedValue({
    bookmarked: true,
    bookmarks: [],
  });

  const formData = new FormData();
  formData.set("caseSlug", "red-harbor");
  formData.set("playerCaseId", playerCaseId);
  formData.set("selectedEvidenceId", "night/watch & thread");
  formData.set("evidenceId", "dispatch-log");

  expect(toggleEvidenceBookmarkAction).toBeTypeOf("function");

  await expect(toggleEvidenceBookmarkAction?.(formData)).rejects.toThrow(
    "NEXT_REDIRECT:/cases/red-harbor?evidence=night%2Fwatch%20%26%20thread",
  );
  expect(toggleEvidenceBookmarkMock).toHaveBeenCalledWith({
    playerCaseId,
    evidenceId: "dispatch-log",
  });
  expect(redirectMock).toHaveBeenCalledWith(
    "/cases/red-harbor?evidence=night%2Fwatch%20%26%20thread",
  );
});

test("rejects bookmark toggles for a player case owned by another agent", async () => {
  const ownerId = randomUUID();
  const attackerId = randomUUID();
  const playerCaseId = await seedPlayerCase(ownerId);
  const toggleEvidenceBookmarkAction = (
    caseActions as Record<string, unknown>
  ).toggleEvidenceBookmarkAction as ((formData: FormData) => Promise<unknown>) | undefined;

  await seedUser(attackerId);
  setAuthenticatedSession(attackerId);

  const formData = new FormData();
  formData.set("caseSlug", "red-harbor");
  formData.set("playerCaseId", playerCaseId);
  formData.set("selectedEvidenceId", "dispatch-log");
  formData.set("evidenceId", "dispatch-log");

  expect(toggleEvidenceBookmarkAction).toBeTypeOf("function");

  await expect(toggleEvidenceBookmarkAction?.(formData)).rejects.toThrow(
    /not authorized/i,
  );
  expect(toggleEvidenceBookmarkMock).not.toHaveBeenCalled();
});
