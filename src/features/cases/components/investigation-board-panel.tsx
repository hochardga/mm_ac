import Link from "next/link";

import type { CaseEvidence } from "@/features/cases/evidence/schema";

type InvestigationBoardPanelProps = {
  caseSlug: string;
  evidence: CaseEvidence[];
  selectedEvidenceId?: string;
};

export function InvestigationBoardPanel({
  caseSlug,
  evidence,
  selectedEvidenceId,
}: InvestigationBoardPanelProps) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-[#f0b48f]">
            Investigation shortlist
          </p>
          <h2 className="mt-3 text-2xl font-semibold">Investigation Board</h2>
        </div>
        <p className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-stone-300">
          {evidence.length} pinned
        </p>
      </div>

      {evidence.length === 0 ? (
        <p className="mt-6 text-sm leading-7 text-stone-300">
          Pin evidence from the active viewer to keep a shortlist of the
          artifacts you want close at hand.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {evidence.map((item) => {
            const isSelected = item.id === selectedEvidenceId;

            return (
              <article
                key={item.id}
                className={`rounded-[1.5rem] border p-5 ${
                  isSelected
                    ? "border-[#d96c3d]/50 bg-[#d96c3d]/10"
                    : "border-white/10 bg-black/20"
                }`}
              >
                <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                  {item.family} / {item.subtype}
                </p>
                <h3 className="mt-3 text-lg font-semibold text-stone-50">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-stone-300">
                  {item.summary}
                </p>
                <Link
                  aria-current={isSelected ? "page" : undefined}
                  aria-label={`Open evidence ${item.title}`}
                  className="mt-4 inline-flex rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-50"
                  href={`/cases/${caseSlug}?evidence=${encodeURIComponent(item.id)}`}
                >
                  {isSelected ? "Viewing Evidence" : "Open Evidence"}
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
