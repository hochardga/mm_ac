import { EvidencePanelShell } from "@/features/cases/components/evidence-panel-shell";
import { MarkdownContent } from "@/features/cases/components/markdown-content";
import { formatEvidenceSubtypeLabel } from "@/features/cases/components/evidence-visual-variants";
import type { DocumentEvidence } from "@/features/cases/evidence/schema";

type DocumentEvidenceViewProps = {
  evidence: DocumentEvidence;
};

type DocumentVariant = {
  headerLabel: string;
  stampLabel: string;
  paperClassName: string;
  bodyClassName?: string;
};

const DOCUMENT_VARIANTS: Record<string, DocumentVariant> = {
  case_brief: {
    headerLabel: "Scanned case brief",
    stampLabel: "Archive brief",
    paperClassName: "bg-[#f5ecd8]",
  },
  incident_form: {
    headerLabel: "Filed incident form",
    stampLabel: "Filed copy",
    paperClassName: "bg-[#f3e8cf]",
  },
  memo: {
    headerLabel: "Internal memo scan",
    stampLabel: "Internal memo",
    paperClassName: "bg-[#f4ead7]",
  },
  letter: {
    headerLabel: "Recovered letter",
    stampLabel: "Received mail",
    paperClassName: "bg-[#f7efe1]",
  },
  transcript: {
    headerLabel: "Interview transcript",
    stampLabel: "Transcript copy",
    paperClassName: "bg-[#f2ebdf]",
    bodyClassName: "space-y-4 font-mono text-[0.94rem] leading-7 text-stone-900",
  },
  notice: {
    headerLabel: "Posted notice",
    stampLabel: "Public notice",
    paperClassName: "bg-[#f5ebdb]",
  },
  report: {
    headerLabel: "Formal report",
    stampLabel: "Report copy",
    paperClassName: "bg-[#f4ead8]",
  },
  default: {
    headerLabel: "Scanned document",
    stampLabel: "Archive copy",
    paperClassName: "bg-[#f5ebd7]",
  },
};

function getDocumentVariant(subtype: string) {
  return DOCUMENT_VARIANTS[subtype] ?? DOCUMENT_VARIANTS.default;
}

function formatMetaLabel(key: string) {
  return formatEvidenceSubtypeLabel(key);
}

export function DocumentEvidenceView({
  evidence,
}: DocumentEvidenceViewProps) {
  const metadataEntries = Object.entries(evidence.meta);
  const variant = getDocumentVariant(evidence.subtype);

  return (
    <EvidencePanelShell
      family="document"
      metadata={
        metadataEntries.length > 0 ? (
          <>
            {metadataEntries.map(([key, value]) => (
              <p
                key={key}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 normal-case tracking-normal text-stone-200"
              >
                {formatMetaLabel(key)}: {String(value)}
              </p>
            ))}
          </>
        ) : undefined
      }
      subtype={evidence.subtype}
      summary={evidence.summary}
      title={evidence.title}
    >
      <div
        className={`relative overflow-hidden rounded-[2rem] border border-stone-900/10 p-6 text-stone-900 shadow-[0_30px_90px_rgba(34,21,6,0.2)] sm:p-8 ${variant.paperClassName}`}
        data-document-variant={evidence.subtype}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.65),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.18),transparent_18%,transparent_82%,rgba(82,58,31,0.08))] opacity-70"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_30px,rgba(69,50,28,0.04)_31px)] mix-blend-multiply"
        />
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-900/10 pb-5">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.28em] text-stone-600">
                {variant.headerLabel}
              </p>
              <p className="max-w-xl text-sm leading-6 text-stone-700">
                {formatEvidenceSubtypeLabel(evidence.subtype)} / scanned archive
              </p>
            </div>
            <div className="rotate-3 rounded-full border-2 border-rose-700/15 bg-rose-600/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-rose-950 shadow-[0_10px_20px_rgba(127,29,29,0.1)]">
              {variant.stampLabel}
            </div>
          </div>

          <div className="mt-6">
            <MarkdownContent
              content={evidence.body}
              className={variant.bodyClassName}
              tone="paper"
            />
          </div>
        </div>
      </div>
    </EvidencePanelShell>
  );
}
