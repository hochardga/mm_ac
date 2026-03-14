"use client";

import { useState } from "react";

import { buildPhotoAssetUrl } from "@/features/cases/evidence/photo-asset";
import type { PhotoEvidence } from "@/features/cases/evidence/schema";

type PhotoEvidenceViewProps = {
  caseSlug: string;
  evidence: PhotoEvidence;
};

export function PhotoEvidenceView({
  caseSlug,
  evidence,
}: PhotoEvidenceViewProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const imageSrc = buildPhotoAssetUrl(caseSlug, evidence.image);
  const displayDate = evidence.date ?? "Unknown";

  return (
    <>
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
          <div className="space-y-4">
            <p className="text-sm leading-7 text-stone-200">{evidence.caption}</p>
            <button
              className="inline-flex rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-50"
              onClick={() => setIsPreviewOpen(true)}
              type="button"
            >
              Open larger preview
            </button>
          </div>
        </div>
      </section>

      {isPreviewOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/90 p-6">
          <div
            aria-label={evidence.title}
            aria-modal="true"
            className="w-full max-w-4xl rounded-[2rem] border border-white/10 bg-stone-900 p-6 shadow-2xl"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-[#d96c3d]">
                  Active evidence / {evidence.subtype}
                </p>
                <h2 className="mt-3 text-2xl font-semibold">{evidence.title}</h2>
              </div>
              <button
                className="inline-flex rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-50"
                onClick={() => setIsPreviewOpen(false)}
                type="button"
              >
                Close preview
              </button>
            </div>
            <div className="mt-6 space-y-4">
              <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-stone-950/80">
                <img
                  alt={evidence.caption}
                  className="h-auto w-full object-contain"
                  src={imageSrc}
                />
              </div>
              <div className="flex flex-wrap gap-6 text-xs uppercase tracking-[0.2em] text-stone-400">
                <p>Source: {evidence.sourceLabel}</p>
                <p>Date: {displayDate}</p>
              </div>
              <p className="text-sm leading-7 text-stone-200">{evidence.caption}</p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
