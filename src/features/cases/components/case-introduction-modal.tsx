"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { markIntroductionSeenAction } from "@/app/(app)/cases/[caseSlug]/actions";
import { buildCaseAssetUrl } from "@/features/cases/case-asset-url";

type CaseIntroductionBundle = {
  transcript: string;
  audioPath?: string;
};

export type CaseIntroductionModalProps = {
  caseSlug: string;
  caseName: string;
  intro: CaseIntroductionBundle;
  playerCaseId: string;
  open: boolean;
  closeHref?: string;
};

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  );
}

function pauseAudio(audio: HTMLAudioElement | null) {
  if (!audio) {
    return;
  }

  if (!audio.paused) {
    try {
      audio.pause();
    } catch {
      // JSDOM can throw for unimplemented media controls.
    }
  }

  try {
    audio.currentTime = 0;
  } catch {
    // Ignore reset failures from inert or mocked media elements.
  }
}

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

export function CaseIntroductionModal({
  caseSlug,
  caseName,
  intro,
  playerCaseId,
  open,
  closeHref,
}: CaseIntroductionModalProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const closeLinkRef = useRef<HTMLAnchorElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const playButtonRef = useRef<HTMLButtonElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const restoreFocusFrameRef = useRef<number | null>(null);
  const seenWriteQueuedRef = useRef(false);
  const autoplayAttemptedRef = useRef(false);
  const [portalNode, setPortalNode] = useState<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(open);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  const audioSrc = intro.audioPath
    ? buildCaseAssetUrl(caseSlug, intro.audioPath)
    : undefined;
  const hasAudio = Boolean(audioSrc);

  useEffect(() => {
    if (open) {
      autoplayAttemptedRef.current = false;
      setAutoplayBlocked(false);
      setIsOpen(true);
    }
  }, [open]);

  const restoreFocus = useEffectEvent(() => {
    if (restoreFocusFrameRef.current !== null) {
      window.cancelAnimationFrame(restoreFocusFrameRef.current);
    }

    restoreFocusFrameRef.current = window.requestAnimationFrame(() => {
      if (openerRef.current?.isConnected) {
        openerRef.current.focus({ preventScroll: true });
      }
    });
  });

  const closeModal = useEffectEvent((syncUrl: boolean) => {
    pauseAudio(audioRef.current);
    setIsOpen(false);

    if (syncUrl && closeHref) {
      router.replace(`${closeHref}${window.location.hash}`);
    }

    restoreFocus();
  });

  const handleCloseClick = useEffectEvent(
    (event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
      event.preventDefault();
      closeModal(Boolean(closeHref));
    },
  );

  const handlePlayClick = useEffectEvent(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    setAutoplayBlocked(false);
    audio.currentTime = 0;
    attemptPlayAudio(audio, () => {
      setAutoplayBlocked(true);
      playButtonRef.current?.focus({ preventScroll: true });
    });
  });

  useEffect(() => {
    const node = document.createElement("div");
    node.dataset.caseIntroductionRoot = "true";
    document.body.appendChild(node);
    setPortalNode(node);

    return () => {
      if (restoreFocusFrameRef.current !== null) {
        window.cancelAnimationFrame(restoreFocusFrameRef.current);
      }

      node.remove();
    };
  }, []);

  useEffect(() => {
    if (!isOpen || seenWriteQueuedRef.current) {
      return;
    }

    seenWriteQueuedRef.current = true;

    const formData = new FormData();
    formData.set("playerCaseId", playerCaseId);

    void markIntroductionSeenAction(formData).catch(() => {});
  }, [isOpen, playerCaseId]);

  useEffect(() => {
    if (!portalNode || !isOpen) {
      return;
    }

    openerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const backgroundElements = Array.from(document.body.children).flatMap(
      (element) =>
        element instanceof HTMLElement && element !== portalNode
          ? [
              {
                element,
                ariaHidden: element.getAttribute("aria-hidden"),
                hadInert: element.hasAttribute("inert"),
              },
            ]
          : [],
    );

    for (const backgroundElement of backgroundElements) {
      backgroundElement.element.setAttribute("aria-hidden", "true");
      backgroundElement.element.setAttribute("inert", "");
    }

    const initialFocusTarget =
      autoplayBlocked && hasAudio
        ? playButtonRef.current
        : closeLinkRef.current ?? closeButtonRef.current ?? dialog;

    initialFocusTarget?.focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeModal(Boolean(closeHref));
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const currentDialog = dialogRef.current;

      if (!currentDialog) {
        return;
      }

      const focusableElements = getFocusableElements(currentDialog);

      if (focusableElements.length === 0) {
        event.preventDefault();
        currentDialog.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;

      if (!activeElement || !currentDialog.contains(activeElement)) {
        event.preventDefault();
        (event.shiftKey ? lastElement : firstElement).focus();
        return;
      }

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    if (hasAudio && audioRef.current && !autoplayAttemptedRef.current) {
      autoplayAttemptedRef.current = true;
      audioRef.current.currentTime = 0;
      attemptPlayAudio(audioRef.current, () => {
        setAutoplayBlocked(true);
        playButtonRef.current?.focus({ preventScroll: true });
      });
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;

      for (const backgroundElement of backgroundElements) {
        if (backgroundElement.ariaHidden === null) {
          backgroundElement.element.removeAttribute("aria-hidden");
        } else {
          backgroundElement.element.setAttribute(
            "aria-hidden",
            backgroundElement.ariaHidden,
          );
        }

        if (!backgroundElement.hadInert) {
          backgroundElement.element.removeAttribute("inert");
        }
      }

      pauseAudio(audioRef.current);

      if (openerRef.current?.isConnected) {
        openerRef.current.focus({ preventScroll: true });
      }
    };
  }, [
    closeHref,
    closeModal,
    hasAudio,
    isOpen,
    portalNode,
  ]);

  if (!portalNode || !isOpen) {
    return null;
  }

  const closeControl = closeHref ? (
    <Link
      className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-50 transition hover:border-white/35 hover:bg-white/10"
      href={closeHref}
      onClick={handleCloseClick}
      ref={closeLinkRef}
    >
      Close Introduction
    </Link>
  ) : (
    <button
      className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-50 transition hover:border-white/35 hover:bg-white/10"
      onClick={handleCloseClick}
      ref={closeButtonRef}
      type="button"
    >
      Close Introduction
    </button>
  );

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/90 p-4 sm:p-6">
      <div
        aria-label={`Introduction for ${caseName}`}
        aria-modal="true"
        className="mx-auto my-8 w-full max-w-5xl rounded-[2rem] border border-white/10 bg-stone-900 p-4 shadow-2xl sm:p-6"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.25em] text-[#d96c3d]">
              Opening channel
            </p>
            <h2 className="text-2xl font-semibold">Introduction</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {hasAudio ? (
              <button
                className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-50 transition hover:border-white/35 hover:bg-white/10"
                onClick={handlePlayClick}
                ref={playButtonRef}
                type="button"
              >
                Play Introduction
              </button>
            ) : null}
            {closeControl}
          </div>
        </div>

        {hasAudio && audioSrc ? (
          <audio
            aria-hidden="true"
            className="sr-only"
            preload="none"
            ref={audioRef}
            src={audioSrc}
          />
        ) : null}

        <div className="prose prose-invert max-w-none rounded-[1.5rem] border border-white/10 bg-black/20 p-6 text-sm leading-7">
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h3 className="text-xl font-semibold text-stone-50">
                  {children}
                </h3>
              ),
              h2: ({ children }) => (
                <h4 className="text-lg font-semibold text-stone-50">
                  {children}
                </h4>
              ),
              h3: ({ children }) => (
                <h5 className="text-base font-semibold text-stone-50">
                  {children}
                </h5>
              ),
            }}
            remarkPlugins={[remarkGfm]}
          >
            {intro.transcript}
          </ReactMarkdown>
        </div>
      </div>
    </div>,
    portalNode,
  );
}
