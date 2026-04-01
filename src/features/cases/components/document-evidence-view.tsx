import { EvidencePanelShell } from "@/features/cases/components/evidence-panel-shell";
import { MarkdownContent } from "@/features/cases/components/markdown-content";
import type { DocumentEvidence } from "@/features/cases/evidence/schema";

type DocumentEvidenceViewProps = {
  evidence: DocumentEvidence;
};

export function DocumentEvidenceView({
  evidence,
}: DocumentEvidenceViewProps) {
  const metadataEntries = Object.entries(evidence.meta);

  return (
    <EvidencePanelShell
      metadata={
        metadataEntries.length > 0 ? (
          <>
            {metadataEntries.map(([key, value]) => (
              <p key={key}>
                {key}: {String(value)}
              </p>
            ))}
          </>
        ) : undefined
      }
      subtype={evidence.subtype}
      summary={evidence.summary}
      title={evidence.title}
    >
      <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-6">
        <MarkdownContent content={evidence.body} />
      </div>
    </EvidencePanelShell>
  );
}
