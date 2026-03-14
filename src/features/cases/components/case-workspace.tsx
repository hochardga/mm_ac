import type { notes, reportDrafts, reportSubmissions } from "@/db/schema";
import { CaseNotesPanel } from "@/features/cases/components/case-notes-panel";
import { EvidenceIndex } from "@/features/cases/components/evidence-index";
import { EvidenceViewer } from "@/features/cases/components/evidence-viewer";
import { ReportPanel } from "@/features/cases/components/report-panel";
import type { loadCaseManifest } from "@/features/cases/load-case-manifest";

type CaseManifestWithEvidence = Awaited<ReturnType<typeof loadCaseManifest>>;
type SavedNote = typeof notes.$inferSelect | undefined;
type SavedDraft = typeof reportDrafts.$inferSelect | undefined;
type LatestSubmission = typeof reportSubmissions.$inferSelect | undefined;

type CaseWorkspaceProps = {
  caseSlug: string;
  manifest: CaseManifestWithEvidence;
  playerCaseId: string;
  savedNote: SavedNote;
  savedDraft: SavedDraft;
  latestSubmission: LatestSubmission;
  submissionToken: string;
  selectedEvidenceId?: string;
};

export function CaseWorkspace({
  caseSlug,
  manifest,
  playerCaseId,
  savedNote,
  savedDraft,
  latestSubmission,
  submissionToken,
  selectedEvidenceId,
}: CaseWorkspaceProps) {
  const selectedEvidence =
    manifest.evidence.find((item) => item.id === selectedEvidenceId) ??
    manifest.evidence[0];

  if (!selectedEvidence) {
    return null;
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)_24rem]">
      <EvidenceIndex
        caseSlug={caseSlug}
        evidence={manifest.evidence}
        selectedEvidenceId={selectedEvidence.id}
      />

      <EvidenceViewer caseSlug={caseSlug} evidence={selectedEvidence} />

      <aside className="space-y-6">
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-semibold">Handler Directives</h2>
          <ul className="mt-6 space-y-4 text-sm leading-7 text-stone-300">
            {manifest.handlerPrompts.map((prompt) => (
              <li key={prompt}>{prompt}</li>
            ))}
          </ul>
        </section>

        <CaseNotesPanel
          caseSlug={caseSlug}
          playerCaseId={playerCaseId}
          savedNote={savedNote}
          selectedEvidenceTitle={selectedEvidence.title}
        />

        <ReportPanel
          caseSlug={caseSlug}
          playerCaseId={playerCaseId}
          selectedEvidenceId={selectedEvidence.id}
          manifest={manifest}
          savedDraft={savedDraft}
          latestSubmission={latestSubmission}
          submissionToken={submissionToken}
        />
      </aside>
    </section>
  );
}
