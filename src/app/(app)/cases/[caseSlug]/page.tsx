import { randomUUID } from "node:crypto";

import { desc, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

import {
  notes,
  objectiveSubmissions,
  playerCaseObjectives,
  reportDrafts,
  reportSubmissions,
} from "@/db/schema";
import { CaseReturnHeader } from "@/components/case-return-header";
import { getCurrentAgentId } from "@/features/auth/current-agent";
import { buildCaseProgression } from "@/features/cases/case-progression";
import { CaseWorkspace } from "@/features/cases/components/case-workspace";
import { buildObjectiveReviewState } from "@/features/cases/objective-review-state";
import {
  loadAnyCaseManifest,
  type LoadedCaseManifest,
  type LoadedStagedCaseManifest,
} from "@/features/cases/load-case-manifest";
import { loadStagedProtectedCase } from "@/features/cases/load-protected-case";
import { openCase } from "@/features/cases/open-case";
import { rememberViewedEvidence } from "@/features/cases/remember-viewed-evidence";
import { getDb } from "@/lib/db";

type CasePageProps = {
  params: Promise<{
    caseSlug: string;
  }>;
  searchParams?: Promise<CaseSearchParams>;
};

type CaseSearchParams = {
  evidence?: string | string[];
};

function isStagedManifest(
  manifest: LoadedCaseManifest,
): manifest is LoadedStagedCaseManifest {
  return "stages" in manifest;
}

export default async function CasePage({
  params,
  searchParams,
}: CasePageProps) {
  let caseData:
    | {
        manifest: Awaited<ReturnType<typeof loadAnyCaseManifest>>;
        lifecycle: Awaited<ReturnType<typeof openCase>>;
        savedNote: typeof notes.$inferSelect | undefined;
        savedDraft: typeof reportDrafts.$inferSelect | undefined;
        latestSubmission: typeof reportSubmissions.$inferSelect | undefined;
        objectiveStates: typeof playerCaseObjectives.$inferSelect[];
        objectiveSubmissionRows: typeof objectiveSubmissions.$inferSelect[];
        stagedReviewState:
          | ReturnType<typeof buildObjectiveReviewState>
          | undefined;
        selectedEvidenceId: string | undefined;
        submissionToken: string;
      }
    | null = null;
  const [{ caseSlug }, resolvedSearchParams, userId] =
    await Promise.all([
      params,
      searchParams ?? Promise.resolve<CaseSearchParams>({}),
      getCurrentAgentId(),
    ]);
  const selectedEvidenceIds = Array.isArray(resolvedSearchParams.evidence)
    ? resolvedSearchParams.evidence
    : resolvedSearchParams.evidence
      ? [resolvedSearchParams.evidence]
      : [];

  if (!userId) {
    redirect("/apply");
  }

  try {
    const lifecycle = await openCase({ userId, caseSlug });
    const manifest = await loadAnyCaseManifest(caseSlug, {
      expectedRevision: lifecycle.playerCase.caseRevision,
    });
    const db = await getDb();
    const [
      savedNote,
      savedDraft,
      latestSubmission,
      objectiveStates,
      objectiveSubmissionRows,
    ] = await Promise.all([
      db.query.notes.findFirst({
        where: eq(notes.playerCaseId, lifecycle.playerCase.id),
      }),
      db.query.reportDrafts.findFirst({
        where: eq(reportDrafts.playerCaseId, lifecycle.playerCase.id),
      }),
      db.query.reportSubmissions.findFirst({
        where: eq(reportSubmissions.playerCaseId, lifecycle.playerCase.id),
        orderBy: [desc(reportSubmissions.attemptNumber)],
      }),
      db.query.playerCaseObjectives.findMany({
        where: eq(playerCaseObjectives.playerCaseId, lifecycle.playerCase.id),
      }),
      db.query.objectiveSubmissions.findMany({
        where: eq(objectiveSubmissions.playerCaseId, lifecycle.playerCase.id),
        orderBy: [desc(objectiveSubmissions.createdAt)],
      }),
    ]);
    const stagedProgression = isStagedManifest(manifest)
      ? buildCaseProgression({
          manifest,
          objectiveStates: objectiveStates.map((objectiveState) => ({
            objectiveId: objectiveState.objectiveId,
            stageId: objectiveState.stageId,
            status: objectiveState.status,
          })),
        })
      : null;
    const stagedProtectedCase = isStagedManifest(manifest)
      ? await loadStagedProtectedCase(caseSlug, {
          expectedRevision: lifecycle.playerCase.caseRevision,
        })
      : null;
    const visibleEvidence = stagedProgression?.visibleEvidence ?? manifest.evidence;
    const requestedEvidenceId =
      selectedEvidenceIds[0] ?? lifecycle.playerCase.lastViewedEvidenceId ?? undefined;
    const selectedEvidence =
      visibleEvidence.find((item) => item.id === requestedEvidenceId) ??
      visibleEvidence[0];

    if (selectedEvidence) {
      try {
        await rememberViewedEvidence({
          playerCaseId: lifecycle.playerCase.id,
          evidenceId: selectedEvidence.id,
        });
      } catch {
        // Rendering the case should not fail purely because refreshing remembered
        // evidence context did not persist.
      }
    }

    caseData = {
      manifest,
      lifecycle,
      savedNote,
      savedDraft,
      latestSubmission,
      objectiveStates,
      objectiveSubmissionRows,
      stagedReviewState:
        stagedProtectedCase && isStagedManifest(manifest)
          ? buildObjectiveReviewState({
              manifest,
              objectiveSubmissions: objectiveSubmissionRows,
              gradedFailureCount: lifecycle.playerCase.gradedFailureCount,
              maxGradedFailures: stagedProtectedCase.grading.maxGradedFailures,
            })
          : undefined,
      selectedEvidenceId: selectedEvidence?.id,
      submissionToken: randomUUID(),
    };
  } catch {
    notFound();
  }

  if (!caseData) {
    notFound();
  }

  const progressSnapshot = isStagedManifest(caseData.manifest)
    ? buildCaseProgression({
        manifest: caseData.manifest,
        objectiveStates: caseData.objectiveStates.map((objectiveState) => ({
          objectiveId: objectiveState.objectiveId,
          stageId: objectiveState.stageId,
          status: objectiveState.status,
        })),
      }).snapshot
    : undefined;

  return (
    <main className="min-h-screen bg-stone-950 px-6 py-16 text-stone-50">
      <div className="mx-auto max-w-5xl space-y-10">
        <CaseReturnHeader
          eyebrow={`Handler channel / ${caseData.lifecycle.playerCase.caseRevision}`}
          progressSnapshot={progressSnapshot}
          summary={caseData.manifest.summary}
          title={caseData.manifest.title}
        />

        <CaseWorkspace
          caseSlug={caseSlug}
          manifest={caseData.manifest}
          playerCaseId={caseData.lifecycle.playerCase.id}
          latestSubmission={caseData.latestSubmission}
          objectiveStates={caseData.objectiveStates}
          objectiveSubmissions={caseData.objectiveSubmissionRows}
          resumeTarget={caseData.lifecycle.resumeTarget}
          savedDraft={caseData.savedDraft}
          savedNote={caseData.savedNote}
          selectedEvidenceId={caseData.selectedEvidenceId}
          stagedReviewState={caseData.stagedReviewState}
          submissionToken={caseData.submissionToken}
        />
      </div>
    </main>
  );
}
