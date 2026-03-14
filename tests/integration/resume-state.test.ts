import { randomUUID } from "node:crypto";

import { users } from "@/db/schema";
import { openCase } from "@/features/cases/open-case";
import { saveObjectiveDraft } from "@/features/drafts/save-objective-draft";
import { saveNote } from "@/features/notes/save-note";
import { submitObjective } from "@/features/submissions/submit-objective";
import { closeDb, getDb } from "@/lib/db";

afterEach(async () => {
  await closeDb();
});

test("returns the latest objective context when reopening an in-progress case", async () => {
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
  await saveObjectiveDraft({
    playerCaseId: playerCase.id,
    objectiveId: "chalice-relevance",
    payload: {
      type: "boolean",
      value: false,
    },
  });

  const reopened = await openCase({
    userId,
    caseSlug: "hollow-bishop",
  });

  expect(reopened.resumeTarget.section).toBe("objectives");
  expect(reopened.resumeTarget.noteBody).toContain("ledger");
});

test("keeps objective feedback in the continuity description when reopening after an incorrect submission", async () => {
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
  await submitObjective({
    playerCaseId: playerCase.id,
    objectiveId: "chalice-relevance",
    submissionToken: `feedback-${playerCase.id}`,
    payload: {
      type: "boolean",
      value: true,
    },
  });

  const reopened = await openCase({
    userId,
    caseSlug: "hollow-bishop",
  });

  expect(reopened.resumeTarget.section).toBe("objectives");
  expect(reopened.resumeTarget.description).toMatch(/objective feedback/i);
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

  await submitObjective({
    playerCaseId: playerCase.id,
    objectiveId: "chalice-relevance",
    submissionToken: `solved-${playerCase.id}-1`,
    payload: {
      type: "boolean",
      value: false,
    },
  });
  await submitObjective({
    playerCaseId: playerCase.id,
    objectiveId: "identify-poisoner",
    submissionToken: `solved-${playerCase.id}-2`,
    payload: {
      type: "single_choice",
      choiceId: "bookkeeper",
    },
  });

  const reopened = await openCase({
    userId,
    caseSlug: "hollow-bishop",
  });

  expect(reopened.resumeTarget.section).toBe("debrief");
  expect(reopened.resumeTarget.href).toBe("/cases/hollow-bishop/debrief");
});
