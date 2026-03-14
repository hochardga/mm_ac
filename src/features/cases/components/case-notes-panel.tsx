import type { notes } from "@/db/schema";
import { saveNoteAction } from "@/app/(app)/cases/[caseSlug]/actions";

type SavedNote = typeof notes.$inferSelect | undefined;

type CaseNotesPanelProps = {
  caseSlug: string;
  playerCaseId: string;
  savedNote: SavedNote;
  selectedEvidenceTitle: string;
};

export function CaseNotesPanel({
  caseSlug,
  playerCaseId,
  savedNote,
  selectedEvidenceTitle,
}: CaseNotesPanelProps) {
  return (
    <section
      className="rounded-[2rem] border border-white/10 bg-white/5 p-6"
      id="field-notes"
    >
      <h2 className="text-2xl font-semibold">Field Notes</h2>
      <p className="mt-3 text-xs uppercase tracking-[0.2em] text-stone-400">
        Active evidence: {selectedEvidenceTitle}
      </p>
      <form action={saveNoteAction} className="mt-6 grid gap-4">
        <input name="caseSlug" type="hidden" value={caseSlug} />
        <input name="playerCaseId" type="hidden" value={playerCaseId} />
        <label className="grid gap-2">
          <span className="text-sm uppercase tracking-[0.2em] text-stone-400">
            Field Notes
          </span>
          <textarea
            className="min-h-36 rounded-3xl border border-white/10 bg-black/20 px-4 py-4 text-sm leading-7 text-stone-100"
            defaultValue={savedNote?.body ?? ""}
            name="body"
          />
        </label>
        <button
          className="w-fit rounded-full bg-white px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-stone-950"
          type="submit"
        >
          Save Notes
        </button>
      </form>
    </section>
  );
}
