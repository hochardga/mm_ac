import { buildPhotoAssetUrl } from "@/features/cases/evidence/photo-asset-url";
import { EvidencePanelShell } from "@/features/cases/components/evidence-panel-shell";
import type { PhotoEvidence } from "@/features/cases/evidence/schema";

type PhotoEvidenceViewProps = {
  caseSlug: string;
  evidence: PhotoEvidence;
};

export function PhotoEvidenceView({
  caseSlug,
  evidence,
}: PhotoEvidenceViewProps) {
  const imageSrc = buildPhotoAssetUrl(caseSlug, evidence.image);
  const displayDate = evidence.date ?? "Unknown";

  return (
    <EvidencePanelShell
      metadata={
        <>
          <p>Source: {evidence.sourceLabel}</p>
          <p>Date: {displayDate}</p>
        </>
      }
      subtype={evidence.subtype}
      summary={evidence.summary}
      title={evidence.title}
    >
      <div className="mt-6 space-y-6 rounded-3xl border border-white/10 bg-black/20 p-6">
        <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-stone-950/80">
          <img
            alt={evidence.caption}
            className="h-auto w-full object-contain"
            src={imageSrc}
          />
        </div>
        <p className="text-sm leading-7 text-stone-200">{evidence.caption}</p>
      </div>
    </EvidencePanelShell>
  );
}
