import "server-only";

import {
  getDisplayStatus,
  getVaultAvailability,
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
  availability: "Available" | "Hidden";
};

export async function listAvailableCases(input: { userId?: string }) {
  const db = await getDb();

  await syncCaseDefinitions(db);

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
      const availability = getCaseAvailability({
        currentPublishedRevision: definition.currentPublishedRevision,
        hasStartedCase: Boolean(playerCase),
      });

      if (!availability.visible) {
        return null;
      }

      const manifest = await loadCaseManifest(definition.slug);
      const status = isPlayerCaseStatus(playerCase?.status ?? "")
        ? playerCase.status
        : "new";

      return {
        slug: definition.slug,
        title: manifest.title,
        summary: manifest.summary,
        estimatedMinutes: manifest.estimatedMinutes,
        status,
        displayStatus: getDisplayStatus(status),
        availability: getVaultAvailability({
          published: availability.published,
        }),
      } satisfies VaultCaseRecord;
    }),
  );

  return dossiers
    .filter((dossier): dossier is VaultCaseRecord => dossier !== null)
    .sort((left, right) => left.title.localeCompare(right.title));
}
