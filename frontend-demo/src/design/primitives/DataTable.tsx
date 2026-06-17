import type { ReactNode } from 'react';

interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyField: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export function DataTable<T>({ columns, rows, keyField, onRowClick, emptyMessage = 'No data' }: DataTableProps<T>) {
  if (!rows.length) {
    return <p className="py-8 text-center font-body text-sm text-[var(--fg-2)]">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse font-body text-sm">
        <thead>
          <tr className="border-b border-[var(--panel-border)] bg-[var(--bg-0)]/60 text-left text-[var(--fg-2)]">
            {columns.map((col) => (
              <th key={col.key} className={`px-3 py-2.5 text-xs font-semibold uppercase tracking-wide ${col.className ?? ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={keyField(row)}
              onClick={() => onRowClick?.(row)}
              className={`border-b border-[var(--panel-border)]/80 text-[var(--fg-0)] transition-colors ${onRowClick ? 'cursor-pointer hover:bg-[var(--bg-0)]/80' : ''}`}
            >
              {columns.map((col) => (
                <td key={col.key} className={`px-3 py-2.5 ${col.className ?? ''}`}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
