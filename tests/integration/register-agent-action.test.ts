import { randomUUID } from "node:crypto";

import { afterEach, expect, test, vi } from "vitest";

const { cookiesMock, setCookieMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  setCookieMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

import { registerAgentAction } from "@/app/(public)/apply/actions";
import { users } from "@/db/schema";
import { closeDb, getDb } from "@/lib/db";

afterEach(async () => {
  cookiesMock.mockReset();
  setCookieMock.mockReset();
  await closeDb();
});

test("returns a user-facing error when the agency email is already active", async () => {
  const db = await getDb();

  cookiesMock.mockResolvedValue({
    set: setCookieMock,
  });

  await db.insert(users).values({
    id: randomUUID(),
    email: "agent@example.com",
    passwordHash: "hashed-password",
    alias: "Existing Agent",
  });

  const formData = new FormData();
  formData.set("email", "agent@example.com");
  formData.set("password", "CaseFile123!");
  formData.set("alias", "Agent Ember");

  await expect(
    registerAgentAction({ status: "idle" }, formData),
  ).resolves.toEqual({
    status: "error",
    message: "That agency email is already active. Sign in instead.",
  });
  expect(setCookieMock).not.toHaveBeenCalled();
});
