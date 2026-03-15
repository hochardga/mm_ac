import Link from "next/link";

type EvidenceDialogProps = {
  closeHref: string;
  title: string;
  children: React.ReactNode;
};

export function EvidenceDialog({
  closeHref,
  title,
  children,
}: EvidenceDialogProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/90 p-4 sm:p-6">
      <div
        aria-label={title}
        aria-modal="true"
        className="mx-auto my-8 w-full max-w-5xl rounded-[2rem] border border-white/10 bg-stone-900 p-4 shadow-2xl sm:p-6"
        role="dialog"
      >
        <div className="mb-4 flex items-start justify-end">
          <Link
            className="inline-flex rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-50"
            href={closeHref}
          >
            Close Evidence
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
