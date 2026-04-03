import { EvidencePanelShell } from "@/features/cases/components/evidence-panel-shell";
import { RecordTimelineView } from "@/features/cases/components/record-timeline-view";
import { RecordTable } from "@/features/cases/components/record-table";
import type { RecordEvidence } from "@/features/cases/evidence/schema";

type RecordEvidenceViewProps = {
  evidence: RecordEvidence;
};

function isTimelineSubtype(subtype: string) {
  return subtype === "timeline";
}

export function RecordEvidenceView({ evidence }: RecordEvidenceViewProps) {
  const useTimelineLayout = isTimelineSubtype(evidence.subtype);

  return (
    <EvidencePanelShell
      family="record"
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
        {useTimelineLayout ? (
          <RecordTimelineView columns={evidence.columns} rows={evidence.rows} />
        ) : (
          <RecordTable columns={evidence.columns} rows={evidence.rows} />
        )}
      </div>
    </EvidencePanelShell>
  );
}
