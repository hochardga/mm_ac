import "server-only";

import { inArray } from "drizzle-orm";

import {
  notes,
  objectiveSubmissions,
  playerCaseObjectives,
  reportDrafts,
  reportSubmissions,
} from "@/db/schema";
import {
  buildCaseContinuity,
  type CaseContinuitySummary,
} from "@/features/cases/case-continuity";
import {
  getDisplayStatus,
  isPlayerCaseStatus,
  type PlayerCaseStatus,
} from "@/features/cases/case-status";
import { loadAnyCaseManifest } from "@/features/cases/load-case-manifest";
import { syncCaseDefinitions } from "@/features/cases/sync-case-definitions";
import { getCaseAvailability } from "@/features/maintenance/get-case-availability";
import { getDb } from "@/lib/db";

export type VaultCaseRecord = {
  slug: string;
  title: string;
  summary: string;
  complexity: "light" | "standard" | "deep";
  status: PlayerCaseStatus;
  displayStatus: string;
  availability: "Available" | "Maintenance" | "Hidden";
  continuity?: CaseContinuitySummary;
};

export async function listAvailableCases(
  input: { userId?: string },
): Promise<VaultCaseRecord[]> {
  const db = await getDb();

  try {
    await syncCaseDefinitions(db);
  } catch {
    // Published rows already in the database should still render even if the
    // latest authored manifest is temporarily broken.
  }

  const definitions = await db.query.caseDefinitions.findMany();
  const existingPlayerCases = input.userId
    ? await db.query.playerCases.findMany({
        where: (playerCase, { eq }) => eq(playerCase.userId, input.userId!),
      })
    : [];
  const playerCaseIds = existingPlayerCases.map((playerCase) => playerCase.id);
  const [
    savedNotes,
    savedDrafts,
    savedSubmissions,
    savedObjectiveStates,
    savedObjectiveSubmissions,
  ] =
    playerCaseIds.length > 0
      ? await Promise.all([
          db.query.notes.findMany({
            where: inArray(notes.playerCaseId, playerCaseIds),
          }),
          db.query.reportDrafts.findMany({
            where: inArray(reportDrafts.playerCaseId, playerCaseIds),
          }),
          db.query.reportSubmissions.findMany({
            where: inArray(reportSubmissions.playerCaseId, playerCaseIds),
          }),
          db.query.playerCaseObjectives.findMany({
            where: inArray(playerCaseObjectives.playerCaseId, playerCaseIds),
          }),
          db.query.objectiveSubmissions.findMany({
            where: inArray(objectiveSubmissions.playerCaseId, playerCaseIds),
          }),
        ])
      : [[], [], [], [], []];
  const playerCaseByDefinitionId = new Map(
    existingPlayerCases.map((playerCase) => [
      playerCase.caseDefinitionId,
      playerCase,
    ]),
  );
  const savedNoteByPlayerCaseId = new Map(
    savedNotes.map((note) => [note.playerCaseId, note]),
  );
  const savedDraftByPlayerCaseId = new Map(
    savedDrafts.map((draft) => [draft.playerCaseId, draft]),
  );
  const objectiveStatesByPlayerCaseId = new Map<
    string,
    typeof savedObjectiveStates
  >();
  const objectiveSubmissionsByPlayerCaseId = new Map<
    string,
    typeof savedObjectiveSubmissions
  >();
  const latestSubmissionByPlayerCaseId = new Map<
    string,
    (typeof savedSubmissions)[number]
  >();

  for (const objectiveState of savedObjectiveStates) {
    const current =
      objectiveStatesByPlayerCaseId.get(objectiveState.playerCaseId) ?? [];
    current.push(objectiveState);
    objectiveStatesByPlayerCaseId.set(objectiveState.playerCaseId, current);
  }

  for (const submission of savedObjectiveSubmissions) {
    const current =
      objectiveSubmissionsByPlayerCaseId.get(submission.playerCaseId) ?? [];
    current.push(submission);
    objectiveSubmissionsByPlayerCaseId.set(submission.playerCaseId, current);
  }

  for (const submission of savedSubmissions) {
    const current = latestSubmissionByPlayerCaseId.get(submission.playerCaseId);

    if (!current || submission.attemptNumber > current.attemptNumber) {
      latestSubmissionByPlayerCaseId.set(submission.playerCaseId, submission);
    }
  }

  const dossiers = await Promise.all(
    definitions.map(async (definition) => {
      const playerCase = playerCaseByDefinitionId.get(definition.id);
      const published = definition.currentPublishedRevision.length > 0;
      let broken = false;
      let manifest: Awaited<ReturnType<typeof loadAnyCaseManifest>> | null = null;

      try {
        manifest = await loadAnyCaseManifest(definition.slug);
      } catch {
        broken = true;
      }

      const availability = getCaseAvailability({
        published,
        broken,
        hasPlayerCase: Boolean(playerCase),
      });

      if (availability === "Hidden") {
        return null;
      }

      const playerStatus = playerCase?.status ?? "";
      const status = isPlayerCaseStatus(playerStatus)
        ? playerStatus
        : "new";
      const continuity =
        playerCase && availability === "Available"
          ? buildCaseContinuity({
              caseSlug: definition.slug,
              status,
              lastViewedEvidenceId: playerCase.lastViewedEvidenceId,
              lastViewedEvidenceAt: playerCase.lastViewedEvidenceAt,
              note: savedNoteByPlayerCaseId.get(playerCase.id),
              draft: savedDraftByPlayerCaseId.get(playerCase.id),
              latestSubmission: latestSubmissionByPlayerCaseId.get(
                playerCase.id,
              ),
              objectiveStates: objectiveStatesByPlayerCaseId.get(playerCase.id),
              objectiveSubmissions: objectiveSubmissionsByPlayerCaseId.get(
                playerCase.id,
              ),
              playerCaseUpdatedAt: playerCase.updatedAt,
            })
          : undefined;

      return {
        slug: definition.slug,
        title: manifest?.title ?? definition.title,
        summary:
          manifest?.summary ??
          "This dossier is under maintenance while Ashfall repairs the published file.",
        complexity: manifest && "complexity" in manifest ? manifest.complexity : "standard",
        status,
        displayStatus: getDisplayStatus(status),
        availability,
        continuity,
      } satisfies VaultCaseRecord;
    }),
  );

  const availableDossiers = dossiers.reduce<VaultCaseRecord[]>(
    (records, dossier) => {
      if (dossier) {
        records.push(dossier);
      }

      return records;
    },
    [],
  );

  availableDossiers.sort((left, right) => left.title.localeCompare(right.title));

  return availableDossiers;
}
