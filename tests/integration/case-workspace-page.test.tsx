import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, test, vi } from "vitest";

const { cookiesMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
}));
const { getServerSessionMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
}));
const { routerPushMock, redirectMock, notFoundMock } = vi.hoisted(() => ({
  routerPushMock: vi.fn(),
  redirectMock: vi.fn((target: string) => {
    throw new Error(`NEXT_REDIRECT:${target}`);
  }),
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
  redirect: redirectMock,
  useRouter: () => ({
    push: routerPushMock,
  }),
}));

import CasePage from "@/app/(app)/cases/[caseSlug]/page";
import {
  objectiveSubmissions,
  playerCaseObjectives,
  playerCases,
  users,
} from "@/db/schema";
import * as caseManifestLoader from "@/features/cases/load-case-manifest";
import type { LoadedStagedCaseManifest } from "@/features/cases/load-case-manifest";
import { openCase } from "@/features/cases/open-case";
import { rememberViewedEvidence } from "@/features/cases/remember-viewed-evidence";
import { saveNote } from "@/features/notes/save-note";
import { closeDb, getDb } from "@/lib/db";

afterEach(async () => {
  vi.restoreAllMocks();
  cookiesMock.mockReset();
  getServerSessionMock.mockReset();
  routerPushMock.mockReset();
  redirectMock.mockClear();
  notFoundMock.mockClear();
  await closeDb();
});

test("renders an evidence index, evidence modal, and persistent notes together", async () => {
  const db = await getDb();
  const userId = randomUUID();

  await db.insert(users).values({
    id: userId,
    email: "agent@example.com",
    passwordHash: "hashed-password",
    alias: "Agent Ash",
  });

  getServerSessionMock.mockResolvedValue({
    user: {
      id: userId,
    },
  });
  cookiesMock.mockResolvedValue({
    get: () => undefined,
  });

  render(
    await CasePage({
      params: Promise.resolve({ caseSlug: "hollow-bishop" }),
      searchParams: Promise.resolve({ evidence: "vestry-interview" }),
    } as never),
  );

  expect(
    screen.getByRole("heading", { name: /evidence intake/i, hidden: true }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: /field notes/i, hidden: true }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: /active objectives/i, hidden: true }),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/the silver chalice was on the floor beside the desk/i),
  ).toBeInTheDocument();
  expect(
    screen.getAllByText(/was the silver chalice actually the murder weapon/i)
      .length,
  ).toBeGreaterThan(0);
  expect(
    screen.queryByText(/active evidence:/i),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("dialog", { name: /vestry interview transcript/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: /close evidence/i }),
  ).toHaveAttribute("href", "/cases/hollow-bishop#evidence-vestry-interview");
  const headerSection = screen
    .getByRole("heading", { name: /the hollow bishop/i, hidden: true })
    .closest("section");
  expect(headerSection).not.toBeNull();
  expect(
    within(headerSection as HTMLElement).getByText(/stage 1 of 2/i),
  ).toBeInTheDocument();
  expect(
    within(headerSection as HTMLElement).getByText(/ledger review/i),
  ).toBeInTheDocument();
  expect(
    within(headerSection as HTMLElement).getByText(/3 evidence items unlocked/i),
  ).toBeInTheDocument();
});

test("preserves the selected evidence when saving an objective draft", async () => {
  const db = await getDb();
  const userId = randomUUID();

  await db.insert(users).values({
    id: userId,
    email: "objective-draft-agent@example.com",
    passwordHash: "hashed-password",
    alias: "Agent Objective Draft",
  });

  getServerSessionMock.mockResolvedValue({
    user: {
      id: userId,
    },
  });
  cookiesMock.mockResolvedValue({
    get: () => undefined,
  });

  render(
    await CasePage({
      params: Promise.resolve({ caseSlug: "red-harbor" }),
      searchParams: Promise.resolve({ evidence: "dispatch-log" }),
    } as never),
  );

  expect(screen.getByDisplayValue("dispatch-log")).toBeInTheDocument();
});

