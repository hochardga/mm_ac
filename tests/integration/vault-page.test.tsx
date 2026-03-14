import { randomUUID } from "node:crypto";

import { render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

const { cookiesMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
}));
const { getServerSessionMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

import VaultPage from "@/app/(shell)/vault/page";
import {
  caseDefinitions,
  notes,
  playerCaseObjectives,
  playerCases,
  users,
} from "@/db/schema";
import { closeDb, getDb } from "@/lib/db";

afterEach(async () => {
  cookiesMock.mockReset();
  getServerSessionMock.mockReset();
  await closeDb();
});

test("renders dossier cards with the current agent's case statuses", async () => {
  const db = await getDb();
  const agentId = randomUUID();
  const hollowBishopId = randomUUID();
  const redHarborId = randomUUID();
  const briarLedgerId = randomUUID();

  getServerSessionMock.mockResolvedValue(null);
  cookiesMock.mockResolvedValue({
    get: (name: string) =>
      name === "ashfall-agent-id" ? { value: agentId } : undefined,
  });

  await db.insert(users).values({
    id: agentId,
    email: "agent@example.com",
    passwordHash: "hashed-password",
    alias: "Agent Ash",
  });

  await db.insert(caseDefinitions).values([
    {
      id: hollowBishopId,
      slug: "hollow-bishop",
      title: "The Hollow Bishop",
      currentPublishedRevision: "rev-1",
    },
    {
      id: redHarborId,
      slug: "red-harbor",
      title: "Signal at Red Harbor",
      currentPublishedRevision: "rev-1",
    },
    {
      id: briarLedgerId,
      slug: "briar-ledger",
      title: "The Briar Ledger",
      currentPublishedRevision: "rev-1",
    },
  ]);

  await db.insert(playerCases).values({
    id: randomUUID(),
    userId: agentId,
    caseDefinitionId: redHarborId,
    caseRevision: "rev-1",
    status: "in_progress",
  });

  render(await VaultPage());

  expect(
    screen.getByRole("heading", { name: /dossier vault/i }),
  ).toBeInTheDocument();
  expect(screen.getByText("The Hollow Bishop")).toBeInTheDocument();
  expect(screen.getByText("Signal at Red Harbor")).toBeInTheDocument();
  expect(screen.getByText("The Briar Ledger")).toBeInTheDocument();
  expect(screen.getByText("In Progress")).toBeInTheDocument();
  expect(screen.getAllByText("New")).toHaveLength(2);
  expect(screen.getByText("Light")).toBeInTheDocument();
  expect(screen.getByText("Standard")).toBeInTheDocument();
  expect(screen.getByText("Deep")).toBeInTheDocument();
  expect(screen.queryByText(/90 min/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/80 min/i)).not.toBeInTheDocument();
});

test("renders continuity-aware vault actions for objectives, notes, and terminal cases", async () => {
  const db = await getDb();
  const agentId = randomUUID();
  const hollowBishopId = randomUUID();
  const redHarborId = randomUUID();
  const briarLedgerId = randomUUID();
  const hollowBishopPlayerCaseId = randomUUID();
  const redHarborPlayerCaseId = randomUUID();
  const briarLedgerPlayerCaseId = randomUUID();

  getServerSessionMock.mockResolvedValue(null);
  cookiesMock.mockResolvedValue({
    get: (name: string) =>
      name === "ashfall-agent-id" ? { value: agentId } : undefined,
  });

  await db.insert(users).values({
    id: agentId,
    email: "continuity-agent@example.com",
    passwordHash: "hashed-password",
    alias: "Agent Continuity",
  });

  await db.insert(caseDefinitions).values([
    {
      id: hollowBishopId,
      slug: "hollow-bishop",
      title: "The Hollow Bishop",
      currentPublishedRevision: "rev-1",
    },
    {
      id: redHarborId,
      slug: "red-harbor",
      title: "Signal at Red Harbor",
      currentPublishedRevision: "rev-1",
    },
    {
      id: briarLedgerId,
      slug: "briar-ledger",
      title: "The Briar Ledger",
      currentPublishedRevision: "rev-1",
    },
  ]);

  await db.insert(playerCases).values([
    {
      id: hollowBishopPlayerCaseId,
      userId: agentId,
      caseDefinitionId: hollowBishopId,
      caseRevision: "rev-1",
      status: "in_progress",
      lastViewedEvidenceId: "vestry-interview",
      lastViewedEvidenceAt: new Date("2026-03-14T01:00:00.000Z"),
    },
    {
      id: redHarborPlayerCaseId,
      userId: agentId,
      caseDefinitionId: redHarborId,
      caseRevision: "rev-1",
      status: "in_progress",
      lastViewedEvidenceId: "dispatch-log",
      lastViewedEvidenceAt: new Date("2026-03-14T01:30:00.000Z"),
    },
    {
      id: briarLedgerPlayerCaseId,
      userId: agentId,
      caseDefinitionId: briarLedgerId,
      caseRevision: "rev-1",
      status: "completed",
    },
  ]);

  await db.insert(playerCaseObjectives).values({
    id: randomUUID(),
    playerCaseId: hollowBishopPlayerCaseId,
    stageId: "ledger-review",
    objectiveId: "chalice-relevance",
    status: "active",
    draftPayload: {
      type: "boolean",
      value: false,
    },
  });

  await db.insert(notes).values({
    id: randomUUID(),
    playerCaseId: redHarborPlayerCaseId,
    body: "Recheck the harbor log.",
  });

  render(await VaultPage());

  const draftCard = screen
    .getByRole("heading", { name: /the hollow bishop/i })
    .closest("article");
  const notesCard = screen
    .getByRole("heading", { name: /signal at red harbor/i })
    .closest("article");
  const completedCard = screen
    .getByRole("heading", { name: /the briar ledger/i })
    .closest("article");

  expect(draftCard).not.toBeNull();
  expect(notesCard).not.toBeNull();
  expect(completedCard).not.toBeNull();

  expect(
    within(draftCard as HTMLElement).getByRole("link", {
      name: /resume objectives/i,
    }),
  ).toHaveAttribute(
    "href",
    "/cases/hollow-bishop?evidence=vestry-interview#active-objectives",
  );
  expect(
    within(draftCard as HTMLElement).getByText(/stage 1 of 2/i),
  ).toBeInTheDocument();
  expect(
    within(draftCard as HTMLElement).getByText(/ledger review/i),
  ).toBeInTheDocument();
  expect(
    within(draftCard as HTMLElement).getByText(
      /was the silver chalice actually the murder weapon/i,
    ),
  ).toBeInTheDocument();

  expect(
    within(notesCard as HTMLElement).getByRole("link", {
      name: /resume notes/i,
    }),
  ).toHaveAttribute(
    "href",
    "/cases/red-harbor?evidence=dispatch-log#field-notes",
  );

  expect(
    within(completedCard as HTMLElement).getByRole("link", {
      name: /review debrief/i,
    }),
  ).toHaveAttribute("href", "/cases/briar-ledger/debrief");
});
