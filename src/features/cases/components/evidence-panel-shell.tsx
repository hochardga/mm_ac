import type { ReactNode } from "react";

type EvidencePanelShellProps = {
  subtype: string;
  title: string;
  summary: string;
  metadata?: ReactNode;
  children: ReactNode;
};

export function EvidencePanelShell({
  subtype,
  title,
  summary,
  metadata,
  children,
}: EvidencePanelShellProps) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
      <p className="text-sm uppercase tracking-[0.3em] text-[#d96c3d]">
        Active evidence / {subtype}
      </p>
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
