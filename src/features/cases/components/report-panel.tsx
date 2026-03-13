import type { reportDrafts } from "@/db/schema";
import { saveReportDraftAction, submitReportAction } from "@/app/(app)/cases/[caseSlug]/actions";
import type { loadCaseManifest } from "@/features/cases/load-case-manifest";

type CaseManifestWithEvidence = Awaited<ReturnType<typeof loadCaseManifest>>;
type SavedDraft = typeof reportDrafts.$inferSelect | undefined;

type ReportPanelProps = {
  caseSlug: string;
  playerCaseId: string;
  selectedEvidenceId?: string;
  manifest: CaseManifestWithEvidence;
  savedDraft: SavedDraft;
  submissionToken: string;
};

export function ReportPanel({
  caseSlug,
  playerCaseId,
  selectedEvidenceId,
  manifest,
  savedDraft,
  submissionToken,
}: ReportPanelProps) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
      <h2 className="text-2xl font-semibold">Draft Report</h2>
      <form action={saveReportDraftAction} className="mt-6 grid gap-4">
        <input name="caseSlug" type="hidden" value={caseSlug} />
        <input name="playerCaseId" type="hidden" value={playerCaseId} />
        <input name="submissionToken" type="hidden" value={submissionToken} />
        <input
          name="selectedEvidenceId"
          type="hidden"
          value={selectedEvidenceId ?? ""}
        />

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
  );
}
