import { fireEvent, render, screen } from "@testing-library/react";

import { RecordTable } from "@/features/cases/components/record-table";

test("sorts rows by a chosen column", async () => {
  render(
    <RecordTable
      columns={[
        { id: "timestamp", label: "Timestamp", sortable: true },
        { id: "origin", label: "Origin" },
      ]}
      rows={[
        { id: "b", timestamp: "2026-03-02T01:20:00Z", origin: "Pier 9" },
        { id: "a", timestamp: "2026-03-01T23:55:00Z", origin: "Signal Room" },
      ]}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: /timestamp/i }));

  const rows = screen.getAllByRole("row");

  expect(rows[1]).toHaveTextContent("2026-03-01T23:55:00Z");
  expect(rows[2]).toHaveTextContent("2026-03-02T01:20:00Z");
});
