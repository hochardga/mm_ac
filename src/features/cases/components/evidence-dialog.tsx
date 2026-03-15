"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type EvidenceDialogProps = {
  closeHref: string;
  title: string;
  children: ReactNode;
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

export function EvidenceDialog({
  closeHref,
  title,
  children,
}: EvidenceDialogProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const restoreFocusFrameRef = useRef<number | null>(null);
  const [portalNode, setPortalNode] = useState<HTMLDivElement | null>(null);

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

  const closeDialog = useEffectEvent(() => {
    router.push(closeHref);
    restoreFocus();
  });

  const handleCloseClick = useEffectEvent((event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    closeDialog();
  });

  useEffect(() => {
    const node = document.createElement("div");
    node.dataset.evidenceDialogRoot = "true";
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
    if (!portalNode) {
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

    const backgroundElements = Array.from(document.body.children).flatMap((element) =>
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

    (getFocusableElements(dialog)[0] ?? dialog).focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDialog();
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

      if (openerRef.current?.isConnected) {
        openerRef.current.focus({ preventScroll: true });
      }
    };
  }, [closeDialog, portalNode, restoreFocus]);

  if (!portalNode) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/90 p-4 sm:p-6">
      <div
        aria-label={title}
        aria-modal="true"
        className="mx-auto my-8 w-full max-w-5xl rounded-[2rem] border border-white/10 bg-stone-900 p-4 shadow-2xl sm:p-6"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="mb-4 flex items-start justify-end">
          <Link
            className="inline-flex rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-50"
            href={closeHref}
            onClick={handleCloseClick}
          >
            Close Evidence
          </Link>
        </div>
        {children}
      </div>
    </div>,
    portalNode,
  );
}
