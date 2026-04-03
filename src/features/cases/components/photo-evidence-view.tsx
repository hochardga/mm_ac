import { buildPhotoAssetUrl } from "@/features/cases/evidence/photo-asset-url";
import { EvidencePanelShell } from "@/features/cases/components/evidence-panel-shell";
import type { PhotoEvidence } from "@/features/cases/evidence/schema";

type PhotoEvidenceViewProps = {
  caseSlug: string;
  evidence: PhotoEvidence;
};

type PhotoVariant = {
  frameClassName: string;
  imageClassName: string;
  label: string;
  captionClassName: string;
  overlay?: "scanlines" | "tape" | "ticks";
};

const PHOTO_VARIANTS: Record<string, PhotoVariant> = {
  scene_photo: {
    frameClassName: "bg-stone-950/85",
    imageClassName: "aspect-video object-contain",
    label: "Scene still",
    captionClassName: "text-sm leading-7 text-stone-200",
  },
  object_photo: {
    frameClassName: "bg-[#efe7d7]",
    imageClassName: "aspect-[4/3] object-cover",
    label: "Object close-up",
    captionClassName: "text-sm leading-7 text-stone-700",
  },
  surveillance_still: {
    frameClassName: "bg-stone-950/90",
    imageClassName: "aspect-video object-cover grayscale contrast-125 brightness-[0.72]",
    label: "Surveillance still",
    captionClassName: "text-sm leading-7 text-stone-300",
    overlay: "scanlines",
  },
  found_photo: {
    frameClassName: "bg-[#f0e3cf]",
    imageClassName: "aspect-[4/3] object-cover rotate-[-0.35deg]",
    label: "Recovered snapshot",
    captionClassName: "text-sm leading-7 text-stone-700",
    overlay: "tape",
  },
  portrait_mugshot: {
    frameClassName: "bg-stone-950/90",
    imageClassName: "aspect-[4/5] object-cover grayscale contrast-110",
    label: "Mugshot board",
    captionClassName: "text-sm leading-7 text-stone-300",
    overlay: "ticks",
  },
  portrait_staff_directory: {
    frameClassName: "bg-[#ece4d4]",
    imageClassName: "aspect-[4/5] object-cover",
    label: "Directory portrait",
    captionClassName: "text-sm leading-7 text-stone-700",
  },
  portrait_social: {
    frameClassName: "bg-[#f5ead8]",
    imageClassName: "aspect-[4/5] object-cover",
    label: "Recovered portrait",
    captionClassName: "text-sm leading-7 text-stone-700",
    overlay: "tape",
  },
  default: {
    frameClassName: "bg-stone-950/85",
    imageClassName: "aspect-video object-contain",
    label: "Image capture",
    captionClassName: "text-sm leading-7 text-stone-200",
  },
};

function getPhotoVariant(subtype: string) {
  return PHOTO_VARIANTS[subtype] ?? PHOTO_VARIANTS.default;
}

export function PhotoEvidenceView({
  caseSlug,
  evidence,
}: PhotoEvidenceViewProps) {
  const imageSrc = buildPhotoAssetUrl(caseSlug, evidence.image);
  const displayDate = evidence.date ?? "Unknown";
  const variant = getPhotoVariant(evidence.subtype);

  return (
    <EvidencePanelShell
      family="photo"
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
      <div className="space-y-6 rounded-3xl border border-white/10 bg-black/20 p-6">
        <figure
          className={`relative overflow-hidden rounded-[1.75rem] border border-white/10 p-2 shadow-[0_26px_60px_rgba(0,0,0,0.35)] ${variant.frameClassName}`}
          data-photo-variant={evidence.subtype}
        >
          {variant.overlay === "scanlines" ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(180deg,transparent,transparent_3px,rgba(255,255,255,0.05)_4px)] opacity-60"
            />
          ) : null}
          {variant.overlay === "tape" ? (
            <>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-3 top-6 h-10 w-20 rotate-[-7deg] bg-[#fff0bf]/80 shadow-[0_8px_20px_rgba(0,0,0,0.12)]"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-3 top-8 h-10 w-20 rotate-[8deg] bg-[#fff0bf]/75 shadow-[0_8px_20px_rgba(0,0,0,0.12)]"
              />
            </>
          ) : null}
          {variant.overlay === "ticks" ? (
            <>
              <div className="pointer-events-none absolute inset-y-4 left-4 flex w-10 flex-col justify-between text-[10px] font-semibold uppercase tracking-[0.25em] text-white/35">
                <span>180</span>
                <span>170</span>
                <span>160</span>
                <span>150</span>
              </div>
              <div className="pointer-events-none absolute inset-y-4 right-4 flex w-10 flex-col justify-between text-[10px] font-semibold uppercase tracking-[0.25em] text-white/35">
                <span>180</span>
                <span>170</span>
                <span>160</span>
                <span>150</span>
              </div>
            </>
          ) : null}
          <div className="relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-black/40">
            <img
              alt={evidence.caption}
              className={`h-auto w-full ${variant.imageClassName}`}
              decoding="async"
              src={imageSrc}
            />
          </div>
        </figure>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.22em] text-stone-400">
            {variant.label}
          </p>
          <p className={variant.captionClassName}>{evidence.caption}</p>
        </div>
      </div>
    </EvidencePanelShell>
  );
}
