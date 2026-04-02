"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

type SystemIntroPanelProps = {
  transcript: string;
  audioSrc?: string;
};

function attemptPlayAudio(audio: HTMLAudioElement | null) {
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

export function SystemIntroPanel({ transcript, audioSrc }: SystemIntroPanelProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoplayAttemptedRef = useRef(false);

  useEffect(() => {
    if (!audioSrc || autoplayAttemptedRef.current) {
      return;
    }

    autoplayAttemptedRef.current = true;
    attemptPlayAudio(audioRef.current);
  }, [audioSrc]);

  return (
    <section className="mx-auto w-full max-w-2xl rounded-[2rem] border border-white/10 bg-stone-950/90 px-8 py-10 text-stone-50 shadow-2xl shadow-black/40 backdrop-blur">
      <p className="text-sm uppercase tracking-[0.3em] text-[#d96c3d]">
        Ashfall Collective / unofficial welcome
      </p>
      <h1 className="mt-4 text-4xl font-semibold">The system.</h1>
      <p className="mt-4 text-base leading-7 text-stone-300">
        If you found this page, treat it as an unofficial welcome.
      </p>

      {audioSrc ? (
        <div className="mt-8 rounded-3xl border border-white/10 bg-black/25 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
            Narration
          </p>
          <audio
            ref={audioRef}
            aria-label="System narration audio"
            className="mt-4 w-full"
            controls
            src={audioSrc}
          />
        </div>
      ) : null}

      <div className="mt-8 rounded-3xl border border-white/10 bg-black/20 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
          Transcript
        </p>
        <pre
          data-testid="system-intro-transcript"
          className="mt-4 whitespace-pre-wrap text-sm leading-7 text-stone-200"
        >
          {transcript}
        </pre>
      </div>

      <div className="mt-10">
        <Link
          href="/vault"
          className="inline-flex w-fit rounded-full bg-stone-50 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-stone-950"
        >
          Proceed to Vault
        </Link>
      </div>
    </section>
  );
}
