import { randomUUID } from "node:crypto";

import { render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

const { cookiesMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
}));
const { getServerSessionMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
}));
const { redirectMock, notFoundMock } = vi.hoisted(() => ({
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
}));

import CasePage from "@/app/(app)/cases/[caseSlug]/page";
import DebriefPage from "@/app/(app)/cases/[caseSlug]/debrief/page";
import { caseDefinitions, playerCases, users } from "@/db/schema";
import { closeDb, getDb } from "@/lib/db";

afterEach(async () => {
  cookiesMock.mockReset();
  getServerSessionMock.mockReset();
  redirectMock.mockClear();
  notFoundMock.mockClear();
  await closeDb();
});

function setAuthenticatedSession(userId: string) {
  getServerSessionMock.mockResolvedValue({ user: { id: userId } });
  cookiesMock.mockResolvedValue({
    get: () => undefined,
  });
}

function setAuthenticatedSessionWithCookie(
  sessionUserId: string,
  cookieUserId?: string,
) {
  getServerSessionMock.mockResolvedValue({ user: { id: sessionUserId } });
  cookiesMock.mockResolvedValue({
    get: (name: string) =>
      name === "ashfall-agent-id" && cookieUserId
        ? { value: cookieUserId }
        : undefined,
  });
}

function setUnauthenticatedSession() {
  getServerSessionMock.mockResolvedValue(null);
  cookiesMock.mockResolvedValue({
    get: () => undefined,
  });
}

async function seedUser(userId: string) {
  const db = await getDb();
  await db.insert(users).values({
    id: userId,
    email: `agent-${userId}@example.com`,
    passwordHash: "hashed-password",
    alias: "Agent Ash",
  });
}

test("authenticated case render shows Back to Vault link to /vault", async () => {
  const agentId = randomUUID();
  await seedUser(agentId);
  setAuthenticatedSession(agentId);

  render(
    await CasePage({
      params: Promise.resolve({ caseSlug: "hollow-bishop" }),
    }),
  );

  expect(screen.getByRole("link", { name: /back to vault/i })).toHaveAttribute(
    "href",
    "/vault",
  );
});

test("authenticated case render has exactly one level-1 heading", async () => {
  const agentId = randomUUID();
  await seedUser(agentId);
  setAuthenticatedSession(agentId);

  render(
    await CasePage({
      params: Promise.resolve({ caseSlug: "hollow-bishop" }),
    }),
  );

  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
});

test("case route falls back to a valid intake cookie when the session identity is stale", async () => {
  const cookieAgentId = randomUUID();
  await seedUser(cookieAgentId);
  setAuthenticatedSessionWithCookie(randomUUID(), cookieAgentId);

  render(
    await CasePage({
      params: Promise.resolve({ caseSlug: "hollow-bishop" }),
    }),
  );

  expect(screen.getByRole("link", { name: /back to vault/i })).toHaveAttribute(
    "href",
    "/vault",
  );
});

test("case route redirects to /apply when no stored agent identity can be resolved", async () => {
  setAuthenticatedSessionWithCookie(randomUUID());

  await expect(
    CasePage({
      params: Promise.resolve({ caseSlug: "hollow-bishop" }),
    }),
  ).rejects.toThrow("NEXT_REDIRECT:/apply");
  expect(redirectMock).toHaveBeenCalledWith("/apply");
});

test("debrief route gets the same navigation treatment for authenticated agents", async () => {
  const db = await getDb();
  const agentId = randomUUID();
  const caseDefinitionId = randomUUID();
  const playerCaseId = randomUUID();
  setAuthenticatedSession(agentId);

  await db.insert(users).values({
    id: agentId,
    email: `agent-${agentId}@example.com`,
    passwordHash: "hashed-password",
    alias: "Agent Ember",
  });

  await db.insert(caseDefinitions).values({
    id: caseDefinitionId,
    slug: "hollow-bishop",
    title: "The Hollow Bishop",
    currentPublishedRevision: "rev-1",
  });

  await db.insert(playerCases).values({
    id: playerCaseId,
    userId: agentId,
    caseDefinitionId,
    caseRevision: "rev-1",
    status: "completed",
    terminalDebriefTitle: "Debrief: The Hollow Bishop",
    terminalDebriefSummary: "You closed the case with a complete evidence chain.",
  });

  render(
    await DebriefPage({
      params: Promise.resolve({ caseSlug: "hollow-bishop" }),
    }),
  );

  expect(screen.getByRole("link", { name: /back to vault/i })).toHaveAttribute(
    "href",
    "/vault",
  );
  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
});

test("unauthenticated CasePage still redirects to /apply", async () => {
  setUnauthenticatedSession();

  await expect(
    CasePage({
      params: Promise.resolve({ caseSlug: "hollow-bishop" }),
    }),
  ).rejects.toThrow("NEXT_REDIRECT:/apply");
  expect(redirectMock).toHaveBeenCalledWith("/apply");
});

test("DebriefPage without playerCase keeps notFound semantics", async () => {
  const db = await getDb();
  const agentId = randomUUID();
  setAuthenticatedSession(agentId);

  await db.insert(users).values({
    id: agentId,
    email: `agent-${agentId}@example.com`,
    passwordHash: "hashed-password",
    alias: "Agent Night",
  });

  await db.insert(caseDefinitions).values({
    id: randomUUID(),
    slug: "hollow-bishop",
    title: "The Hollow Bishop",
    currentPublishedRevision: "rev-1",
  });

  await expect(
    DebriefPage({
      params: Promise.resolve({ caseSlug: "hollow-bishop" }),
    }),
  ).rejects.toThrow("NEXT_NOT_FOUND");
  expect(notFoundMock).toHaveBeenCalledTimes(1);
});
