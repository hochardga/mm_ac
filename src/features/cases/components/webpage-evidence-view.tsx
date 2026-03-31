import type { WebpageBlock, WebpageEvidence } from "@/features/cases/evidence/schema";
import { EvidencePanelShell } from "@/features/cases/components/evidence-panel-shell";

type WebpageEvidenceViewProps = {
  evidence: WebpageEvidence;
};

export function WebpageEvidenceView({ evidence }: WebpageEvidenceViewProps) {
  return (
    <EvidencePanelShell
      subtype={evidence.subtype}
      title={evidence.title}
      summary={evidence.summary}
      metadata={
        <>
          <p>{evidence.page.urlLabel ?? evidence.page.title}</p>
          {evidence.page.sourceLabel ? <p>Source: {evidence.page.sourceLabel}</p> : null}
        </>
      }
    >
      <div className="space-y-6 rounded-3xl border border-white/10 bg-black/20 p-6">
        <div className="space-y-1 border-b border-white/10 pb-4">
          <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
            In-world snapshot
          </p>
          <p className="text-lg font-medium text-stone-50">
            {evidence.page.title}
          </p>
        </div>
        <div className="space-y-4">
          {evidence.blocks.map((block) => (
            <WebpageBlockView key={block.id} block={block} />
          ))}
        </div>
      </div>
    </EvidencePanelShell>
  );
}

function WebpageBlockView({ block }: { block: WebpageBlock }) {
  switch (block.type) {
    case "hero":
      return (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-lg font-semibold text-stone-50">{block.heading}</h3>
          <p className="mt-2 text-sm leading-7 text-stone-200">{block.body}</p>
        </section>
      );
    case "notice":
      return (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          {block.heading ? (
            <h3 className="text-lg font-semibold text-stone-50">{block.heading}</h3>
          ) : null}
          <p className="mt-2 text-sm leading-7 text-stone-200">{block.body}</p>
        </section>
      );
    case "list":
      return (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          {block.heading ? (
            <h3 className="text-lg font-semibold text-stone-50">{block.heading}</h3>
          ) : null}
          <ul className="mt-3 space-y-2 text-sm leading-7 text-stone-200">
            {block.items.map((item, index) => (
              <li key={`${block.id}-${item}-${index}`}>{item}</li>
            ))}
          </ul>
        </section>
      );
    case "table":
      return (
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <table className="w-full text-left text-sm text-stone-200">
            <thead className="bg-white/5 text-xs uppercase tracking-[0.2em] text-stone-400">
              <tr>
                {block.columns.map((column) => (
                  <th key={column} className="px-4 py-3">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, index) => (
                <tr key={`${block.id}-${index}`} className="border-t border-white/10">
                  {row.map((cell, cellIndex) => (
                    <td key={`${block.id}-${index}-${cellIndex}`} className="px-4 py-3">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      );
    case "posts":
    case "directory":
      return (
        <section className="grid gap-3">
          {block.items.map((item, index) => (
            <article
              key={`${block.id}-${item.title}-${index}`}
              className="rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <h3 className="text-lg font-semibold text-stone-50">{item.title}</h3>
              {item.meta ? (
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-stone-400">
                  {item.meta}
                </p>
              ) : null}
              <p className="mt-2 text-sm leading-7 text-stone-200">{item.body}</p>
            </article>
          ))}
        </section>
      );
  }
}
