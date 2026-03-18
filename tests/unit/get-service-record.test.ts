import { randomUUID } from "node:crypto";

import { caseDefinitions, notes, playerCases, users } from "@/db/schema";
import { closeDb, getDb } from "@/lib/db";

afterEach(async () => {
  await closeDb();
});

async function loadGetServiceRecord() {
  const mod = await import("@/features/agents/get-service-record").catch(
    () => null,
  );

  return mod?.getServiceRecord;
}

async function seedUser(alias: string) {
  const db = await getDb();
  const userId = randomUUID();

  await db.insert(users).values({
    id: userId,
    email: `${alias.toLowerCase().replace(/\s+/g, "-")}@example.com`,
    passwordHash: "hashed-password",
    alias,
  });

  return userId;
}

async function seedCaseDefinitions() {
  const db = await getDb();
  const hollowBishopId = randomUUID();
  const redHarborId = randomUUID();
  const briarLedgerId = randomUUID();

  await db.insert(caseDefinitions).values([
    {
      id: hollowBishopId,
      slug: "hollow-bishop",
      title: "The Hollow Bishop",
      currentPublishedRevision: "rev-1",
    },
    {
      id: redHarborId,
      slug: "red-harbor",
      title: "Signal at Red Harbor",
      currentPublishedRevision: "rev-1",
    },
    {
      id: briarLedgerId,
      slug: "briar-ledger",
      title: "The Briar Ledger",
      currentPublishedRevision: "rev-1",
    },
  ]);

  return {
    hollowBishopId,
    redHarborId,
    briarLedgerId,
  };
}

test("summarizes totals and prefers the most recently active in-progress case", async () => {
  const getServiceRecord = await loadGetServiceRecord();
  const db = await getDb();
  const userId = await seedUser("Agent Record");
  const { hollowBishopId, redHarborId, briarLedgerId } =
    await seedCaseDefinitions();

  expect(getServiceRecord).toBeTypeOf("function");

  await db.insert(playerCases).values([
    {
      id: randomUUID(),
      userId,
      caseDefinitionId: hollowBishopId,
      caseRevision: "rev-1",
      status: "completed",
      updatedAt: new Date("2026-03-14T09:00:00.000Z"),
    },
    {
      id: "red-harbor-case",
      userId,
      caseDefinitionId: redHarborId,
      caseRevision: "rev-1",
      status: "in_progress",
      lastViewedEvidenceId: "dispatch-log",
      lastViewedEvidenceAt: new Date("2026-03-14T10:00:00.000Z"),
      updatedAt: new Date("2026-03-14T10:00:00.000Z"),
    },
    {
      id: randomUUID(),
      userId,
      caseDefinitionId: briarLedgerId,
      caseRevision: "rev-1",
      status: "closed_unsolved",
      updatedAt: new Date("2026-03-14T08:00:00.000Z"),
    },
  ]);

  await db.insert(notes).values({
    id: randomUUID(),
    playerCaseId: "red-harbor-case",
    body: "Recheck the harbor log.",
    updatedAt: new Date("2026-03-14T10:05:00.000Z"),
  });

  const result = await getServiceRecord?.({ userId });

  expect(result?.totals).toEqual({
    availableCases: 3,
    clearedCases: 1,
    activeCases: 1,
    closedUnresolvedCases: 1,
  });
  expect(result?.progressLabel).toBe("1 of 3 dossiers cleared");
  expect(result?.recommendedAssignment).toEqual({
    label: "Resume Notes",
    href: "/cases/red-harbor?evidence=dispatch-log#field-notes",
    reason: "Your most recent active dossier still has saved work waiting.",
  });
});

test("falls back to the first available new case when no active case exists", async () => {
  const getServiceRecord = await loadGetServiceRecord();
  const db = await getDb();
  const userId = await seedUser("Agent New Dossier");
  const { hollowBishopId } = await seedCaseDefinitions();

  expect(getServiceRecord).toBeTypeOf("function");

  await db.insert(playerCases).values({
    id: randomUUID(),
    userId,
    caseDefinitionId: hollowBishopId,
    caseRevision: "rev-1",
    status: "completed",
    updatedAt: new Date("2026-03-14T09:00:00.000Z"),
  });

  const result = await getServiceRecord?.({ userId });

  expect(result?.totals).toEqual({
    availableCases: 3,
    clearedCases: 1,
    activeCases: 0,
    closedUnresolvedCases: 0,
  });
  expect(result?.recommendedAssignment).toEqual({
    label: "Open Case File",
    href: "/cases/red-harbor",
    reason: "A fresh dossier is ready for field review.",
  });
});

test("can exclude a case slug when choosing the next assignment", async () => {
  const getServiceRecord = await loadGetServiceRecord();
  const db = await getDb();
  const userId = await seedUser("Agent Exclude");
  const { hollowBishopId, redHarborId } = await seedCaseDefinitions();

  expect(getServiceRecord).toBeTypeOf("function");

  await db.insert(playerCases).values([
    {
      id: "red-harbor-case",
      userId,
      caseDefinitionId: redHarborId,
      caseRevision: "rev-1",
      status: "in_progress",
      lastViewedEvidenceId: "dispatch-log",
      lastViewedEvidenceAt: new Date("2026-03-14T10:00:00.000Z"),
      updatedAt: new Date("2026-03-14T10:00:00.000Z"),
    },
    {
      id: "hollow-bishop-case",
      userId,
      caseDefinitionId: hollowBishopId,
      caseRevision: "rev-1",
      status: "in_progress",
      lastViewedEvidenceId: "vestry-interview",
      lastViewedEvidenceAt: new Date("2026-03-14T09:00:00.000Z"),
      updatedAt: new Date("2026-03-14T09:00:00.000Z"),
    },
  ]);

  const result = await getServiceRecord?.({
    userId,
    excludeCaseSlug: "red-harbor",
  });

  expect(result?.recommendedAssignment).toEqual({
    label: "Return to Evidence",
    href: "/cases/hollow-bishop?evidence=vestry-interview#evidence-intake",
    reason: "Your most recent active dossier still has saved work waiting.",
  });
});
