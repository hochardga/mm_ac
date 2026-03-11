import { randomUUID } from "node:crypto";

import { render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

const { cookiesMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

import VaultPage from "@/app/(app)/vault/page";
import { caseDefinitions, playerCases, users } from "@/db/schema";
import { closeDb, getDb } from "@/lib/db";

afterEach(async () => {
  cookiesMock.mockReset();
  await closeDb();
});

test("renders dossier cards with the current agent's case statuses", async () => {
  const db = await getDb();
  const agentId = randomUUID();
  const hollowBishopId = randomUUID();
  const redHarborId = randomUUID();
  const briarLedgerId = randomUUID();

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
});
