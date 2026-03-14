import { toggleEvidenceBookmarkAction } from "@/app/(app)/cases/[caseSlug]/actions";

type EvidenceBookmarkButtonProps = {
  caseSlug: string;
  playerCaseId: string;
  evidenceId: string;
  selectedEvidenceId: string;
  bookmarked: boolean;
};

export function EvidenceBookmarkButton({
  caseSlug,
  playerCaseId,
  evidenceId,
  selectedEvidenceId,
  bookmarked,
}: EvidenceBookmarkButtonProps) {
  return (
    <form action={toggleEvidenceBookmarkAction}>
      <input name="caseSlug" type="hidden" value={caseSlug} />
      <input name="playerCaseId" type="hidden" value={playerCaseId} />
      <input name="evidenceId" type="hidden" value={evidenceId} />
      <input name="selectedEvidenceId" type="hidden" value={selectedEvidenceId} />
      <button
        className={`rounded-full px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] ${
          bookmarked
            ? "border border-white/20 text-stone-50"
            : "bg-[#d96c3d] text-stone-950"
        }`}
        type="submit"
      >
        {bookmarked ? "Remove from Board" : "Pin to Board"}
      </button>
    </form>
  );
}
