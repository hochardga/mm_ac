import Link from "next/link";

import type { CaseEvidence } from "@/features/cases/evidence/schema";

type EvidenceIndexProps = {
  caseSlug: string;
  evidence: CaseEvidence[];
  selectedEvidenceId?: string;
  newEvidenceIds?: string[];
};

export function EvidenceIndex({
  caseSlug,
  evidence,
  selectedEvidenceId,
  newEvidenceIds = [],
}: EvidenceIndexProps) {
  return (
    <section
      className="rounded-[2rem] border border-white/10 bg-white/5 p-6"
      id="evidence-intake"
    >
      <h2 className="text-2xl font-semibold">Evidence Intake</h2>
      <div className="mt-6 grid gap-4">
        {evidence.map((item) => {
          const isSelected = item.id === selectedEvidenceId;
          const isNew = newEvidenceIds.includes(item.id);

          return (
            <article
              key={item.id}
              className={`rounded-3xl border p-5 ${
                isSelected
                  ? "border-[#d96c3d] bg-[#d96c3d]/10"
                  : "border-white/10 bg-black/20"
              } scroll-mt-6`}
              id={`evidence-${item.id}`}
            >
              <p className="text-xs uppercase tracking-[0.25em] text-[#d96c3d]">
                {item.family} / {item.subtype}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h3 className="text-xl font-medium">{item.title}</h3>
                {isNew ? (
                  <span className="rounded-full border border-[#d96c3d]/40 bg-[#d96c3d]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f0b48f]">
                    New
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-sm leading-7 text-stone-300">
                {item.summary}
              </p>
              <Link
                aria-current={isSelected ? "page" : undefined}
                aria-label={`${isSelected ? "Viewing" : "Open"} ${item.title}`}
                className="mt-4 inline-flex rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-50"
                href={`/cases/${caseSlug}?evidence=${encodeURIComponent(item.id)}`}
              >
                {isSelected ? "Viewing Evidence" : "Open Evidence"}
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
