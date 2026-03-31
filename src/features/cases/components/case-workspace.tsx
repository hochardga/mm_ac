import type {
  notes,
  objectiveSubmissions,
  playerCaseObjectives,
  reportDrafts,
  reportSubmissions,
} from "@/db/schema";
import { ActiveObjectivesPanel } from "@/features/cases/components/active-objectives-panel";
import { CaseNotesPanel } from "@/features/cases/components/case-notes-panel";
import { EvidenceDialog } from "@/features/cases/components/evidence-dialog";
import { EvidenceIndex } from "@/features/cases/components/evidence-index";
import { EvidenceViewer } from "@/features/cases/components/evidence-viewer";
import { ReportPanel } from "@/features/cases/components/report-panel";
import { buildCaseProgression } from "@/features/cases/case-progression";
import type {
  LoadedCaseManifest,
  LoadedLegacyCaseManifest,
  LoadedStagedCaseManifest,
} from "@/features/cases/load-case-manifest";

type SavedNote = typeof notes.$inferSelect | undefined;
type SavedDraft = typeof reportDrafts.$inferSelect | undefined;
type LatestSubmission = typeof reportSubmissions.$inferSelect | undefined;
type ObjectiveState = typeof playerCaseObjectives.$inferSelect[];
type ObjectiveSubmissionRows = typeof objectiveSubmissions.$inferSelect[];

type CaseWorkspaceProps = {
  caseSlug: string;
  introOpen?: boolean;
  manifest: LoadedCaseManifest;
  playerCaseId: string;
  savedNote: SavedNote;
  savedDraft: SavedDraft;
  latestSubmission: LatestSubmission;
  objectiveStates: ObjectiveState;
  objectiveSubmissions: ObjectiveSubmissionRows;
  submissionToken: string;
  selectedEvidenceId?: string;
  viewedEvidenceIds: string[];
};

function isStagedManifest(
  manifest: LoadedCaseManifest,
): manifest is LoadedStagedCaseManifest {
  return "stages" in manifest;
}

function isLegacyManifest(
  manifest: LoadedCaseManifest,
): manifest is LoadedLegacyCaseManifest {
  return "reportOptions" in manifest;
}

export function CaseWorkspace({
  caseSlug,
  manifest,
  playerCaseId,
  savedNote,
  savedDraft,
  latestSubmission,
  objectiveStates,
  objectiveSubmissions,
  submissionToken,
  selectedEvidenceId,
  viewedEvidenceIds,
  introOpen = false,
}: CaseWorkspaceProps) {
  const activeSelectedEvidenceId = introOpen ? undefined : selectedEvidenceId;
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
  const defaultEvidence = visibleEvidence[0];
  const newEvidenceIds = visibleEvidence
    .map((item) => item.id)
    .filter((evidenceId) => !viewedEvidenceIds.includes(evidenceId));
  const selectedEvidence = activeSelectedEvidenceId
    ? visibleEvidence.find((item) => item.id === activeSelectedEvidenceId)
    : undefined;

  if (!defaultEvidence) {
    return null;
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <EvidenceIndex
          caseSlug={caseSlug}
          evidence={visibleEvidence}
          newEvidenceIds={newEvidenceIds}
          selectedEvidenceId={selectedEvidence?.id}
        />

        <aside className="space-y-6">
          <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-semibold">Handler Directives</h2>
            <ul className="mt-6 space-y-4 text-sm leading-7 text-stone-300">
              {(stagedProgression?.visibleHandlerPrompts ??
                (isLegacyManifest(manifest) ? manifest.handlerPrompts : [])
              ).map((prompt, index) => (
                <li key={`handler-prompt-${index}`}>{prompt}</li>
              ))}
            </ul>
          </section>

          <CaseNotesPanel
            caseSlug={caseSlug}
            playerCaseId={playerCaseId}
            savedNote={savedNote}
          />

          {stagedProgression ? (
            <ActiveObjectivesPanel
              activeObjectives={stagedProgression.activeObjectives}
              caseSlug={caseSlug}
              objectiveRows={objectiveStates}
              objectiveSubmissions={objectiveSubmissions}
              playerCaseId={playerCaseId}
              selectedEvidenceId={selectedEvidence?.id}
              solvedObjectives={stagedProgression.solvedObjectives}
              submissionToken={submissionToken}
            />
          ) : isLegacyManifest(manifest) ? (
            <ReportPanel
              caseSlug={caseSlug}
              playerCaseId={playerCaseId}
              selectedEvidenceId={selectedEvidence?.id}
              manifest={manifest}
              savedDraft={savedDraft}
              latestSubmission={latestSubmission}
              submissionToken={submissionToken}
            />
          ) : null}
        </aside>
      </section>

      {selectedEvidence ? (
        <EvidenceDialog
          closeHref={`/cases/${caseSlug}#evidence-${selectedEvidence.id}`}
          title={selectedEvidence.title}
        >
          <EvidenceViewer caseSlug={caseSlug} evidence={selectedEvidence} />
        </EvidenceDialog>
      ) : null}
    </div>
  );
}
