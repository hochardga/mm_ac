import type { ThreadEvidence } from "@/features/cases/evidence/schema";

type ThreadEvidenceViewProps = {
  evidence: ThreadEvidence;
};

export function ThreadEvidenceView({ evidence }: ThreadEvidenceViewProps) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
      <p className="text-sm uppercase tracking-[0.3em] text-[#d96c3d]">
        Active evidence / {evidence.subtype}
      </p>
      <h2 className="mt-4 text-3xl font-semibold">{evidence.title}</h2>
      <p className="mt-3 text-sm leading-7 text-stone-300">{evidence.summary}</p>
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
    </section>
  );
}