test("loads the case manifest using the player's pinned revision", async () => {
  const db = await getDb();
  const userId = randomUUID();

  await db.insert(users).values({
    id: userId,
    email: "revision-agent@example.com",
    passwordHash: "hashed-password",
    alias: "Agent Revision",
  });

  getServerSessionMock.mockResolvedValue({
    user: {
      id: userId,
    },
  });
  cookiesMock.mockResolvedValue({
    get: () => undefined,
  });

  const { playerCase } = await openCase({
    userId,
    caseSlug: "hollow-bishop",
  });
  const loadAnyCaseManifestSpy = vi.spyOn(
    caseManifestLoader,
    "loadAnyCaseManifest",
  );

  render(
    await CasePage({
      params: Promise.resolve({ caseSlug: "hollow-bishop" }),
    } as never),
  );

  expect(loadAnyCaseManifestSpy).toHaveBeenCalledWith("hollow-bishop", {
    expectedRevision: playerCase.caseRevision,
  });
});

test("uses the first repeated evidence query value when the case page receives an array", async () => {
  const db = await getDb();
  const userId = randomUUID();

  await db.insert(users).values({
    id: userId,
    email: "array-agent@example.com",
    passwordHash: "hashed-password",
    alias: "Agent Array",
  });

  getServerSessionMock.mockResolvedValue({
    user: {
      id: userId,
    },
  });
  cookiesMock.mockResolvedValue({
    get: () => undefined,
  });

  render(
    await CasePage({
      params: Promise.resolve({ caseSlug: "red-harbor" }),
      searchParams: Promise.resolve({
        evidence: ["night-watch-thread", "dispatch-log"],
      }),
    } as never),
  );

  expect(
    screen.queryByText(/active evidence:/i),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("dialog", { name: /night watch exchange/i }),
  ).toBeInTheDocument();
});

test("objective responses require explicit choices before submission", async () => {
  const db = await getDb();
  const userId = randomUUID();

  await db.insert(users).values({
    id: userId,
    email: "objective-required-agent@example.com",
    passwordHash: "hashed-password",
    alias: "Agent Objective Required",
  });

  getServerSessionMock.mockResolvedValue({
    user: {
      id: userId,
    },
  });
  cookiesMock.mockResolvedValue({
    get: () => undefined,
  });

  render(
    await CasePage({
      params: Promise.resolve({ caseSlug: "red-harbor" }),
      searchParams: Promise.resolve({ evidence: "dispatch-log" }),
    } as never),
  );

  expect(screen.getByLabelText("Response")).toBeRequired();
});

test("renders document markdown, record tables, and photo evidence in the workspace", async () => {
  const db = await getDb();
  const userId = randomUUID();

  await db.insert(users).values({
    id: userId,
    email: "record-agent@example.com",
    passwordHash: "hashed-password",
    alias: "Agent Record",
  });

  getServerSessionMock.mockResolvedValue({
    user: {
      id: userId,
    },
  });
  cookiesMock.mockResolvedValue({
    get: () => undefined,
  });

  render(
    await CasePage({
      params: Promise.resolve({ caseSlug: "red-harbor" }),
      searchParams: Promise.resolve({ evidence: "dispatch-log" }),
    } as never),
  );

  expect(screen.getByRole("columnheader", { name: /timestamp/i })).toBeInTheDocument();
  expect(screen.getByRole("columnheader", { name: /transmitter/i })).toBeInTheDocument();

  cleanup();

  render(
    await CasePage({
      params: Promise.resolve({ caseSlug: "briar-ledger" }),
      searchParams: Promise.resolve({ evidence: "coded-ledger" }),
    } as never),
  );

  expect(screen.getAllByRole("heading", { name: /coded ledger copy/i }).length).toBeGreaterThan(1);

  cleanup();

  render(
    await CasePage({
      params: Promise.resolve({ caseSlug: "hollow-bishop" }),
      searchParams: Promise.resolve({ evidence: "vestry-scene-photo" }),
    } as never),
  );

  expect(
    screen.getByRole("heading", { name: /field notes/i, hidden: true }),
  ).toBeInTheDocument();
  expect(screen.getByText(/parish evidence locker/i)).toBeInTheDocument();
  expect(screen.getByText(/date:\s*unknown/i)).toBeInTheDocument();
});

