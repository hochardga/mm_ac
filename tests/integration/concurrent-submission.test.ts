import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import { playerCases, reportSubmissions, users } from "@/db/schema";
import { openCase } from "@/features/cases/open-case";
import { submitReport } from "@/features/submissions/submit-report";
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
    caseSlug: "hollow-bishop",
  });

  const wrongAnswers = {
    suspectId: "groundskeeper",
    motiveId: "blackmail",
    methodId: "candlestick",
  };

  await submitReport({
    playerCaseId: playerCase.id,
    submissionToken: "tok-1",
    answers: wrongAnswers,
  });
  await submitReport({
    playerCaseId: playerCase.id,
    submissionToken: "tok-2",
    answers: wrongAnswers,
  });

  const results = await Promise.allSettled([
    submitReport({
      playerCaseId: playerCase.id,
      submissionToken: "tok-3a",
      answers: wrongAnswers,
    }),
    submitReport({
      playerCaseId: playerCase.id,
      submissionToken: "tok-3b",
      answers: wrongAnswers,
    }),
  ]);

  const submissions = await db.select().from(reportSubmissions);
  const [savedPlayerCase] = await db
    .select()
    .from(playerCases)
    .where(eq(playerCases.id, playerCase.id));

  expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
  expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
  expect(submissions).toHaveLength(3);
  expect(savedPlayerCase?.status).toBe("closed_unsolved");
});
