import type { WebpageBlock, WebpageEvidence } from "@/features/cases/evidence/schema";
import { EvidencePanelShell } from "@/features/cases/components/evidence-panel-shell";

type WebpageEvidenceViewProps = {
  evidence: WebpageEvidence;
};

type WebpageVariant = {
  surfaceClassName: string;
  chromeClassName: string;
  cardClassName: string;
  headingClassName: string;
  bodyClassName: string;
  tableClassName: string;
  tableHeadClassName: string;
  tableRowClassName: string;
  label: string;
};

const WEBPAGE_VARIANTS: Record<string, WebpageVariant> = {
  directory_listing: {
    surfaceClassName: "bg-[#0e1419] text-stone-50",
    chromeClassName: "border-white/10 bg-white/5",
    cardClassName: "border-white/10 bg-white/5",
    headingClassName: "text-stone-50",
    bodyClassName: "text-stone-200",
    tableClassName: "border-white/10 bg-white/5 text-stone-200",
    tableHeadClassName: "bg-white/5 text-stone-400",
    tableRowClassName: "border-white/10",
    label: "Directory listing",
  },
  company_site: {
    surfaceClassName: "bg-[#111722] text-stone-50",
    chromeClassName: "border-white/10 bg-white/5",
    cardClassName: "border-white/10 bg-white/5",
    headingClassName: "text-stone-50",
    bodyClassName: "text-stone-200",
    tableClassName: "border-white/10 bg-white/5 text-stone-200",
    tableHeadClassName: "bg-white/5 text-stone-400",
    tableRowClassName: "border-white/10",
    label: "Company site",
  },
  portal_screen: {
    surfaceClassName: "bg-[#08101d] text-stone-50",
    chromeClassName: "border-cyan-200/10 bg-cyan-950/30",
    cardClassName: "border-cyan-200/10 bg-cyan-950/20",
    headingClassName: "text-cyan-50",
    bodyClassName: "text-cyan-50/85",
    tableClassName: "border-cyan-200/10 bg-cyan-950/20 text-cyan-50/85",
    tableHeadClassName: "bg-cyan-950/30 text-cyan-100/80",
    tableRowClassName: "border-cyan-200/10",
    label: "Portal screen",
  },
  classified_ad: {
    surfaceClassName: "bg-[#f2e3c7] text-stone-900",
    chromeClassName: "border-stone-900/10 bg-white/45",
    cardClassName: "border-stone-900/10 bg-white/35",
    headingClassName: "text-stone-950",
    bodyClassName: "text-stone-800",
    tableClassName: "border-stone-900/10 bg-white/35 text-stone-800",
    tableHeadClassName: "bg-stone-900/5 text-stone-600",
    tableRowClassName: "border-stone-900/10",
    label: "Classified ad",
  },
  harbor_schedule_site: {
    surfaceClassName: "bg-[#0c1620] text-stone-50",
    chromeClassName: "border-amber-200/10 bg-amber-950/20",
    cardClassName: "border-amber-200/10 bg-amber-950/20",
    headingClassName: "text-amber-50",
    bodyClassName: "text-amber-50/85",
    tableClassName: "border-amber-200/10 bg-amber-950/20 text-amber-50/85",
    tableHeadClassName: "bg-amber-950/25 text-amber-100/80",
    tableRowClassName: "border-amber-200/10",
    label: "Schedule site",
  },
  default: {
    surfaceClassName: "bg-stone-950 text-stone-50",
    chromeClassName: "border-white/10 bg-white/5",
    cardClassName: "border-white/10 bg-white/5",
    headingClassName: "text-stone-50",
    bodyClassName: "text-stone-200",
    tableClassName: "border-white/10 bg-white/5 text-stone-200",
    tableHeadClassName: "bg-white/5 text-stone-400",
    tableRowClassName: "border-white/10",
    label: "Captured page",
  },
};

function getWebpageVariant(subtype: string) {
  return WEBPAGE_VARIANTS[subtype] ?? WEBPAGE_VARIANTS.default;
}

