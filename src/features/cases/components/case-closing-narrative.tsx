"use client";

import { useEffect, useRef } from "react";

import { buildCaseAssetUrl } from "@/features/cases/case-asset-url";
import { MarkdownContent } from "@/features/cases/components/markdown-content";

type CaseClosingNarrativeBundle = {
  transcript: string;
  audioPath?: string;
};

type CaseClosingNarrativeProps = {
  caseSlug: string;
  caseName: string;
  closingNarrative: CaseClosingNarrativeBundle;
};

function attemptPlayAudio(
  audio: HTMLAudioElement | null,
) {
  if (!audio) {
    return;
  }

  try {
    const maybePlay = audio.play();

    if (maybePlay && typeof maybePlay.then === "function") {
      maybePlay.catch(() => {});
    }
  } catch {
    // Ignore autoplay failures when the browser blocks playback.
  }
}

export function CaseClosingNarrative({
  caseSlug,
  caseName,
  closingNarrative,
}: CaseClosingNarrativeProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoplayAttemptedRef = useRef(false);

  const audioSrc = closingNarrative.audioPath
    ? buildCaseAssetUrl(caseSlug, closingNarrative.audioPath)
    : undefined;
  const hasAudio = Boolean(audioSrc);

  useEffect(() => {
    if (!hasAudio || autoplayAttemptedRef.current) {
      return;
    }

    autoplayAttemptedRef.current = true;
    attemptPlayAudio(audioRef.current);
  }, [hasAudio]);

  return (
    <section
      aria-label={`Closing narration for ${caseName}`}
      className="mt-4 rounded-[1.5rem] border border-white/10 bg-black/20 p-4"
    >
      {hasAudio ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
            Narration
          </p>
          <audio
            ref={audioRef}
            aria-label="Closing narration audio"
            className="mt-4 w-full"
            controls
            src={audioSrc}
          />
        </div>
      ) : null}

      <div
        className={`rounded-2xl border border-white/10 bg-black/25 p-4 ${hasAudio ? "mt-4" : ""}`}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
          Transcript
        </p>
        <div className="mt-4">
          <MarkdownContent
            content={closingNarrative.transcript}
            className="space-y-4 text-sm leading-7 text-stone-200"
          />
        </div>
      </div>
    </section>
  );
}
