import { render, screen } from "@testing-library/react";

import { RecordEvidenceView } from "@/features/cases/components/record-evidence-view";

test("renders timeline records as a chronology", () => {
  const { container } = render(
    <RecordEvidenceView
      evidence={{
        id: "donor-arrival-log",
        title: "Donor Arrival Log",
        family: "record",
        subtype: "timeline",
        summary: "A condensed chronology of arrivals.",
        source: "evidence/donor-arrival-log.json",
        columns: [
          { id: "timestamp", label: "Timestamp", sortable: true },
          { id: "event", label: "Event" },
        ],
        rows: [
          {
            id: "row-1",
            timestamp: "2026-03-18T21:10:00Z",
            event: "Doors were checked.",
          },
        ],
      }}
    />,
  );

  expect(screen.getByText(/record/i)).toBeInTheDocument();
  expect(screen.getByText(/timeline/i)).toBeInTheDocument();
  expect(screen.getByText(/donor arrival log/i)).toBeInTheDocument();
  expect(screen.getByText(/event 1/i)).toBeInTheDocument();
  expect(
    container.querySelector("[data-record-layout='timeline']"),
  ).toBeInTheDocument();
});
