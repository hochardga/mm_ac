import Link from "next/link";

import type { CaseEvidence } from "@/features/cases/evidence/schema";

type EvidenceIndexProps = {
  caseSlug: string;
  evidence: CaseEvidence[];
  selectedEvidenceId: string;
};

export function EvidenceIndex({
  caseSlug,
  evidence,
  selectedEvidenceId,
}: EvidenceIndexProps) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
      <h2 className="text-2xl font-semibold">Evidence Intake</h2>
      <div className="mt-6 grid gap-4">
        {evidence.map((item) => {
          const isSelected = item.id === selectedEvidenceId;

          return (
            <article
              key={item.id}
              className={`rounded-3xl border p-5 ${
                isSelected
                  ? "border-[#d96c3d] bg-[#d96c3d]/10"
                  : "border-white/10 bg-black/20"
              }`}
            >
              <p className="text-xs uppercase tracking-[0.25em] text-[#d96c3d]">
                {item.family} / {item.subtype}
              </p>
              <h3 className="mt-3 text-xl font-medium">{item.title}</h3>
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
