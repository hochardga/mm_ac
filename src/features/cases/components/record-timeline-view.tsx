import type { RecordEvidence } from "@/features/cases/evidence/schema";

function getTimelineHeadline(columns: RecordEvidence["columns"], row: RecordEvidence["rows"][number]) {
  const timestampColumn = columns.find((column) => column.id === "timestamp");
  const headlineColumn =
    timestampColumn ??
    columns.find((column) => column.id !== "id") ??
    columns[0];

  return String(row[headlineColumn.id] ?? row.id);
}

function getTimelineSummary(columns: RecordEvidence["columns"], row: RecordEvidence["rows"][number]) {
  const preferredColumns = columns.filter((column) => column.id !== "id");

  for (const column of preferredColumns) {
    const value = row[column.id];

    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return { label: column.label, value: String(value) };
    }
  }

  return { label: "Entry", value: row.id };
}

type RecordTimelineViewProps = {
  columns: RecordEvidence["columns"];
  rows: RecordEvidence["rows"];
};

export function RecordTimelineView({
  columns,
  rows,
}: RecordTimelineViewProps) {
  return (
    <section
      className="relative space-y-4 rounded-3xl border border-emerald-200/10 bg-[#101a14] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.3)]"
      data-record-layout="timeline"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-5 left-8 top-5 w-px bg-emerald-300/30"
      />
      <div className="space-y-3">
        {rows.map((row, index) => {
          const headline = getTimelineHeadline(columns, row);
          const summary = getTimelineSummary(columns, row);

          return (
            <article key={row.id} className="relative pl-10">
              <span
                aria-hidden="true"
                className="absolute left-[1.45rem] top-5 h-3 w-3 rounded-full border border-emerald-200/40 bg-emerald-300/80 shadow-[0_0_0_4px_rgba(16,26,20,1)]"
              />
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-emerald-200/70">
                      Event {index + 1}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-stone-50">
                      {headline}
                    </h3>
                  </div>
                  <p className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-stone-300">
                    {summary.label}
                  </p>
                </div>

                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                  {columns.map((column) => (
                    <div
                      key={`${row.id}-${column.id}`}
                      className="rounded-2xl border border-white/10 bg-black/20 p-3"
                    >
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
                        {column.label}
                      </dt>
                      <dd className="mt-2 text-sm leading-7 text-stone-200">
                        {String(row[column.id] ?? "")}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
