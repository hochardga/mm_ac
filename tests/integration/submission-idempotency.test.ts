import { randomUUID } from "node:crypto";

import { reportSubmissions, users } from "@/db/schema";
import { openCase } from "@/features/cases/open-case";
import { submitReport } from "@/features/submissions/submit-report";
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
    caseSlug: "hollow-bishop",
  });

  const payload = {
    suspectId: "groundskeeper",
    motiveId: "blackmail",
    methodId: "candlestick",
  };
  const first = await submitReport({
    playerCaseId: playerCase.id,
    submissionToken: "tok-1",
    answers: payload,
  });
  const second = await submitReport({
    playerCaseId: playerCase.id,
    submissionToken: "tok-1",
    answers: payload,
  });

  await expect(
    submitReport({
      playerCaseId: playerCase.id,
      submissionToken: "tok-1",
      answers: {
        suspectId: "bookkeeper",
        motiveId: "embezzlement",
        methodId: "poisoned-wine",
      },
    }),
  ).rejects.toThrow(/different payload/i);

  const submissions = await db.select().from(reportSubmissions);

  expect(second.attemptNumber).toBe(first.attemptNumber);
  expect(submissions).toHaveLength(1);
});