function WebpageBlockView({
  block,
  variant,
}: {
  block: WebpageBlock;
  variant: WebpageVariant;
}) {
  const cardClassName = `rounded-2xl border p-4 ${variant.cardClassName}`;

  switch (block.type) {
    case "hero":
      return (
        <section className={cardClassName}>
          <h3 className={`text-lg font-semibold ${variant.headingClassName}`}>
            {block.heading}
          </h3>
          <p className={`mt-2 text-sm leading-7 ${variant.bodyClassName}`}>
            {block.body}
          </p>
        </section>
      );
    case "notice":
      return (
        <section className={cardClassName}>
          {block.heading ? (
            <h3 className={`text-lg font-semibold ${variant.headingClassName}`}>
              {block.heading}
            </h3>
          ) : null}
          <p className={`mt-2 text-sm leading-7 ${variant.bodyClassName}`}>
            {block.body}
          </p>
        </section>
      );
    case "list":
      return (
        <section className={cardClassName}>
          {block.heading ? (
            <h3 className={`text-lg font-semibold ${variant.headingClassName}`}>
              {block.heading}
            </h3>
          ) : null}
          <ul className={`mt-3 space-y-2 text-sm leading-7 ${variant.bodyClassName}`}>
            {block.items.map((item, index) => (
              <li key={`${block.id}-${item}-${index}`}>{item}</li>
            ))}
          </ul>
        </section>
      );
    case "table":
      return (
        <section className={`overflow-hidden rounded-2xl border ${variant.tableClassName}`}>
          <table className={`w-full text-left text-sm ${variant.bodyClassName}`}>
            <thead className={`text-xs uppercase tracking-[0.2em] ${variant.tableHeadClassName}`}>
              <tr>
                {block.columns.map((column) => (
                  <th key={column} className="px-4 py-3">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, index) => (
                <tr
                  key={`${block.id}-${index}`}
                  className={`border-t ${variant.tableRowClassName}`}
                >
                  {row.map((cell, cellIndex) => (
                    <td key={`${block.id}-${index}-${cellIndex}`} className="px-4 py-3">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      );
    case "posts":
    case "directory":
      return (
        <section className="grid gap-3">
          {block.items.map((item, index) => (
            <article
              key={`${block.id}-${item.title}-${index}`}
              className={cardClassName}
            >
              <h3 className={`text-lg font-semibold ${variant.headingClassName}`}>
                {item.title}
              </h3>
              {item.meta ? (
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-stone-400">
                  {item.meta}
                </p>
              ) : null}
              <p className={`mt-2 text-sm leading-7 ${variant.bodyClassName}`}>
                {item.body}
              </p>
            </article>
          ))}
        </section>
      );
  }
}

export function WebpageEvidenceView({ evidence }: WebpageEvidenceViewProps) {
  const variant = getWebpageVariant(evidence.subtype);

  return (
    <EvidencePanelShell
      family="webpage"
      subtype={evidence.subtype}
      title={evidence.title}
      summary={evidence.summary}
      metadata={
        <>
          <p>{evidence.page.urlLabel ?? evidence.page.title}</p>
          {evidence.page.sourceLabel ? (
            <p>Source: {evidence.page.sourceLabel}</p>
          ) : null}
        </>
      }
    >
      <div
        className={`space-y-6 rounded-3xl border p-5 shadow-[0_26px_70px_rgba(0,0,0,0.3)] ${variant.surfaceClassName}`}
        data-webpage-variant={evidence.subtype}
      >
        <div
          className={`rounded-[1.5rem] border p-4 ${variant.chromeClassName}`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-300">
              Cached capture
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-300">
              {variant.label}
            </span>
            {evidence.page.sourceLabel ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-300">
                {evidence.page.sourceLabel}
              </span>
            ) : null}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex gap-2" aria-hidden="true">
              <span className="h-3 w-3 rounded-full bg-white/50" />
              <span className="h-3 w-3 rounded-full bg-white/30" />
              <span className="h-3 w-3 rounded-full bg-white/20" />
            </div>
            <div className="min-w-0 flex-1 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-stone-300">
              {evidence.page.urlLabel ?? evidence.page.title}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1 border-b border-white/10 pb-4">
            <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
              In-world snapshot
            </p>
            <p className={`text-lg font-medium ${variant.headingClassName}`}>
              {evidence.page.title}
            </p>
          </div>
          {evidence.blocks.map((block) => (
            <WebpageBlockView key={block.id} block={block} variant={variant} />
          ))}
        </div>
      </div>
    </EvidencePanelShell>
  );
}
