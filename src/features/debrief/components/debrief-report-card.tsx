import type { DebriefEntry } from "@/features/debrief/get-debrief";

type DebriefReportCardProps = {
  title: string;
  description: string;
  eyebrow?: string;
  entries: DebriefEntry[];
  valueKey: "playerValue" | "solutionValue";
  valueLabel: string;
};

export function DebriefReportCard({
  title,
  description,
  eyebrow,
  entries,
  valueKey,
  valueLabel,
}: DebriefReportCardProps) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
      {eyebrow ? (
        <p className="text-xs uppercase tracking-[0.25em] text-[#f0b48f]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-3 text-2xl font-semibold text-stone-50">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-stone-300">{description}</p>

      <dl className="mt-6 space-y-4">
        {entries.map((entry) => (
          <div
            key={entry.label}
            className="rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-4"
          >
            <dt className="text-xs uppercase tracking-[0.2em] text-stone-400">
              {entry.label}
            </dt>
            <dd className="mt-2 text-xs uppercase tracking-[0.18em] text-stone-500">
              {valueLabel}
            </dd>
            <dd className="mt-2 text-base font-medium text-stone-50">
              {entry[valueKey] ?? "No answer filed"}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
