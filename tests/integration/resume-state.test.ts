import { randomUUID } from "node:crypto";

import { users } from "@/db/schema";
import { openCase } from "@/features/cases/open-case";
import { saveReportDraft } from "@/features/drafts/save-report-draft";
import { saveNote } from "@/features/notes/save-note";
import { submitReport } from "@/features/submissions/submit-report";
import { closeDb, getDb } from "@/lib/db";

afterEach(async () => {
  await closeDb();
});

test("returns the latest report context when reopening an in-progress case", async () => {
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

  await saveNote({
    playerCaseId: playerCase.id,
    body: "Double-check the church ledger.",
  });
  await saveReportDraft({
    playerCaseId: playerCase.id,
    suspectId: "bookkeeper",
    motiveId: "embezzlement",
    methodId: "poisoned-wine",
  });

  const reopened = await openCase({
    userId,
    caseSlug: "hollow-bishop",
  });

  expect(reopened.resumeTarget.section).toBe("report");
  expect(reopened.resumeTarget.draft?.suspectId).toBe("bookkeeper");
  expect(reopened.resumeTarget.noteBody).toContain("ledger");
});

test("keeps handler feedback in the continuity description when reopening after an incorrect report", async () => {
  const db = await getDb();
  const userId = randomUUID();

  await db.insert(users).values({
    id: userId,
    email: "feedback-agent@example.com",
    passwordHash: "hashed-password",
    alias: "Agent Feedback",
  });

  const { playerCase } = await openCase({
    userId,
    caseSlug: "hollow-bishop",
  });
  const submissionToken = `feedback-${playerCase.id}`;

  await submitReport({
    playerCaseId: playerCase.id,
    submissionToken,
    answers: {
      suspectId: "groundskeeper",
      motiveId: "blackmail",
      methodId: "candlestick",
    },
  });

  const reopened = await openCase({
    userId,
    caseSlug: "hollow-bishop",
  });

  expect(reopened.resumeTarget.section).toBe("report");
  expect(reopened.resumeTarget.description).toMatch(/handler feedback/i);
});

test("keeps the debrief section when reopening a solved case", async () => {
  const db = await getDb();
  const userId = randomUUID();

  await db.insert(users).values({
    id: userId,
    email: "solved-agent@example.com",
    passwordHash: "hashed-password",
    alias: "Agent Solved",
  });

  const { playerCase } = await openCase({
    userId,
    caseSlug: "hollow-bishop",
  });

  await submitReport({
    playerCaseId: playerCase.id,
    submissionToken: `solved-${playerCase.id}`,
    answers: {
      suspectId: "bookkeeper",
      motiveId: "embezzlement",
      methodId: "poisoned-wine",
    },
  });

  const reopened = await openCase({
    userId,
    caseSlug: "hollow-bishop",
  });

  expect(reopened.resumeTarget.section).toBe("debrief");
  expect(reopened.resumeTarget.href).toBe("/cases/hollow-bishop/debrief");
});
