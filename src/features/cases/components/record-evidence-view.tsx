import type { RecordEvidence } from "@/features/cases/evidence/schema";
import { RecordTable } from "@/features/cases/components/record-table";

type RecordEvidenceViewProps = {
  evidence: RecordEvidence;
};

export function RecordEvidenceView({ evidence }: RecordEvidenceViewProps) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
      <p className="text-sm uppercase tracking-[0.3em] text-[#d96c3d]">
        Active evidence / {evidence.subtype}
      </p>
      <h2 className="mt-4 text-3xl font-semibold">{evidence.title}</h2>
      <p className="mt-3 text-sm leading-7 text-stone-300">{evidence.summary}</p>
      <div className="mt-6">
        <RecordTable columns={evidence.columns} rows={evidence.rows} />
      </div>
    </section>
  );
}
