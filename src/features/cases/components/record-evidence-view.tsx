import { EvidencePanelShell } from "@/features/cases/components/evidence-panel-shell";
import type { RecordEvidence } from "@/features/cases/evidence/schema";
import { RecordTable } from "@/features/cases/components/record-table";

type RecordEvidenceViewProps = {
  evidence: RecordEvidence;
};

export function RecordEvidenceView({ evidence }: RecordEvidenceViewProps) {
  return (
    <EvidencePanelShell
      metadata={
        <>
          <p>Rows: {evidence.rows.length}</p>
          <p>Columns: {evidence.columns.length}</p>
        </>
      }
      subtype={evidence.subtype}
      summary={evidence.summary}
      title={evidence.title}
    >
      <div className="mt-6">
        <RecordTable columns={evidence.columns} rows={evidence.rows} />
      </div>
    </EvidencePanelShell>
  );
}
