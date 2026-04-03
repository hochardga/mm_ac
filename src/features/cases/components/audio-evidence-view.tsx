import { buildAudioAssetUrl } from "@/features/cases/evidence/audio-asset-url";
import type { AudioEvidence } from "@/features/cases/evidence/schema";
import { EvidencePanelShell } from "@/features/cases/components/evidence-panel-shell";

type AudioEvidenceViewProps = {
  caseSlug: string;
  evidence: AudioEvidence;
};

type AudioVariant = {
  deckClassName: string;
  meterClassName: string;
  transcriptLabel: string;
  transcriptClassName: string;
};

const AUDIO_VARIANTS: Record<string, AudioVariant> = {
  voicemail: {
    deckClassName: "border-amber-200/10 bg-[#17130f]",
    meterClassName: "bg-amber-300/80",
    transcriptLabel: "Voicemail transcript",
    transcriptClassName: "space-y-2 text-sm leading-7 text-stone-200",
  },
  interview_audio: {
    deckClassName: "border-sky-200/10 bg-[#10151d]",
    meterClassName: "bg-sky-300/80",
    transcriptLabel: "Interview transcript",
    transcriptClassName: "space-y-2 text-sm leading-7 text-stone-200",
  },
  dispatch_audio: {
    deckClassName: "border-cyan-200/10 bg-[#0f1718]",
    meterClassName: "bg-cyan-300/80",
    transcriptLabel: "Dispatch transcript",
    transcriptClassName: "space-y-2 text-sm leading-7 text-stone-200",
  },
  radio_call: {
    deckClassName: "border-violet-200/10 bg-[#171320]",
    meterClassName: "bg-violet-300/80",
    transcriptLabel: "Radio call transcript",
    transcriptClassName: "space-y-2 text-sm leading-7 text-stone-200",
  },
  confession_audio: {
    deckClassName: "border-rose-200/10 bg-[#1c1014]",
    meterClassName: "bg-rose-300/80",
    transcriptLabel: "Sensitive transcript",
    transcriptClassName: "space-y-2 text-sm leading-7 text-rose-50",
  },
  default: {
    deckClassName: "border-white/10 bg-black/25",
    meterClassName: "bg-stone-200/80",
    transcriptLabel: "Transcript",
    transcriptClassName: "space-y-2 text-sm leading-7 text-stone-200",
  },
};

const WAVEFORM_BARS = [
  26, 42, 18, 34, 52, 24, 62, 31, 48, 22, 58, 30, 40, 16, 54, 28, 44, 20,
];

function getAudioVariant(subtype: string) {
  return AUDIO_VARIANTS[subtype] ?? AUDIO_VARIANTS.default;
}

function formatDuration(seconds: number) {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}m ${remainingSeconds}s`;
  }

  const hours = Math.floor(seconds / 3600);
  const remainingMinutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
}

export function AudioEvidenceView({
  caseSlug,
  evidence,
}: AudioEvidenceViewProps) {
  const audioSrc = buildAudioAssetUrl(caseSlug, evidence.audio);
  const displayDate = evidence.date ?? "Unknown";
  const durationLabel =
    evidence.durationSeconds === undefined
      ? null
      : formatDuration(evidence.durationSeconds);
  const variant = getAudioVariant(evidence.subtype);

  return (
    <EvidencePanelShell
      family="audio"
      subtype={evidence.subtype}
      title={evidence.title}
      summary={evidence.summary}
      metadata={
        <>
          <p>Source: {evidence.sourceLabel}</p>
          <p>Date: {displayDate}</p>
          {durationLabel ? <p>Duration: {durationLabel}</p> : null}
        </>
      }
    >
      <div
        className={`space-y-6 rounded-3xl border p-6 shadow-[0_26px_70px_rgba(0,0,0,0.35)] ${variant.deckClassName}`}
        data-audio-variant={evidence.subtype}
      >
        <section className="rounded-[1.5rem] border border-white/10 bg-black/30 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.24em] text-stone-400">
                {variant.transcriptLabel}
              </p>
              <p className="text-sm leading-6 text-stone-300">
                {evidence.sourceLabel}
              </p>
            </div>
            {durationLabel ? (
              <p className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-stone-200">
                {durationLabel}
              </p>
            ) : null}
          </div>

          <div className="mt-4 flex items-end gap-1.5" aria-hidden="true">
            {WAVEFORM_BARS.map((barHeight, index) => (
              <span
                key={`${evidence.id}-waveform-${index}`}
                className={`w-2 rounded-full ${variant.meterClassName}`}
                style={{ height: `${barHeight}px` }}
              />
            ))}
          </div>

          <audio
            aria-label="Audio playback"
            className="mt-5 w-full"
            controls
            src={audioSrc}
          />
        </section>

        <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-stone-400">
            Transcript
          </p>
          <div className={`mt-3 ${variant.transcriptClassName}`}>
            <p>{evidence.transcript}</p>
          </div>
        </section>
      </div>
    </EvidencePanelShell>
  );
}
