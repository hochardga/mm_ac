"use client";

import { useMemo, useState } from "react";

import type { RecordEvidence } from "@/features/cases/evidence/schema";

type RecordTableProps = {
  columns: RecordEvidence["columns"];
  rows: RecordEvidence["rows"];
};

type SortDirection = "asc" | "desc";

export function RecordTable({ columns, rows }: RecordTableProps) {
  const [sortState, setSortState] = useState<{
    columnId: string;
    direction: SortDirection;
  } | null>(null);
  const [filterValue, setFilterValue] = useState("");

  const visibleRows = useMemo(() => {
    const loweredFilter = filterValue.trim().toLowerCase();
    const filterableColumns = columns.filter((column) => column.filterable);

    let nextRows = rows;

    if (loweredFilter && filterableColumns.length > 0) {
      nextRows = nextRows.filter((row) =>
        filterableColumns.some((column) =>
          String(row[column.id] ?? "")
            .toLowerCase()
            .includes(loweredFilter),
        ),
      );
    }

    if (!sortState) {
      return nextRows;
    }

    return [...nextRows].sort((left, right) => {
      const leftValue = String(left[sortState.columnId] ?? "");
      const rightValue = String(right[sortState.columnId] ?? "");
      const comparison = leftValue.localeCompare(rightValue);

      return sortState.direction === "asc" ? comparison : comparison * -1;
    });
  }, [columns, filterValue, rows, sortState]);

  return (
    <div className="space-y-4">
      {columns.some((column) => column.filterable) ? (
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.2em] text-stone-400">
            Filter records
          </span>
          <input
            className="rounded-full border border-white/10 bg-black/20 px-4 py-3 text-sm text-stone-100"
            onChange={(event) => setFilterValue(event.target.value)}
            placeholder="Search notes"
            type="search"
            value={filterValue}
          />
        </label>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/20">
        <table className="min-w-full text-left text-sm text-stone-200">
          <thead className="bg-white/5 text-xs uppercase tracking-[0.2em] text-stone-400">
            <tr>
              {columns.map((column) => (
                <th key={column.id} className="px-4 py-3 font-medium">
                  {column.sortable ? (
                    <button
                      className="inline-flex items-center gap-2"
                      onClick={() =>
                        setSortState((current) => {
                          if (current?.columnId === column.id) {
                            return {
                              columnId: column.id,
                              direction:
                                current.direction === "asc" ? "desc" : "asc",
                            };
                          }

                          return {
                            columnId: column.id,
                            direction: "asc",
                          };
                        })
                      }
                      type="button"
                    >
                      {column.label}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.id} className="border-t border-white/10">
                {columns.map((column) => (
                  <td key={column.id} className="px-4 py-3 align-top">
                    {String(row[column.id] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
