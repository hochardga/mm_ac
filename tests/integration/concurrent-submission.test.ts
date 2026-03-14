import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import { objectiveSubmissions, playerCases, users } from "@/db/schema";
import { openCase } from "@/features/cases/open-case";
import { submitObjective } from "@/features/submissions/submit-objective";
import { closeDb, getDb } from "@/lib/db";

afterEach(async () => {
  await closeDb();
});

test("does not consume an extra attempt when a terminal transition is racing", async () => {
  const db = await getDb();
  const userId = randomUUID();

  await db.insert(users).values({
    id: userId,
    email: "agent@example.com",
    passwordHash: "hashed-password",
    alias: "Agent Ash",
  });

  const { playerCase } = await openCase({
    userId,
    caseSlug: "red-harbor",
  });

  const wrongPayload = {
    type: "single_choice" as const,
    choiceId: "captain",
  };

  await submitObjective({
    playerCaseId: playerCase.id,
    objectiveId: "identify-saboteur",
    submissionToken: "tok-1",
    payload: wrongPayload,
  });
  await submitObjective({
    playerCaseId: playerCase.id,
    objectiveId: "identify-saboteur",
    submissionToken: "tok-2",
    payload: wrongPayload,
  });

  const results = await Promise.allSettled([
    submitObjective({
      playerCaseId: playerCase.id,
      objectiveId: "identify-saboteur",
      submissionToken: "tok-3a",
      payload: wrongPayload,
    }),
    submitObjective({
      playerCaseId: playerCase.id,
      objectiveId: "identify-saboteur",
      submissionToken: "tok-3b",
      payload: wrongPayload,
    }),
  ]);

  const submissions = await db.select().from(objectiveSubmissions);
  const [savedPlayerCase] = await db
    .select()
    .from(playerCases)
    .where(eq(playerCases.id, playerCase.id));

  expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
  expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
  expect(submissions).toHaveLength(3);
  expect(savedPlayerCase?.status).toBe("closed_unsolved");
});
