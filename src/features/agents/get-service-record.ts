import "server-only";

import { eq, inArray } from "drizzle-orm";

import { caseDefinitions, playerCases } from "@/db/schema";
import { listAvailableCases } from "@/features/cases/list-available-cases";
import { getDb } from "@/lib/db";

type ServiceRecordInput = {
  userId: string;
  excludeCaseSlug?: string;
};

type RecommendedAssignment = {
  label: string;
  href: string;
  reason: string;
};

export type ServiceRecord = {
  totals: {
    availableCases: number;
    clearedCases: number;
    activeCases: number;
    closedUnresolvedCases: number;
  };
  progressLabel: string;
  latestOutcome: {
    title: string;
    statusLabel: string;
  } | null;
  recommendedAssignment: RecommendedAssignment | null;
};

function getRecommendedAssignment(
  dossiers: Awaited<ReturnType<typeof listAvailableCases>>,
): RecommendedAssignment | null {
  const activeDossier = [...dossiers]
    .filter(
      (dossier) =>
        dossier.availability === "Available" &&
        dossier.status === "in_progress" &&
        dossier.continuity,
    )
    .sort((left, right) => {
      const leftTime = left.continuity?.lastActivityAt?.getTime() ?? 0;
      const rightTime = right.continuity?.lastActivityAt?.getTime() ?? 0;

      return rightTime - leftTime;
    })[0];

  if (activeDossier?.continuity) {
    return {
      label: activeDossier.continuity.label,
      href: activeDossier.continuity.href,
      reason: "Your most recent active dossier still has saved work waiting.",
    };
  }

  const newDossier = dossiers.find(
    (dossier) =>
      dossier.availability === "Available" && dossier.status === "new",
  );

  if (newDossier) {
    return {
      label: "Open Case File",
      href: `/cases/${newDossier.slug}`,
      reason: "A fresh dossier is ready for field review.",
    };
  }

  return null;
}

export async function getServiceRecord(
  input: ServiceRecordInput,
): Promise<ServiceRecord> {
  const db = await getDb();
  const [dossiers, userPlayerCases] = await Promise.all([
    listAvailableCases({ userId: input.userId }),
    db.query.playerCases.findMany({
      where: eq(playerCases.userId, input.userId),
    }),
  ]);
  const caseDefinitionIds = userPlayerCases.map(
    (playerCase) => playerCase.caseDefinitionId,
  );
  const definitions =
    caseDefinitionIds.length > 0
      ? await db.query.caseDefinitions.findMany({
          where: inArray(caseDefinitions.id, caseDefinitionIds),
        })
      : [];
  const definitionById = new Map(
    definitions.map((definition) => [definition.id, definition] as const),
  );
  const filteredDossiers = dossiers.filter(
    (dossier) => dossier.slug !== input.excludeCaseSlug,
  );
  const clearedCases = userPlayerCases.filter(
    (playerCase) => playerCase.status === "completed",
  ).length;
  const activeCases = userPlayerCases.filter(
    (playerCase) => playerCase.status === "in_progress",
  ).length;
  const closedUnresolvedCases = userPlayerCases.filter(
    (playerCase) => playerCase.status === "closed_unsolved",
  ).length;
  const latestOutcomeCase = [...userPlayerCases]
    .filter(
      (playerCase) =>
        playerCase.status === "completed" ||
        playerCase.status === "closed_unsolved",
    )
    .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())[0];
  const latestOutcomeDefinition = latestOutcomeCase
    ? definitionById.get(latestOutcomeCase.caseDefinitionId)
    : undefined;
  const latestOutcomeDossier = latestOutcomeDefinition
    ? dossiers.find((dossier) => dossier.slug === latestOutcomeDefinition.slug)
    : undefined;

  return {
    totals: {
      availableCases: dossiers.length,
      clearedCases,
      activeCases,
      closedUnresolvedCases,
    },
    progressLabel: `${clearedCases} of ${dossiers.length} dossiers cleared`,
    latestOutcome: latestOutcomeDossier
      ? {
          title: latestOutcomeDossier.title,
          statusLabel: latestOutcomeDossier.displayStatus,
        }
      : null,
    recommendedAssignment: getRecommendedAssignment(filteredDossiers),
  };
}
