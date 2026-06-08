'use client';

import type { ReactNode } from 'react';
import { cn } from '../cn';

export interface Column<T> {
  key: string;
  header: string;
  /** Cell renderer; receives the row. */
  render: (row: T) => ReactNode;
  /** Optional className for the cell + header. */
  className?: string;
}

export interface TableProps<T> {
  /** Accessible caption describing the table (can be visually hidden). */
  caption: string;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  hideCaption?: boolean;
  className?: string;
}

/** Semantic data table with scope-d headers and a caption (NFR-01). */
export function Table<T>({
  caption,
  columns,
  rows,
  rowKey,
  hideCaption = true,
  className,
}: TableProps<T>): React.ReactElement {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('w-full border-collapse text-left text-base', className)}>
        <caption className={cn('text-fg-muted', hideCaption ? 'sr-only' : 'mb-2 text-left')}>
          {caption}
        </caption>
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn('px-4 py-3 text-sm font-semibold text-fg-muted', col.className)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-border last:border-0 hover:bg-surface">
              {columns.map((col) => (
                <td key={col.key} className={cn('px-4 py-3 text-fg', col.className)}>
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
