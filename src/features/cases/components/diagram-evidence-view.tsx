import type { DiagramEvidence } from "@/features/cases/evidence/schema";
import { EvidencePanelShell } from "@/features/cases/components/evidence-panel-shell";

type DiagramEvidenceViewProps = {
  evidence: DiagramEvidence;
};

type DiagramVariant = {
  surfaceClassName: string;
  wrapperClassName: string;
  areaFill: string;
  areaStroke: string;
  lineStroke: string;
  markerFill: string;
  labelClassName: string;
  overlayClassName: string;
  legendClassName: string;
};

const DIAGRAM_VARIANTS: Record<string, DiagramVariant> = {
  map: {
    surfaceClassName: "bg-[#ede2c8] text-stone-800",
    wrapperClassName: "border-stone-900/10 bg-[#f6eedc]",
    areaFill: "rgba(121,95,46,0.14)",
    areaStroke: "rgba(61,44,17,0.25)",
    lineStroke: "rgba(70,52,28,0.7)",
    markerFill: "rgba(121,95,46,0.9)",
    labelClassName: "text-stone-700",
    overlayClassName:
      "bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.5),transparent_42%),repeating-linear-gradient(0deg,transparent,transparent_29px,rgba(70,52,28,0.05)_30px)]",
    legendClassName: "border-stone-900/10 bg-white/40 text-stone-800",
  },
  floorplan: {
    surfaceClassName: "bg-[#081826] text-cyan-50",
    wrapperClassName: "border-cyan-200/10 bg-[#0a1d2d]",
    areaFill: "rgba(56,189,248,0.12)",
    areaStroke: "rgba(186,230,253,0.25)",
    lineStroke: "rgba(125,211,252,0.8)",
    markerFill: "rgba(125,211,252,0.95)",
    labelClassName: "text-cyan-50",
    overlayClassName:
      "bg-[linear-gradient(90deg,transparent,transparent_31px,rgba(125,211,252,0.08)_32px),linear-gradient(180deg,transparent,transparent_31px,rgba(125,211,252,0.08)_32px)]",
    legendClassName: "border-cyan-200/10 bg-cyan-950/40 text-cyan-50",
  },
  site_diagram: {
    surfaceClassName: "bg-[#0b1d1f] text-stone-50",
    wrapperClassName: "border-teal-200/10 bg-[#102428]",
    areaFill: "rgba(45,212,191,0.12)",
    areaStroke: "rgba(153,246,228,0.22)",
    lineStroke: "rgba(167,243,208,0.75)",
    markerFill: "rgba(167,243,208,0.95)",
    labelClassName: "text-stone-50",
    overlayClassName:
      "bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_40%),repeating-linear-gradient(0deg,transparent,transparent_29px,rgba(167,243,208,0.06)_30px)]",
    legendClassName: "border-teal-200/10 bg-teal-950/40 text-stone-50",
  },
  route_sketch: {
    surfaceClassName: "bg-[#f2e8d6] text-stone-800",
    wrapperClassName: "border-stone-900/10 bg-[#f7f0e2]",
    areaFill: "rgba(94,72,35,0.08)",
    areaStroke: "rgba(94,72,35,0.2)",
    lineStroke: "rgba(94,72,35,0.68)",
    markerFill: "rgba(94,72,35,0.9)",
    labelClassName: "text-stone-700",
    overlayClassName:
      "bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.45),transparent_40%),repeating-linear-gradient(45deg,transparent,transparent_34px,rgba(94,72,35,0.04)_35px)]",
    legendClassName: "border-stone-900/10 bg-white/40 text-stone-800",
  },
  default: {
    surfaceClassName: "bg-stone-950/90 text-stone-50",
    wrapperClassName: "border-white/10 bg-black/20",
    areaFill: "rgba(217,108,61,0.15)",
    areaStroke: "rgba(255,255,255,0.2)",
    lineStroke: "rgba(255,255,255,0.7)",
    markerFill: "rgba(217,108,61,0.9)",
    labelClassName: "text-stone-50",
    overlayClassName: "",
    legendClassName: "border-white/10 bg-white/5 text-stone-200",
  },
};

function getDiagramVariant(subtype: string) {
  return DIAGRAM_VARIANTS[subtype] ?? DIAGRAM_VARIANTS.default;
}

export function DiagramEvidenceView({ evidence }: DiagramEvidenceViewProps) {
  const variant = getDiagramVariant(evidence.subtype);

  return (
    <EvidencePanelShell
      family="diagram"
      subtype={evidence.subtype}
      title={evidence.title}
      summary={evidence.summary}
      metadata={
        <>
          <p>
            Viewport: {Math.round(evidence.viewport.width)} x{" "}
            {Math.round(evidence.viewport.height)}
          </p>
          <p>Elements: {evidence.elements.length}</p>
        </>
      }
    >
      <div className="space-y-4">
        <div
          className={`relative overflow-hidden rounded-[1.5rem] border p-4 shadow-[0_24px_60px_rgba(0,0,0,0.25)] ${variant.wrapperClassName}`}
          data-diagram-variant={evidence.subtype}
        >
          <div
            aria-hidden="true"
          className={`pointer-events-none absolute inset-0 opacity-60 ${variant.overlayClassName}`}
          />
          <svg
            aria-label={`${evidence.title} diagram`}
            className={`relative h-auto w-full ${variant.surfaceClassName}`}
            viewBox={`0 0 ${evidence.viewport.width} ${evidence.viewport.height}`}
          >
            {evidence.elements.map((element) => {
              switch (element.type) {
                case "area":
                  return (
                    <g key={element.id}>
                      <rect
                        fill={variant.areaFill}
                        height={element.height}
                        rx="18"
                        stroke={variant.areaStroke}
                        width={element.width}
                        x={element.x}
                        y={element.y}
                      />
                      {element.label ? (
                        <text
                          fill="currentColor"
                          fontSize="28"
                          x={element.x + 16}
                          y={element.y + 38}
                        >
                          {element.label}
                        </text>
                      ) : null}
                    </g>
                  );
                case "line":
                  return (
                    <polyline
                      key={element.id}
                      fill="none"
                      points={element.points.map((point) => point.join(",")).join(" ")}
                      stroke={variant.lineStroke}
                      strokeWidth="10"
                    />
                  );
                case "marker":
                  return (
                    <g key={element.id}>
                      <circle
                        cx={element.x}
                        cy={element.y}
                        fill={variant.markerFill}
                        r="12"
                      />
                      <text
                        fill="currentColor"
                        fontSize="24"
                        x={element.x + 20}
                        y={element.y + 8}
                      >
                        {element.label}
                      </text>
                    </g>
                  );
                case "label":
                  return (
                    <text
                      key={element.id}
                      fill="currentColor"
                      fontSize="24"
                      x={element.x}
                      y={element.y}
                    >
                      {element.text}
                    </text>
                  );
              }
            })}
          </svg>
        </div>
        {evidence.legend && evidence.legend.length > 0 ? (
          <section
            className={`rounded-2xl border p-4 ${variant.legendClassName}`}
          >
            <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
              Legend
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-7">
              {evidence.legend.map((entry) => (
                <li key={entry.id}>{entry.label}</li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </EvidencePanelShell>
  );
}
