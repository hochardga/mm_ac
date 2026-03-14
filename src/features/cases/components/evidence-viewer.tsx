import type { CaseEvidence } from "@/features/cases/evidence/schema";
import { DocumentEvidenceView } from "@/features/cases/components/document-evidence-view";
import { PhotoEvidenceView } from "@/features/cases/components/photo-evidence-view";
import { RecordEvidenceView } from "@/features/cases/components/record-evidence-view";
import { ThreadEvidenceView } from "@/features/cases/components/thread-evidence-view";

type EvidenceViewerProps = {
  caseSlug: string;
  evidence: CaseEvidence;
};

export function EvidenceViewer({ caseSlug, evidence }: EvidenceViewerProps) {
  switch (evidence.family) {
    case "document":
      return <DocumentEvidenceView evidence={evidence} />;
    case "photo":
      return <PhotoEvidenceView caseSlug={caseSlug} evidence={evidence} />;
    case "record":
      return <RecordEvidenceView evidence={evidence} />;
    case "thread":
      return <ThreadEvidenceView evidence={evidence} />;
  }
}
