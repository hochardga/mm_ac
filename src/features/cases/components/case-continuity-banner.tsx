import Link from "next/link";

type CaseContinuityBannerProps = {
  description: string;
  label: string;
  rightRailHref: string;
  rightRailLabel: string;
};

export function CaseContinuityBanner({
  description,
  label,
  rightRailHref,
  rightRailLabel,
}: CaseContinuityBannerProps) {
  return (
    <section className="rounded-[2rem] border border-[#d96c3d]/30 bg-[#d96c3d]/10 px-6 py-5 text-stone-50">
      <p className="text-xs uppercase tracking-[0.25em] text-[#f0b48f]">
        Progress Restored
      </p>
      <h2 className="mt-3 text-2xl font-semibold">Ashfall restored your saved progress.</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-200">
        {description} Continue from {label.toLowerCase()} or jump directly to
        any investigation section below.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          className="inline-flex rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-50"
          href="#evidence-intake"
        >
          Jump to Evidence Intake
        </Link>
        <Link
          className="inline-flex rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-50"
          href="#field-notes"
        >
          Jump to Field Notes
        </Link>
        <Link
          className="inline-flex rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-50"
          href={rightRailHref}
        >
          {rightRailLabel}
        </Link>
      </div>
    </section>
  );
}
