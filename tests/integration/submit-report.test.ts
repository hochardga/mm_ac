import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import { playerCases, reportSubmissions, users } from "@/db/schema";
import { getDebrief } from "@/features/debrief/get-debrief";
import { openCase } from "@/features/cases/open-case";
import { submitReport } from "@/features/submissions/submit-report";
import { closeDb, getDb } from "@/lib/db";

afterEach(async () => {
  await closeDb();
});

test("stores a solved submission once and exposes a stable debrief snapshot", async () => {
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

  const first = await submitReport({
    playerCaseId: playerCase.id,
    submissionToken: "token-1",
    answers: {
      suspectId: "bookkeeper",
      motiveId: "embezzlement",
      methodId: "poisoned-wine",
    },
  });
  const second = await submitReport({
    playerCaseId: playerCase.id,
    submissionToken: "token-1",
    answers: {
      suspectId: "bookkeeper",
      motiveId: "embezzlement",
      methodId: "poisoned-wine",
    },
  });

  const [savedPlayerCase] = await db
    .select()
    .from(playerCases)
    .where(eq(playerCases.id, playerCase.id));
  const savedSubmissions = await db.select().from(reportSubmissions);
  const debrief = await getDebrief({
    playerCaseId: playerCase.id,
  });

  expect(first.attemptNumber).toBe(1);
  expect(second.attemptNumber).toBe(1);
  expect(first.nextStatus).toBe("completed");
  expect(savedPlayerCase?.status).toBe("completed");
  expect(savedPlayerCase?.terminalDebriefTitle).toBe("Debrief: The Hollow Bishop");
  expect(savedSubmissions).toHaveLength(1);
  expect(debrief.title).toBe("Debrief: The Hollow Bishop");
});
