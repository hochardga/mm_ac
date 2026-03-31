import { render, screen } from "@testing-library/react";

import { DiagramEvidenceView } from "@/features/cases/components/diagram-evidence-view";

test("diagram viewer renders labels from the structured geometry model", () => {
  render(
    <DiagramEvidenceView
      evidence={{
        id: "harbor-map",
        title: "Harbor Map",
        family: "diagram",
        subtype: "map",
        summary: "A labeled harbor route sketch.",
        source: "evidence/harbor-map.json",
        viewport: { width: 1200, height: 800 },
        elements: [
          {
            id: "room-a",
            type: "area",
            x: 80,
            y: 90,
            width: 260,
            height: 180,
            label: "Records Room",
          },
          {
            id: "note-1",
            type: "label",
            x: 700,
            y: 220,
            text: "Power loss reported here",
          },
        ],
        legend: [{ id: "camera", label: "Camera" }],
      }}
    />,
  );

  expect(screen.getByText(/records room/i)).toBeInTheDocument();
  expect(screen.getByText(/power loss reported here/i)).toBeInTheDocument();
  expect(screen.getByText(/legend/i)).toBeInTheDocument();
  expect(screen.getAllByText(/camera/i).length).toBeGreaterThan(0);
});
