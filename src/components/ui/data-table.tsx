import React from "react";

export interface DataTableProps<T> {
  columns: { key: string; label: string; className?: string }[];
  data: T[];
  renderRow: (item: T) => React.ReactNode;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T>({ columns, data, renderRow, emptyMessage = "No data available.", className = "" }: DataTableProps<T>) {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={`px-4 py-3 ${col.className || ""}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.length > 0 ? (
              data.map((item) => renderRow(item))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
