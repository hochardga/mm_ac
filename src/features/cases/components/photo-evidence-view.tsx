import { buildPhotoAssetUrl } from "@/features/cases/evidence/photo-asset-url";
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
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
      <p className="text-sm uppercase tracking-[0.3em] text-[#d96c3d]">
        Active evidence / {evidence.subtype}
      </p>
      <h2 className="mt-4 text-3xl font-semibold">{evidence.title}</h2>
      <p className="mt-3 text-sm leading-7 text-stone-300">{evidence.summary}</p>
      <div className="mt-6 space-y-6 rounded-3xl border border-white/10 bg-black/20 p-6">
        <div className="flex flex-wrap gap-6 text-xs uppercase tracking-[0.2em] text-stone-400">
          <p>Source: {evidence.sourceLabel}</p>
          <p>Date: {displayDate}</p>
        </div>
        <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-stone-950/80">
          <img
            alt={evidence.caption}
            className="h-auto w-full object-contain"
            src={imageSrc}
          />
        </div>
        <p className="text-sm leading-7 text-stone-200">{evidence.caption}</p>
      </div>
    </section>
  );
}
