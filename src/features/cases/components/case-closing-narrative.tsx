"use client";

import { useEffect, useRef, useState } from "react";

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
  onBlocked: () => void,
) {
  if (!audio) {
    return;
  }

  try {
    const maybePlay = audio.play();

    if (maybePlay && typeof maybePlay.then === "function") {
      maybePlay.catch(onBlocked);
    }
  } catch {
    onBlocked();
  }
}

export function CaseClosingNarrative({
  caseSlug,
  caseName,
  closingNarrative,
}: CaseClosingNarrativeProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playButtonRef = useRef<HTMLButtonElement | null>(null);
  const autoplayAttemptedRef = useRef(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  const audioSrc = closingNarrative.audioPath
    ? buildCaseAssetUrl(caseSlug, closingNarrative.audioPath)
    : undefined;
  const hasAudio = Boolean(audioSrc);

  useEffect(() => {
    if (!hasAudio || autoplayAttemptedRef.current) {
      return;
    }

    autoplayAttemptedRef.current = true;
    setAutoplayBlocked(false);

    attemptPlayAudio(audioRef.current, () => {
      setAutoplayBlocked(true);
      playButtonRef.current?.focus({ preventScroll: true });
    });
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
          {autoplayBlocked ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                ref={playButtonRef}
                type="button"
                className="inline-flex rounded-full bg-[#d96c3d] px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black"
                onClick={() => {
                  setAutoplayBlocked(false);
                  const audio = audioRef.current;

                  if (!audio) {
                    return;
                  }

                  audio.currentTime = 0;
                  attemptPlayAudio(audio, () => {
                    setAutoplayBlocked(true);
                    playButtonRef.current?.focus({ preventScroll: true });
                  });
                }}
              >
                Play Closing Narration
              </button>
              <p className="text-sm text-stone-300">
                Autoplay was blocked by your browser.
              </p>
            </div>
          ) : null}
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
