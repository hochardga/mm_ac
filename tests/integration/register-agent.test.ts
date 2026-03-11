import { randomUUID } from "node:crypto";

import { caseDefinitions } from "@/db/schema";
import { closeDb, getDb } from "@/lib/db";
import { registerAgent } from "@/features/auth/register-agent";

afterEach(async () => {
  await closeDb();
});

test("creates a new user and returns the vault redirect", async () => {
  const db = await getDb();

  await db.insert(caseDefinitions).values({
    id: randomUUID(),
    slug: "hollow-bishop",
    title: "The Hollow Bishop",
    currentPublishedRevision: "rev-1",
  });

  const result = await registerAgent({
    email: "agent@example.com",
    password: "CaseFile123!",
    alias: "Agent Ash",
  });

  expect(result.redirectTo).toBe("/vault");
});
