import { randomUUID } from "node:crypto";

import { objectiveSubmissions, users } from "@/db/schema";
import { openCase } from "@/features/cases/open-case";
import { submitObjective } from "@/features/submissions/submit-objective";
import { closeDb, getDb } from "@/lib/db";

afterEach(async () => {
  await closeDb();
});

test("reuses the same submission token without consuming a second attempt", async () => {
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

  const payload = {
    type: "single_choice" as const,
    choiceId: "captain",
  };
  const first = await submitObjective({
    playerCaseId: playerCase.id,
    objectiveId: "identify-saboteur",
    submissionToken: "tok-1",
    payload,
  });
  const second = await submitObjective({
    playerCaseId: playerCase.id,
    objectiveId: "identify-saboteur",
    submissionToken: "tok-1",
    payload,
  });

  await expect(
    submitObjective({
      playerCaseId: playerCase.id,
      objectiveId: "identify-saboteur",
      submissionToken: "tok-1",
      payload: {
        type: "single_choice",
        choiceId: "radio-chief",
      },
    }),
  ).rejects.toThrow(/different payload/i);

  const submissions = await db.select().from(objectiveSubmissions);

  expect(second.attemptNumber).toBe(first.attemptNumber);
  expect(submissions).toHaveLength(1);
});
