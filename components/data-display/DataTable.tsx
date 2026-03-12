"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
}

interface DataTableProps {
  title: string;
  columns: Column[];
  rows: Record<string, any>[];
  onEntityClick?: (type: string, id: string) => void;
}

export function DataTable({ title, columns: rawColumns, rows: rawRows, onEntityClick, ...rest }: DataTableProps & { [key: string]: any }) {
  // Normalize columns: accept string[] or Column[]
  const columns: Column[] = (rawColumns || []).map((col: any) =>
    typeof col === "string" ? { key: col.toLowerCase().replace(/\s+/g, "_"), label: col, sortable: true } : col
  );

  // Normalize rows: accept array-of-arrays or array-of-objects
  const rows: Record<string, any>[] = (rawRows || []).map((row: any) => {
    if (Array.isArray(row)) {
      const obj: Record<string, any> = {};
      columns.forEach((col, i) => { obj[col.key] = row[i] ?? ""; });
      return obj;
    }
    return row;
  });
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;
    return [...rows].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === "number"
        ? aVal - bVal
        : String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [rows, sortKey, sortDir]);

  const isEntityCell = (key: string, row: Record<string, any>) => {
    return (key === "name" || key.endsWith("_name")) && row.id && row.type;
  };

  return (
    <div className="rounded-lg border border-stone-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
        <h3 className="text-sm font-semibold text-stone-800">{title}</h3>
        <span className="text-xs text-stone-400">
          {rows.length} {rows.length === 1 ? "row" : "rows"}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-2.5 text-left text-xs font-medium text-stone-500 uppercase tracking-wider",
                    col.sortable && "cursor-pointer select-none hover:text-stone-700"
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      <span className="inline-flex flex-col">
                        {sortKey === col.key ? (
                          sortDir === "asc" ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )
                        ) : (
                          <ChevronsUpDown className="h-3.5 w-3.5 text-stone-300" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, i) => (
              <tr
                key={row.id ?? i}
                className={cn(
                  "border-b border-stone-50 last:border-0",
                  i % 2 === 1 && "bg-stone-50/50"
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-2.5 text-stone-700">
                    {isEntityCell(col.key, row) && onEntityClick ? (
                      <button
                        className="text-brand-amber hover:underline font-medium text-left"
                        onClick={() => onEntityClick(row.type, row.id)}
                      >
                        {row[col.key]}
                      </button>
                    ) : (
                      row[col.key]
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-stone-400 text-sm"
                >
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
