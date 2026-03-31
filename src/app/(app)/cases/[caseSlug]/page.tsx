import { randomUUID } from "node:crypto";

import { desc, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";

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
import {
  loadAnyCaseManifest,
  type LoadedCaseManifest,
  type LoadedStagedCaseManifest,
} from "@/features/cases/load-case-manifest";
import { loadCaseIntroduction } from "@/features/cases/load-case-introduction";
import { openCase } from "@/features/cases/open-case";
import { rememberViewedEvidence } from "@/features/cases/remember-viewed-evidence";
import { getDb } from "@/lib/db";
import { CaseIntroductionModal } from "@/features/cases/components/case-introduction-modal";

type CasePageProps = {
  params: Promise<{
    caseSlug: string;
  }>;
  searchParams?: Promise<CaseSearchParams>;
};

type CaseSearchParams = Record<string, string | string[] | undefined> & {
  evidence?: string | string[];
  intro?: string | string[];
};

function getFirstSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildCaseHref(
  caseSlug: string,
  searchParams: CaseSearchParams,
  mutations: Record<string, string | null | undefined>,
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (Object.prototype.hasOwnProperty.call(mutations, key)) {
      continue;
    }

    if (value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        params.append(key, entry);
      }
      continue;
    }

    params.set(key, value);
  }

  for (const [key, value] of Object.entries(mutations)) {
    if (value === null || value === undefined) {
      continue;
    }

    params.set(key, value);
  }

  const query = params.toString();
  return `/cases/${caseSlug}${query ? `?${query}` : ""}`;
}

function isStagedManifest(
  manifest: LoadedCaseManifest,
): manifest is LoadedStagedCaseManifest {
  return "stages" in manifest;
}

export default async function CasePage({
  params,
  searchParams,
}: CasePageProps) {
  let introduction: Awaited<ReturnType<typeof loadCaseIntroduction>> = null;
  let introCloseHref: string | undefined;
  let replayIntroductionHref: string | undefined;
  let shouldOpenIntroduction = false;
  let caseData:
    | {
        manifest: Awaited<ReturnType<typeof loadAnyCaseManifest>>;
        lifecycle: Awaited<ReturnType<typeof openCase>>;
        savedNote: typeof notes.$inferSelect | undefined;
        savedDraft: typeof reportDrafts.$inferSelect | undefined;
        latestSubmission: typeof reportSubmissions.$inferSelect | undefined;
        objectiveStates: typeof playerCaseObjectives.$inferSelect[];
        objectiveSubmissionRows: typeof objectiveSubmissions.$inferSelect[];
        selectedEvidenceId: string | undefined;
        viewedEvidenceIds: string[];
        submissionToken: string;
      }
    | null = null;
  const [{ caseSlug }, resolvedSearchParams, userId] =
    await Promise.all([
      params,
      searchParams ?? Promise.resolve<CaseSearchParams>({}),
      getCurrentAgentId(),
    ]);
  const introQueryValue = getFirstSearchParamValue(resolvedSearchParams.intro);
  const introQueryPresent = introQueryValue === "1";
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
    const [manifest, loadedIntroduction] = await Promise.all([
      loadAnyCaseManifest(caseSlug, {
        expectedRevision: lifecycle.playerCase.caseRevision,
      }),
      loadCaseIntroduction(caseSlug),
    ]);

    introduction = loadedIntroduction;

    if (introQueryPresent && !introduction) {
      redirect(buildCaseHref(caseSlug, resolvedSearchParams, { intro: null }));
    }

    shouldOpenIntroduction =
      introQueryPresent ||
      Boolean(
        introduction && lifecycle.playerCase.introductionSeenAt === null,
      );
    replayIntroductionHref = introduction
      ? buildCaseHref(caseSlug, resolvedSearchParams, { intro: "1" })
      : undefined;
    introCloseHref = introQueryPresent
      ? buildCaseHref(caseSlug, resolvedSearchParams, { intro: null })
      : undefined;
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
    const visibleEvidence = stagedProgression?.visibleEvidence ?? manifest.evidence;
    const requestedEvidenceId = selectedEvidenceIds[0];
    const openedEvidence = shouldOpenIntroduction
      ? undefined
      : requestedEvidenceId
      ? visibleEvidence.find((item) => item.id === requestedEvidenceId)
      : undefined;
    let viewedEvidenceIds = lifecycle.playerCase.viewedEvidenceIds ?? [];

    if (openedEvidence) {
      try {
        const updatedPlayerCase = await rememberViewedEvidence({
          playerCaseId: lifecycle.playerCase.id,
          evidenceId: openedEvidence.id,
        });
        viewedEvidenceIds = updatedPlayerCase.viewedEvidenceIds ?? viewedEvidenceIds;
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
      selectedEvidenceId: openedEvidence?.id,
      viewedEvidenceIds,
      submissionToken: randomUUID(),
    };
  } catch (error) {
    if (
      isRedirectError(error) ||
      (error instanceof Error && error.message.startsWith("NEXT_REDIRECT:"))
    ) {
      throw error;
    }

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
      <div className="mx-auto max-w-7xl space-y-10">
        <CaseReturnHeader
          eyebrow={`Handler channel / ${caseData.lifecycle.playerCase.caseRevision}`}
          progressSnapshot={progressSnapshot}
          summary={caseData.manifest.summary}
          title={caseData.manifest.title}
          replayIntroductionHref={replayIntroductionHref}
        />

        {shouldOpenIntroduction && introduction ? (
          <CaseIntroductionModal
            caseName={caseData.manifest.title}
            caseSlug={caseSlug}
            closeHref={introCloseHref}
            intro={introduction}
            open={shouldOpenIntroduction}
            playerCaseId={caseData.lifecycle.playerCase.id}
          />
        ) : null}

        <CaseWorkspace
          caseSlug={caseSlug}
          introOpen={shouldOpenIntroduction}
          manifest={caseData.manifest}
          playerCaseId={caseData.lifecycle.playerCase.id}
          latestSubmission={caseData.latestSubmission}
          objectiveStates={caseData.objectiveStates}
          objectiveSubmissions={caseData.objectiveSubmissionRows}
          savedDraft={caseData.savedDraft}
          savedNote={caseData.savedNote}
          selectedEvidenceId={caseData.selectedEvidenceId}
          viewedEvidenceIds={caseData.viewedEvidenceIds}
          submissionToken={caseData.submissionToken}
        />
      </div>
    </main>
  );
}
