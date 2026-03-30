import { buildAudioAssetUrl } from "@/features/cases/evidence/audio-asset-url";
import type { AudioEvidence } from "@/features/cases/evidence/schema";
import { EvidencePanelShell } from "@/features/cases/components/evidence-panel-shell";

type AudioEvidenceViewProps = {
  caseSlug: string;
  evidence: AudioEvidence;
};

export function AudioEvidenceView({
  caseSlug,
  evidence,
}: AudioEvidenceViewProps) {
  const audioSrc = buildAudioAssetUrl(caseSlug, evidence.audio);
  const displayDate = evidence.date ?? "Unknown";
  const durationLabel =
    evidence.durationSeconds === undefined
      ? null
      : `${evidence.durationSeconds}s`;

  return (
    <EvidencePanelShell
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
      <div className="space-y-6 rounded-3xl border border-white/10 bg-black/20 p-6">
        <audio
          aria-label="Audio playback"
          className="w-full"
          controls
          src={audioSrc}
        />
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
            Transcript
          </p>
          <p className="text-sm leading-7 text-stone-200">
            {evidence.transcript}
          </p>
        </div>
      </div>
    </EvidencePanelShell>
  );
}
