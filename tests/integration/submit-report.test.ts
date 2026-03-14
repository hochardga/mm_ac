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
  expect(debrief.status).toBe("completed");
  expect(debrief.finalReport).toEqual({
    suspect: "Bookkeeper Mara Quinn",
    motive: "Embezzlement cover-up",
    method: "Poisoned sacramental wine",
    attemptNumber: 1,
  });
  expect(debrief.solution).toEqual({
    suspect: "Bookkeeper Mara Quinn",
    motive: "Embezzlement cover-up",
    method: "Poisoned sacramental wine",
  });
  expect(debrief.attempts).toEqual([
    {
      attemptNumber: 1,
      nextStatus: "completed",
      suspect: "Bookkeeper Mara Quinn",
      motive: "Embezzlement cover-up",
      method: "Poisoned sacramental wine",
      feedback: "Your report is accepted. The director is authorizing a full debrief.",
    },
  ]);
});

test("keeps the player's final theory alongside the solution after a terminal miss", async () => {
  const db = await getDb();
  const userId = randomUUID();

  await db.insert(users).values({
    id: userId,
    email: "unsolved-agent@example.com",
    passwordHash: "hashed-password",
    alias: "Agent Harbor",
  });

  const { playerCase } = await openCase({
    userId,
    caseSlug: "red-harbor",
  });

  await submitReport({
    playerCaseId: playerCase.id,
    submissionToken: "token-1",
    answers: {
      suspectId: "captain",
      motiveId: "insurance",
      methodId: "drowned",
    },
  });
  await submitReport({
    playerCaseId: playerCase.id,
    submissionToken: "token-2",
    answers: {
      suspectId: "captain",
      motiveId: "insurance",
      methodId: "drowned",
    },
  });
  await submitReport({
    playerCaseId: playerCase.id,
    submissionToken: "token-3",
    answers: {
      suspectId: "captain",
      motiveId: "insurance",
      methodId: "drowned",
    },
  });

  const debrief = await getDebrief({
    playerCaseId: playerCase.id,
  });

  expect(debrief.status).toBe("closed_unsolved");
  expect(debrief.finalReport).toEqual({
    suspect: "Captain Lena Morrow",
    motive: "Insurance fraud",
    method: "Forced overboard drowning",
    attemptNumber: 3,
  });
  expect(debrief.solution).toEqual({
    suspect: "Radio Chief Soren Pike",
    motive: "Smuggling protection",
    method: "Electrocution in the signal room",
  });
  expect(debrief.attempts).toHaveLength(3);
  expect(debrief.attempts.map((attempt) => attempt.nextStatus)).toEqual([
    "in_progress",
    "in_progress",
    "closed_unsolved",
  ]);
  expect(debrief.attempts[2]).toEqual({
    attemptNumber: 3,
    nextStatus: "closed_unsolved",
    suspect: "Captain Lena Morrow",
    motive: "Insurance fraud",
    method: "Forced overboard drowning",
    feedback: "Red Harbor is closed without a prosecutable case.",
  });
});
