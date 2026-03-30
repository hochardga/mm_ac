import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { EvidencePanelShell } from "@/features/cases/components/evidence-panel-shell";
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
      <div className="mt-6 space-y-4 rounded-3xl border border-white/10 bg-black/20 p-6">
        <div className="prose prose-invert max-w-none text-sm leading-7">
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h3 className="text-xl font-semibold text-stone-50">{children}</h3>
              ),
              h2: ({ children }) => (
                <h4 className="text-lg font-semibold text-stone-50">{children}</h4>
              ),
              h3: ({ children }) => (
                <h5 className="text-base font-semibold text-stone-50">{children}</h5>
              ),
            }}
            remarkPlugins={[remarkGfm]}
          >
            {evidence.body}
          </ReactMarkdown>
        </div>
      </div>
    </EvidencePanelShell>
  );
}
