import { EvidenceBookmarkButton } from "@/features/cases/components/evidence-bookmark-button";
import type { CaseEvidence } from "@/features/cases/evidence/schema";
import { DocumentEvidenceView } from "@/features/cases/components/document-evidence-view";
import { PhotoEvidenceView } from "@/features/cases/components/photo-evidence-view";
import { RecordEvidenceView } from "@/features/cases/components/record-evidence-view";
import { ThreadEvidenceView } from "@/features/cases/components/thread-evidence-view";

type EvidenceViewerProps = {
  caseSlug: string;
  playerCaseId: string;
  evidence: CaseEvidence;
  selectedEvidenceId: string;
  bookmarkedEvidenceIds: string[];
};

export function EvidenceViewer({
  caseSlug,
  playerCaseId,
  evidence,
  selectedEvidenceId,
  bookmarkedEvidenceIds,
}: EvidenceViewerProps) {
  const bookmarked = bookmarkedEvidenceIds.includes(evidence.id);

  return (
    <div className="space-y-4">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#f0b48f]">
              Investigation board
            </p>
            <h2 className="mt-3 text-2xl font-semibold">
              {bookmarked ? "Pinned Evidence" : "Pin Active Evidence"}
            </h2>
            <p className="mt-3 text-sm leading-7 text-stone-300">
              Keep this artifact close while you cross-reference notes,
              objectives, and report work.
            </p>
          </div>
          <EvidenceBookmarkButton
            bookmarked={bookmarked}
            caseSlug={caseSlug}
            evidenceId={evidence.id}
            playerCaseId={playerCaseId}
            selectedEvidenceId={selectedEvidenceId}
          />
        </div>
      </section>

      {renderEvidenceView(caseSlug, evidence)}
    </div>
  );
}

function renderEvidenceView(caseSlug: string, evidence: CaseEvidence) {
  switch (evidence.family) {
    case "document":
      return <DocumentEvidenceView evidence={evidence} />;
    case "photo":
      return <PhotoEvidenceView caseSlug={caseSlug} evidence={evidence} />;
    case "record":
      return <RecordEvidenceView evidence={evidence} />;
    case "thread":
      return <ThreadEvidenceView evidence={evidence} />;
  }
}
