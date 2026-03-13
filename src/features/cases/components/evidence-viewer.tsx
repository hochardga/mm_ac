import type { CaseEvidence } from "@/features/cases/evidence/schema";
import { DocumentEvidenceView } from "@/features/cases/components/document-evidence-view";
import { RecordEvidenceView } from "@/features/cases/components/record-evidence-view";
import { ThreadEvidenceView } from "@/features/cases/components/thread-evidence-view";

type EvidenceViewerProps = {
  evidence: CaseEvidence;
};

export function EvidenceViewer({ evidence }: EvidenceViewerProps) {
  switch (evidence.family) {
    case "document":
      return <DocumentEvidenceView evidence={evidence} />;
    case "record":
      return <RecordEvidenceView evidence={evidence} />;
    case "thread":
      return <ThreadEvidenceView evidence={evidence} />;
  }
}
