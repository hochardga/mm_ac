type DebriefSelection = {
  suspect: string;
  motive: string;
  method: string;
};

type DebriefReportCardProps = {
  title: string;
  description: string;
  eyebrow?: string;
  selection: DebriefSelection;
};

const rows: Array<keyof DebriefSelection> = ["suspect", "motive", "method"];

export function DebriefReportCard({
  title,
  description,
  eyebrow,
  selection,
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
        {rows.map((row) => (
          <div key={row} className="rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-4">
            <dt className="text-xs uppercase tracking-[0.2em] text-stone-400">
              {row}
            </dt>
            <dd className="mt-2 text-base font-medium text-stone-50">
              {selection[row]}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
