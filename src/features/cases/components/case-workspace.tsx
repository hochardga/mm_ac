import type {
  notes,
  objectiveSubmissions,
  playerCaseObjectives,
  reportDrafts,
  reportSubmissions,
} from "@/db/schema";
import { ActiveObjectivesPanel } from "@/features/cases/components/active-objectives-panel";
import { CaseContinuityBanner } from "@/features/cases/components/case-continuity-banner";
import { CaseNotesPanel } from "@/features/cases/components/case-notes-panel";
import { EvidenceIndex } from "@/features/cases/components/evidence-index";
import { EvidenceViewer } from "@/features/cases/components/evidence-viewer";
import { ReportPanel } from "@/features/cases/components/report-panel";
import { buildCaseProgression } from "@/features/cases/case-progression";
import type { openCase } from "@/features/cases/open-case";
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
type ResumeTarget = Awaited<ReturnType<typeof openCase>>["resumeTarget"];

type CaseWorkspaceProps = {
  caseSlug: string;
  manifest: LoadedCaseManifest;
  playerCaseId: string;
  savedNote: SavedNote;
  savedDraft: SavedDraft;
  latestSubmission: LatestSubmission;
  objectiveStates: ObjectiveState;
  objectiveSubmissions: ObjectiveSubmissionRows;
  bookmarkedEvidenceIds?: string[];
  submissionToken: string;
  selectedEvidenceId?: string;
  resumeTarget: ResumeTarget;
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
  bookmarkedEvidenceIds,
  submissionToken,
  selectedEvidenceId,
  resumeTarget,
}: CaseWorkspaceProps) {
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
  const selectedEvidence =
    visibleEvidence.find((item) => item.id === selectedEvidenceId) ??
    visibleEvidence[0];

  if (!selectedEvidence) {
    return null;
  }

  const rightRailHref = stagedProgression ? "#active-objectives" : "#draft-report";
  const rightRailLabel = stagedProgression
    ? "Jump to Active Objectives"
    : "Jump to Draft Report";

  return (
    <div className="space-y-6">
      {resumeTarget.section === "notes" ||
      resumeTarget.section === "report" ||
      resumeTarget.section === "objectives" ? (
        <CaseContinuityBanner
          description={resumeTarget.description}
          label={resumeTarget.label}
          rightRailHref={rightRailHref}
          rightRailLabel={rightRailLabel}
        />
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)_24rem]">
        <EvidenceIndex
          caseSlug={caseSlug}
          evidence={visibleEvidence}
          selectedEvidenceId={selectedEvidence.id}
        />

        <EvidenceViewer caseSlug={caseSlug} evidence={selectedEvidence} />

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
            selectedEvidenceTitle={selectedEvidence.title}
          />

          {stagedProgression ? (
            <ActiveObjectivesPanel
              activeObjectives={stagedProgression.activeObjectives}
              caseSlug={caseSlug}
              objectiveRows={objectiveStates}
              objectiveSubmissions={objectiveSubmissions}
              playerCaseId={playerCaseId}
              selectedEvidenceId={selectedEvidence.id}
              solvedObjectives={stagedProgression.solvedObjectives}
              submissionToken={submissionToken}
            />
          ) : isLegacyManifest(manifest) ? (
            <ReportPanel
              caseSlug={caseSlug}
              playerCaseId={playerCaseId}
              selectedEvidenceId={selectedEvidence.id}
              manifest={manifest}
              savedDraft={savedDraft}
              latestSubmission={latestSubmission}
              submissionToken={submissionToken}
            />
          ) : null}
        </aside>
      </section>
    </div>
  );
}
