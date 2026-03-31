import type { DiagramEvidence } from "@/features/cases/evidence/schema";
import { EvidencePanelShell } from "@/features/cases/components/evidence-panel-shell";

type DiagramEvidenceViewProps = {
  evidence: DiagramEvidence;
};

export function DiagramEvidenceView({ evidence }: DiagramEvidenceViewProps) {
  return (
    <EvidencePanelShell
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
        <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-stone-950/80 p-4">
          <svg
            aria-label={`${evidence.title} diagram`}
            className="h-auto w-full"
            viewBox={`0 0 ${evidence.viewport.width} ${evidence.viewport.height}`}
          >
            {evidence.elements.map((element) => {
              switch (element.type) {
                case "area":
                  return (
                    <g key={element.id}>
                      <rect
                        fill="rgba(217,108,61,0.15)"
                        height={element.height}
                        rx="18"
                        stroke="rgba(255,255,255,0.2)"
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
                      stroke="rgba(255,255,255,0.7)"
                      strokeWidth="10"
                    />
                  );
                case "marker":
                  return (
                    <g key={element.id}>
                      <circle
                        cx={element.x}
                        cy={element.y}
                        fill="rgba(217,108,61,0.9)"
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
          <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
              Legend
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-7 text-stone-200">
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
