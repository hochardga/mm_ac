import type { notes, reportDrafts } from "@/db/schema";
import { saveNoteAction, saveReportDraftAction, submitReportAction } from "@/app/(app)/cases/[caseSlug]/actions";
import { EvidenceIndex } from "@/features/cases/components/evidence-index";
import { EvidenceViewer } from "@/features/cases/components/evidence-viewer";
import type { loadCaseManifest } from "@/features/cases/load-case-manifest";

type CaseManifestWithEvidence = Awaited<ReturnType<typeof loadCaseManifest>>;
type SavedNote = typeof notes.$inferSelect | undefined;
type SavedDraft = typeof reportDrafts.$inferSelect | undefined;

type CaseWorkspaceProps = {
  caseSlug: string;
  manifest: CaseManifestWithEvidence;
  playerCaseId: string;
  savedNote: SavedNote;
  savedDraft: SavedDraft;
  submissionToken: string;
  selectedEvidenceId?: string;
};

export function CaseWorkspace({
  caseSlug,
  manifest,
  playerCaseId,
  savedNote,
  savedDraft,
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

      <EvidenceViewer evidence={selectedEvidence} />

      <aside className="space-y-6">
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-semibold">Handler Directives</h2>
          <ul className="mt-6 space-y-4 text-sm leading-7 text-stone-300">
            {manifest.handlerPrompts.map((prompt) => (
              <li key={prompt}>{prompt}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-semibold">Field Notes</h2>
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-stone-400">
            Active evidence: {selectedEvidence.title}
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

        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-semibold">Draft Report</h2>
          <form action={saveReportDraftAction} className="mt-6 grid gap-4">
            <input name="caseSlug" type="hidden" value={caseSlug} />
            <input name="playerCaseId" type="hidden" value={playerCaseId} />
            <input name="submissionToken" type="hidden" value={submissionToken} />

            <label className="grid gap-2">
              <span className="text-sm uppercase tracking-[0.2em] text-stone-400">
                Suspect
              </span>
              <select
                className="rounded-full border border-white/10 bg-black/20 px-4 py-3 text-sm text-stone-100"
                defaultValue={savedDraft?.suspectId ?? ""}
                name="suspectId"
              >
                <option value="">Select suspect</option>
                {manifest.reportOptions.suspect.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm uppercase tracking-[0.2em] text-stone-400">
                Motive
              </span>
              <select
                className="rounded-full border border-white/10 bg-black/20 px-4 py-3 text-sm text-stone-100"
                defaultValue={savedDraft?.motiveId ?? ""}
                name="motiveId"
              >
                <option value="">Select motive</option>
                {manifest.reportOptions.motive.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm uppercase tracking-[0.2em] text-stone-400">
                Method
              </span>
              <select
                className="rounded-full border border-white/10 bg-black/20 px-4 py-3 text-sm text-stone-100"
                defaultValue={savedDraft?.methodId ?? ""}
                name="methodId"
              >
                <option value="">Select method</option>
                {manifest.reportOptions.method.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                className="w-fit rounded-full bg-[#d96c3d] px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-stone-950"
                type="submit"
              >
                Save Draft
              </button>
              <button
                className="w-fit rounded-full border border-white/20 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-stone-50"
                formAction={submitReportAction}
                type="submit"
              >
                Submit Report
              </button>
            </div>
          </form>
        </section>
      </aside>
    </section>
  );
}
