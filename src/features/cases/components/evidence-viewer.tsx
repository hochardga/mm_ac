import type { CaseEvidence } from "@/features/cases/evidence/schema";

type EvidenceViewerProps = {
  evidence: CaseEvidence;
};

export function EvidenceViewer({ evidence }: EvidenceViewerProps) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
      <p className="text-sm uppercase tracking-[0.3em] text-[#d96c3d]">
        Active evidence / {evidence.subtype}
      </p>
      <h2 className="mt-4 text-3xl font-semibold">{evidence.title}</h2>
      <p className="mt-3 text-sm leading-7 text-stone-300">{evidence.summary}</p>

      {evidence.family === "document" ? (
        <div className="mt-6 space-y-4 rounded-3xl border border-white/10 bg-black/20 p-6">
          <div className="grid gap-2 text-xs uppercase tracking-[0.2em] text-stone-400">
            {Object.entries(evidence.meta).map(([key, value]) => (
              <p key={key}>
                {key}: {String(value)}
              </p>
            ))}
          </div>
          <div className="whitespace-pre-wrap text-sm leading-7 text-stone-200">
            {evidence.body}
          </div>
        </div>
      ) : null}

      {evidence.family === "record" ? (
        <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-black/20">
          <table className="min-w-full text-left text-sm text-stone-200">
            <thead className="bg-white/5 text-xs uppercase tracking-[0.2em] text-stone-400">
              <tr>
                {evidence.columns.map((column) => (
                  <th key={column.id} className="px-4 py-3 font-medium">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {evidence.rows.map((row) => (
                <tr key={row.id} className="border-t border-white/10">
                  {evidence.columns.map((column) => (
                    <td key={column.id} className="px-4 py-3 align-top">
                      {String(row[column.id] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {evidence.family === "thread" ? (
        <div className="mt-6 space-y-4 rounded-3xl border border-white/10 bg-black/20 p-6">
          <div className="space-y-1 border-b border-white/10 pb-4">
            <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
              {evidence.thread.channel ?? "Thread"}
            </p>
            <p className="text-lg font-medium text-stone-50">
              {evidence.thread.subject}
            </p>
          </div>
          <div className="space-y-4">
            {evidence.messages.map((message) => (
              <article
                key={message.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-[0.2em] text-stone-400">
                  <span>{message.sender}</span>
                  <span>{message.timestamp}</span>
                </div>
                <p className="mt-3 text-sm leading-7 text-stone-200">
                  {message.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
