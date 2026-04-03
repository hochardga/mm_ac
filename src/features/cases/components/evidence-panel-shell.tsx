import type { ReactNode } from "react";

import {
  formatEvidenceSubtypeLabel,
  getEvidenceFamilyBadgeClass,
  getEvidenceFamilyLabel,
  type EvidenceFamily,
} from "@/features/cases/components/evidence-visual-variants";

type EvidencePanelShellProps = {
  family: EvidenceFamily;
  subtype: string;
  title: string;
  summary: string;
  metadata?: ReactNode;
  children: ReactNode;
};

export function EvidencePanelShell({
  family,
  subtype,
  title,
  summary,
  metadata,
  children,
}: EvidencePanelShellProps) {
  const familyBadgeClass = getEvidenceFamilyBadgeClass(family);

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_20px_70px_rgba(0,0,0,0.2)]">
      <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em]">
        <span className={`rounded-full border px-3 py-1 ${familyBadgeClass}`}>
          {getEvidenceFamilyLabel(family)}
        </span>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-stone-300">
          {formatEvidenceSubtypeLabel(subtype)}
        </span>
      </div>
      <h2 className="mt-4 text-3xl font-semibold">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-stone-300">{summary}</p>
      {metadata ? (
        <div className="mt-6 flex flex-wrap gap-6 text-xs uppercase tracking-[0.2em] text-stone-400">
          {metadata}
        </div>
      ) : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}