test("does not render the progress restored banner when reopening a case with saved notes", async () => {
  const db = await getDb();
  const userId = randomUUID();

  await db.insert(users).values({
    id: userId,
    email: "continuity-agent@example.com",
    passwordHash: "hashed-password",
    alias: "Agent Continuity",
  });

  getServerSessionMock.mockResolvedValue({
    user: {
      id: userId,
    },
  });
  cookiesMock.mockResolvedValue({
    get: () => undefined,
  });

  const { playerCase } = await openCase({
    userId,
    caseSlug: "hollow-bishop",
  });

  await saveNote({
    playerCaseId: playerCase.id,
    body: "Check the vestry ledger again.",
  });

  render(
    await CasePage({
      params: Promise.resolve({ caseSlug: "hollow-bishop" }),
    } as never),
  );

  expect(
    screen.queryByText(/ashfall restored your saved progress/i),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: /jump to evidence intake/i }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: /jump to field notes/i }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: /jump to active objectives/i }),
  ).not.toBeInTheDocument();
});

test("keeps field notes visible without showing active-evidence copy when no modal is open", async () => {
  const db = await getDb();
  const userId = randomUUID();

  await db.insert(users).values({
    id: userId,
    email: "remembered-workspace-agent@example.com",
    passwordHash: "hashed-password",
    alias: "Agent Remembered Workspace",
  });

  getServerSessionMock.mockResolvedValue({
    user: {
      id: userId,
    },
  });
  cookiesMock.mockResolvedValue({
    get: () => undefined,
  });

  const { playerCase } = await openCase({
    userId,
    caseSlug: "red-harbor",
  });

  await rememberViewedEvidence({
    playerCaseId: playerCase.id,
    evidenceId: "night-watch-thread",
  });

  render(
    await CasePage({
      params: Promise.resolve({ caseSlug: "red-harbor" }),
    } as never),
  );

  expect(screen.getByRole("heading", { name: /field notes/i })).toBeInTheDocument();
  expect(
    screen.queryByText(/active evidence:/i),
  ).not.toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("falls back to the first visible evidence without silently repairing stale remembered evidence ids", async () => {
  const db = await getDb();
  const userId = randomUUID();

  await db.insert(users).values({
    id: userId,
    email: "stale-evidence-agent@example.com",
    passwordHash: "hashed-password",
    alias: "Agent Stale Evidence",
  });

  getServerSessionMock.mockResolvedValue({
    user: {
      id: userId,
    },
  });
  cookiesMock.mockResolvedValue({
    get: () => undefined,
  });

  const { playerCase } = await openCase({
    userId,
    caseSlug: "red-harbor",
  });

  await db
    .update(playerCases)
    .set({
      lastViewedEvidenceId: "missing-evidence",
      lastViewedEvidenceAt: new Date("2026-03-14T00:00:00.000Z"),
    })
    .where(eq(playerCases.id, playerCase.id));

  render(
    await CasePage({
      params: Promise.resolve({ caseSlug: "red-harbor" }),
    } as never),
  );

  const refreshedPlayerCase = await db.query.playerCases.findFirst({
    where: eq(playerCases.id, playerCase.id),
  });

  expect(screen.getByRole("heading", { name: /field notes/i })).toBeInTheDocument();
  expect(
    screen.queryByText(/active evidence:/i),
  ).not.toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(refreshedPlayerCase?.lastViewedEvidenceId).toBe("missing-evidence");
});

test("renders staged objectives with gated evidence and objective continuity links", async () => {
  const db = await getDb();
  const userId = randomUUID();

  await db.insert(users).values({
    id: userId,
    email: "staged-agent@example.com",
    passwordHash: "hashed-password",
    alias: "Agent Staged",
  });

  const stagedManifest: LoadedStagedCaseManifest = {
    slug: "hollow-bishop",
    revision: "rev-1",
    title: "Hollow Bishop / Staged",
    summary: "A staged progression test case.",
    complexity: "standard",
    evidence: [
      {
        id: "ledger-brief",
        title: "Ledger Brief",
        family: "document",
        subtype: "financial_ledger",
        summary: "Opening ledger summary.",
        source: "evidence/ledger-brief.md",
        body: "Opening ledger body",
        meta: {},
      },
      {
        id: "harbor-transfer",
        title: "Harbor Transfer Record",
        family: "document",
        subtype: "legal_doc",
        summary: "Transfer details for follow-up stage.",
        source: "evidence/harbor-transfer.md",
        body: "Transfer record body",
        meta: {},
      },
      {
        id: "sealed-archive",
        title: "Sealed Archive Memorandum",
        family: "document",
        subtype: "legal_doc",
        summary: "Should remain hidden while locked.",
        source: "evidence/sealed-archive.md",
        body: "Sealed archive body",
        meta: {},
      },
    ],
    stages: [
      {
        id: "briefing",
        startsUnlocked: true,
        title: "Briefing",
        summary: "Start here.",
        handlerPrompts: ["Start with the ledger brief."],
        evidenceIds: ["ledger-brief"],
        objectives: [
          {
            id: "identify-ledger-suspect",
            prompt: "Who altered the opening ledger?",
            type: "single_choice",
            stakes: "graded",
            options: [
              { id: "dockmaster", label: "Dockmaster Vale" },
              { id: "harbormaster", label: "Harbormaster Flint" },
            ],
            successUnlocks: {
              stageIds: ["pursuit"],
              resolvesCase: false,
            },
          },
        ],
      },
      {
        id: "pursuit",
        startsUnlocked: false,
        title: "Pursuit",
        summary: "Continue the case.",
        handlerPrompts: ["Review the transfer record."],
        evidenceIds: ["harbor-transfer"],
        objectives: [
          {
            id: "choose-transfer-signer",
            prompt: "Who signed the transfer order?",
            type: "single_choice",
            stakes: "graded",
            options: [
              { id: "captain", label: "Captain Dorr" },
              { id: "steward", label: "Steward Ives" },
            ],
            successUnlocks: {
              stageIds: [],
              resolvesCase: false,
            },
          },
        ],
      },
      {
        id: "sealed",
        startsUnlocked: false,
        title: "Sealed",
        summary: "Hidden evidence stage.",
        handlerPrompts: ["Open only after further proof."],
        evidenceIds: ["sealed-archive"],
        objectives: [
          {
            id: "confirm-seal",
            prompt: "Enter the seal code.",
            type: "code_entry",
            stakes: "graded",
            successUnlocks: {
              stageIds: [],
              resolvesCase: true,
            },
          },
        ],
      },
    ],
  };

  vi.spyOn(caseManifestLoader, "loadAnyCaseManifest").mockResolvedValue(
    stagedManifest,
  );

  getServerSessionMock.mockResolvedValue({
    user: {
      id: userId,
    },
  });
  cookiesMock.mockResolvedValue({
    get: () => undefined,
  });

  const { playerCase } = await openCase({
    userId,
    caseSlug: "hollow-bishop",
  });

  await db
    .update(playerCaseObjectives)
    .set({
      status: "solved",
      solvedAt: new Date("2026-03-14T13:00:00.000Z"),
      draftPayload: null,
      updatedAt: new Date("2026-03-14T13:00:00.000Z"),
    })
    .where(
      and(
        eq(playerCaseObjectives.playerCaseId, playerCase.id),
        eq(playerCaseObjectives.objectiveId, "identify-ledger-suspect"),
      ),
    );

  await db
    .update(playerCaseObjectives)
    .set({
      status: "active",
      draftPayload: {
        type: "single_choice",
        choiceId: "captain",
      },
      updatedAt: new Date("2026-03-14T13:05:00.000Z"),
    })
    .where(
      and(
        eq(playerCaseObjectives.playerCaseId, playerCase.id),
        eq(playerCaseObjectives.objectiveId, "choose-transfer-signer"),
      ),
    );

  await db.insert(objectiveSubmissions).values({
    id: randomUUID(),
    playerCaseId: playerCase.id,
    objectiveId: "identify-ledger-suspect",
    submissionToken: `submission-${randomUUID()}`,
    answerPayload: {
      type: "single_choice",
      choiceId: "dockmaster",
    },
    isCorrect: true,
    feedback: "Objective solved.",
    nextStatus: "in_progress",
    attemptNumber: 1,
  });
  await db.insert(objectiveSubmissions).values({
    id: randomUUID(),
    playerCaseId: playerCase.id,
    objectiveId: "choose-transfer-signer",
    submissionToken: `submission-${randomUUID()}`,
    answerPayload: {
      type: "single_choice",
      choiceId: "captain",
    },
    isCorrect: false,
    feedback: "Incorrect graded objective submission.",
    nextStatus: "in_progress",
    attemptNumber: 1,
  });

  render(
    await CasePage({
      params: Promise.resolve({ caseSlug: "hollow-bishop" }),
    } as never),
  );

  expect(
    screen.getByRole("heading", { name: /active objectives/i }),
  ).toBeInTheDocument();
  const stagedHeaderSection = screen
    .getByRole("heading", { name: /hollow bishop \/ staged/i })
    .closest("section");
  expect(stagedHeaderSection).not.toBeNull();
  expect(
    within(stagedHeaderSection as HTMLElement).getByText(/stage 2 of 3/i),
  ).toBeInTheDocument();
  expect(
    within(stagedHeaderSection as HTMLElement).getByText(/pursuit/i),
  ).toBeInTheDocument();
  expect(
    screen.getAllByText(/who signed the transfer order/i).length,
  ).toBeGreaterThan(0);
  expect(
    screen.queryByText(/sealed archive memorandum/i),
  ).not.toBeInTheDocument();
  const ledgerArticle = screen
    .getByRole("heading", { name: /ledger brief/i })
    .closest("article");
  const transferArticle = screen
    .getByRole("heading", { name: /harbor transfer record/i })
    .closest("article");
  expect(ledgerArticle).not.toBeNull();
  expect(transferArticle).not.toBeNull();
  expect(
    within(ledgerArticle as HTMLElement).queryByText("New"),
  ).not.toBeInTheDocument();
  expect(
    within(transferArticle as HTMLElement).getByText("New"),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: /completed objectives/i }),
  ).toBeInTheDocument();
  const completedSection = screen
    .getByRole("heading", { name: /completed objectives/i })
    .closest("section");
  const activeSection = screen
    .getByRole("heading", { name: /active objectives/i })
    .closest("section");
  expect(completedSection).not.toBeNull();
  expect(activeSection).not.toBeNull();
  expect(
    Boolean(
      (completedSection as HTMLElement).compareDocumentPosition(
        activeSection as HTMLElement,
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ),
  ).toBe(true);
  expect(
    within(completedSection as HTMLElement).getByText(/correct \/ attempt 1/i),
  ).toBeInTheDocument();
  expect(
    within(activeSection as HTMLElement).getByText(/incorrect \/ attempt 1/i),
  ).toBeInTheDocument();
  expect(
    within(activeSection as HTMLElement)
      .getAllByRole("button")
      .map((button) => button.textContent?.trim()),
  ).toEqual(["Submit Objective", "Save Draft"]);
  expect(
    screen.getByRole("heading", { name: /active objectives/i }).closest("section"),
  ).toHaveAttribute("id", "active-objectives");

  cleanup();

  render(
    await CasePage({
      params: Promise.resolve({ caseSlug: "hollow-bishop" }),
      searchParams: Promise.resolve({ evidence: "harbor-transfer" }),
    } as never),
  );

  cleanup();

  render(
    await CasePage({
      params: Promise.resolve({ caseSlug: "hollow-bishop" }),
    } as never),
  );

  const revisitedTransferArticle = screen
    .getByRole("heading", { name: /harbor transfer record/i })
    .closest("article");
  expect(revisitedTransferArticle).not.toBeNull();
  expect(
    within(revisitedTransferArticle as HTMLElement).queryByText("New"),
  ).not.toBeInTheDocument();
});
