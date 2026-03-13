import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { DocumentEvidence } from "@/features/cases/evidence/schema";

type DocumentEvidenceViewProps = {
  evidence: DocumentEvidence;
};

export function DocumentEvidenceView({
  evidence,
}: DocumentEvidenceViewProps) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
      <p className="text-sm uppercase tracking-[0.3em] text-[#d96c3d]">
        Active evidence / {evidence.subtype}
      </p>
      <h2 className="mt-4 text-3xl font-semibold">{evidence.title}</h2>
      <p className="mt-3 text-sm leading-7 text-stone-300">{evidence.summary}</p>
      <div className="mt-6 space-y-4 rounded-3xl border border-white/10 bg-black/20 p-6">
        <div className="grid gap-2 text-xs uppercase tracking-[0.2em] text-stone-400">
          {Object.entries(evidence.meta).map(([key, value]) => (
            <p key={key}>
              {key}: {String(value)}
            </p>
          ))}
        </div>
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
    </section>
  );
}
