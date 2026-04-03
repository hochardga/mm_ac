import { EvidencePanelShell } from "@/features/cases/components/evidence-panel-shell";
import type { ThreadEvidence } from "@/features/cases/evidence/schema";

type ThreadEvidenceViewProps = {
  evidence: ThreadEvidence;
};

type ThreadVariant = {
  label: string;
  containerClassName: string;
  messageClassName: string;
  railClassName: string;
  messageLabelClassName: string;
  transcriptMode: boolean;
};

const THREAD_VARIANTS: Record<string, ThreadVariant> = {
  handler_message: {
    label: "Handler relay",
    containerClassName: "border-sky-200/10 bg-[#111722]",
    messageClassName: "border-white/10 bg-white/5",
    railClassName: "bg-sky-300/65",
    messageLabelClassName: "text-stone-300",
    transcriptMode: false,
  },
  interview_thread: {
    label: "Interview transcript",
    containerClassName: "border-amber-200/10 bg-[#191412]",
    messageClassName: "border-white/10 bg-white/5",
    railClassName: "bg-amber-300/65",
    messageLabelClassName: "text-stone-300",
    transcriptMode: true,
  },
  message_log: {
    label: "Message log",
    containerClassName: "border-emerald-200/10 bg-[#101815]",
    messageClassName: "border-white/10 bg-black/20",
    railClassName: "bg-emerald-300/65",
    messageLabelClassName: "text-stone-300",
    transcriptMode: false,
  },
  default: {
    label: "Conversation",
    containerClassName: "border-white/10 bg-black/20",
    messageClassName: "border-white/10 bg-white/5",
    railClassName: "bg-white/20",
    messageLabelClassName: "text-stone-400",
    transcriptMode: false,
  },
};

function getThreadVariant(subtype: string) {
  return THREAD_VARIANTS[subtype] ?? THREAD_VARIANTS.default;
}

export function ThreadEvidenceView({ evidence }: ThreadEvidenceViewProps) {
  const participants = evidence.thread.participants?.join(", ");
  const variant = getThreadVariant(evidence.subtype);

  return (
    <EvidencePanelShell
      family="thread"
      metadata={
        <>
          <p>Channel: {evidence.thread.channel ?? "Thread"}</p>
          {participants ? <p>Participants: {participants}</p> : null}
        </>
      }
      subtype={evidence.subtype}
      summary={evidence.summary}
      title={evidence.title}
    >
      <div
        className={`space-y-4 rounded-3xl border p-6 shadow-[0_24px_70px_rgba(0,0,0,0.32)] ${variant.containerClassName}`}
        data-thread-variant={evidence.subtype}
      >
        <div className="space-y-1 border-b border-white/10 pb-4">
          <p className="text-lg font-medium text-stone-50">
            {evidence.thread.subject}
          </p>
          <p className="text-xs uppercase tracking-[0.24em] text-stone-400">
            {variant.label}
          </p>
        </div>

        <div className="space-y-4">
          {evidence.messages.map((message, index) => (
            <article
              key={message.id}
              className={`relative rounded-2xl border p-4 ${variant.messageClassName}`}
            >
              <span
                aria-hidden="true"
                className={`absolute bottom-4 left-0 top-4 w-1 rounded-full ${variant.railClassName}`}
              />
              <div className="pl-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-[0.2em]">
                  <span className={variant.messageLabelClassName}>
                    {variant.transcriptMode ? "Speaker" : message.sender}
                  </span>
                  <span className="text-stone-400">{message.timestamp}</span>
                </div>
                <p className="mt-3 text-sm leading-7 text-stone-200">
                  {variant.transcriptMode ? `${message.sender}: ${message.body}` : message.body}
                </p>
                {variant.transcriptMode ? (
                  <p className="mt-2 text-[10px] uppercase tracking-[0.24em] text-stone-500">
                    Turn {index + 1}
                  </p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </EvidencePanelShell>
  );
}
