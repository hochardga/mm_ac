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

test("sorts numeric-looking values numerically instead of lexicographically", async () => {
  render(
    <RecordTable
      columns={[
        { id: "amount", label: "Amount", sortable: true },
        { id: "description", label: "Description" },
      ]}
      rows={[
        { id: "high", amount: "10", description: "Ten credits" },
        { id: "low", amount: "2", description: "Two credits" },
      ]}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: /amount/i }));

  const rows = screen.getAllByRole("row");

  expect(rows[1]).toHaveTextContent("2");
  expect(rows[2]).toHaveTextContent("10");
});

test("exposes horizontal scrolling and active sort state", async () => {
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

  const table = screen.getByRole("table");
  const timestampHeader = screen.getByRole("columnheader", { name: /timestamp/i });
  const timestampSortButton = screen.getByRole("button", { name: /timestamp/i });

  expect(table.parentElement).toHaveClass("overflow-x-auto");
  expect(table.parentElement).not.toHaveClass("overflow-hidden");
  expect(timestampHeader).toHaveAttribute("aria-sort", "none");

  fireEvent.click(timestampSortButton);

  expect(timestampHeader).toHaveAttribute("aria-sort", "ascending");
  expect(timestampHeader).toHaveTextContent("ASC");

  fireEvent.click(timestampSortButton);

  expect(timestampHeader).toHaveAttribute("aria-sort", "descending");
  expect(timestampHeader).toHaveTextContent("DESC");
});
