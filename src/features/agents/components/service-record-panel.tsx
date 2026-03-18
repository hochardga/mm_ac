import Link from "next/link";

import type { ServiceRecord } from "@/features/agents/get-service-record";

type ServiceRecordPanelProps = {
  eyebrow: string;
  title: string;
  description: string;
  serviceRecord: ServiceRecord;
};

export function ServiceRecordPanel({
  eyebrow,
  title,
  description,
  serviceRecord,
}: ServiceRecordPanelProps) {
  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white/95 p-6 shadow-lg shadow-stone-950/5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.25em] text-[#b35b36]">
            {eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-stone-950">{title}</h2>
          <p className="mt-3 text-sm leading-7 text-stone-700">{description}</p>
        </div>
        <p className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-xs uppercase tracking-[0.2em] text-stone-600">
          {serviceRecord.progressLabel}
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <article className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
            Cleared
          </p>
          <p className="mt-2 text-2xl font-semibold text-stone-950">
            {serviceRecord.totals.clearedCases}
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-700">
            {serviceRecord.totals.clearedCases} dossiers cleared
          </p>
        </article>
        <article className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
            Active
          </p>
          <p className="mt-2 text-2xl font-semibold text-stone-950">
            {serviceRecord.totals.activeCases}
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-700">
            {serviceRecord.totals.activeCases} active investigations
          </p>
        </article>
        <article className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
            Unresolved
          </p>
          <p className="mt-2 text-2xl font-semibold text-stone-950">
            {serviceRecord.totals.closedUnresolvedCases}
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-700">
            {serviceRecord.totals.closedUnresolvedCases} unresolved closures
          </p>
        </article>
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
          Recommended Assignment
        </p>
        {serviceRecord.recommendedAssignment ? (
          <>
            <p className="mt-2 text-sm leading-6 text-stone-700">
              {serviceRecord.recommendedAssignment.reason}
            </p>
            <Link
              className="mt-4 inline-flex rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-stone-50"
              href={serviceRecord.recommendedAssignment.href}
            >
              {serviceRecord.recommendedAssignment.label}
            </Link>
          </>
        ) : (
          <p className="mt-2 text-sm leading-6 text-stone-700">
            No new assignment is waiting right now. Review the vault for closed
            dossiers and completed casework.
          </p>
        )}
      </div>
    </section>
  );
}
