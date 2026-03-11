import "server-only";

import {
  getDisplayStatus,
  isPlayerCaseStatus,
  type PlayerCaseStatus,
} from "@/features/cases/case-status";
import { loadCaseManifest } from "@/features/cases/load-case-manifest";
import { syncCaseDefinitions } from "@/features/cases/sync-case-definitions";
import { getCaseAvailability } from "@/features/maintenance/get-case-availability";
import { getDb } from "@/lib/db";

export type VaultCaseRecord = {
  slug: string;
  title: string;
  summary: string;
  estimatedMinutes: number;
  status: PlayerCaseStatus;
  displayStatus: string;
  availability: "Available" | "Maintenance" | "Hidden";
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
  const playerCaseByDefinitionId = new Map(
    existingPlayerCases.map((playerCase) => [
      playerCase.caseDefinitionId,
      playerCase,
    ]),
  );

  const dossiers = await Promise.all(
    definitions.map(async (definition) => {
      const playerCase = playerCaseByDefinitionId.get(definition.id);
      const published = definition.currentPublishedRevision.length > 0;
      let broken = false;
      let manifest: Awaited<ReturnType<typeof loadCaseManifest>> | null = null;

      try {
        manifest = await loadCaseManifest(definition.slug);
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

      return {
        slug: definition.slug,
        title: manifest?.title ?? definition.title,
        summary:
          manifest?.summary ??
          "This dossier is under maintenance while Ashfall repairs the published file.",
        estimatedMinutes: manifest?.estimatedMinutes ?? 0,
        status,
        displayStatus: getDisplayStatus(status),
        availability,
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
