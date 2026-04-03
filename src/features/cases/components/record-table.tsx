"use client";

import { useMemo, useState } from "react";

import type { RecordEvidence } from "@/features/cases/evidence/schema";

type RecordTableProps = {
  columns: RecordEvidence["columns"];
  rows: RecordEvidence["rows"];
};

type SortDirection = "asc" | "desc";

function getNumericSortValue(value: string | number | boolean | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (
    typeof value === "string" &&
    /^-?(?:\d+|\d+\.\d+|\.\d+)$/.test(value.trim())
  ) {
    return Number(value);
  }

  return null;
}

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
      const leftValue = left[sortState.columnId] ?? "";
      const rightValue = right[sortState.columnId] ?? "";
      const leftNumericValue = getNumericSortValue(leftValue);
      const rightNumericValue = getNumericSortValue(rightValue);
      const comparison =
        leftNumericValue !== null && rightNumericValue !== null
          ? leftNumericValue - rightNumericValue
          : String(leftValue).localeCompare(String(rightValue));

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
            className="rounded-full border border-white/10 bg-black/25 px-4 py-3 text-sm text-stone-100 placeholder:text-stone-500 focus:border-emerald-300/40 focus:outline-none"
            onChange={(event) => setFilterValue(event.target.value)}
            placeholder="Search records"
            type="search"
            value={filterValue}
          />
        </label>
      ) : null}

      <div className="overflow-x-auto rounded-3xl border border-emerald-200/10 bg-[#0e1712] shadow-[0_18px_60px_rgba(0,0,0,0.25)]">
        <table className="min-w-full text-left text-sm text-stone-200">
          <thead className="sticky top-0 bg-[#111c16] text-xs uppercase tracking-[0.2em] text-stone-400">
            <tr>
              {columns.map((column) => {
                const isActiveSort = sortState?.columnId === column.id;
                const ariaSort = column.sortable
                  ? isActiveSort
                    ? sortState.direction === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                  : undefined;

                return (
                  <th
                    key={column.id}
                    aria-sort={ariaSort}
                    className="px-4 py-3 font-medium"
                  >
                    {column.sortable ? (
                      <button
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 transition ${
                          isActiveSort
                            ? "border-emerald-200/30 bg-emerald-300/10 text-emerald-100"
                            : "border-white/10 bg-white/5 text-stone-300 hover:border-white/20 hover:bg-white/10"
                        }`}
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
                        {isActiveSort ? (
                          <span
                            aria-hidden="true"
                            className="text-[10px] uppercase tracking-[0.18em]"
                          >
                            {sortState.direction === "asc" ? "ASC" : "DESC"}
                          </span>
                        ) : null}
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, index) => (
              <tr
                key={row.id}
                className={`border-t border-white/10 ${
                  index % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent"
                } hover:bg-white/[0.04]`}
              >
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className="px-4 py-3 align-top text-stone-200"
                  >
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
