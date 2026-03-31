import { randomUUID } from "node:crypto";

import { afterEach, expect, test, vi } from "vitest";

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
  redirect: vi.fn(),
}));

import { markIntroductionSeenAction } from "@/app/(app)/cases/[caseSlug]/actions";
import { caseDefinitions, playerCases, users } from "@/db/schema";
import { closeDb, getDb } from "@/lib/db";

afterEach(async () => {
  cookiesMock.mockReset();
  getServerSessionMock.mockReset();
  await closeDb();
});

async function seedUser(userId: string) {
  const db = await getDb();

  await db.insert(users).values({
    id: userId,
    email: `${userId}@example.com`,
    passwordHash: "hashed-password",
    alias: "Agent Intro",
  });
}

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

test("markIntroductionSeenAction writes once and is idempotent", async () => {
  const userId = randomUUID();
  const playerCaseId = await seedPlayerCase(userId);
  setAuthenticatedSession(userId);

  const formData = new FormData();
  formData.set("playerCaseId", playerCaseId);

  await markIntroductionSeenAction(formData);

  const db = await getDb();
  const updated = await db.query.playerCases.findFirst({
    where: (playerCases, { eq }) => eq(playerCases.id, playerCaseId),
  });

  expect(updated?.introductionSeenAt).toBeInstanceOf(Date);

  const firstSeenAt = updated?.introductionSeenAt?.getTime() ?? 0;

  await markIntroductionSeenAction(formData);

  const updatedAgain = await db.query.playerCases.findFirst({
    where: (playerCases, { eq }) => eq(playerCases.id, playerCaseId),
  });

  expect(updatedAgain?.introductionSeenAt?.getTime()).toBe(firstSeenAt);
});
