import React from 'react';
import type { TableColumn } from '@/types';
import Spinner from './Spinner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TableProps<T extends Record<string, unknown>> {
  columns: TableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  /** Number of skeleton rows to show while loading */
  skeletonRows?: number;
  /** Key extractor — defaults to row._id or index */
  keyExtractor?: (row: T, index: number) => string | number;
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div
            className="h-4 rounded-md"
            style={{
              width: `${55 + ((i * 37) % 45)}%`,
              background:
                'linear-gradient(90deg, #f3f4f6 25%, #e9eaeb 50%, #f3f4f6 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s ease-in-out infinite',
            }}
          />
        </td>
      ))}
    </tr>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({
  message,
  icon,
  cols,
}: {
  message: string;
  icon?: React.ReactNode;
  cols: number;
}) {
  return (
    <tr>
      <td colSpan={cols}>
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-3">
          {icon ?? (
            <svg
              className="w-10 h-10 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4m4-4h8"
              />
            </svg>
          )}
          <p className="text-sm text-gray-500">{message}</p>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Table<T extends Record<string, unknown>>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No records found.',
  emptyIcon,
  skeletonRows = 6,
  keyExtractor,
}: TableProps<T>) {
  function getKey(row: T, index: number): string | number {
    if (keyExtractor) return keyExtractor(row, index);
    return (row._id as string | number | undefined) ?? index;
  }

  return (
    <>
      {/* Shimmer keyframe */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>

      {/* Outer wrapper: horizontal scroll on small screens */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          {/* Header */}
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-gray-100 bg-white">
            {isLoading ? (
              Array.from({ length: skeletonRows }).map((_, i) => (
                <SkeletonRow key={i} cols={columns.length} />
              ))
            ) : data.length === 0 ? (
              <EmptyState
                message={emptyMessage}
                icon={emptyIcon}
                cols={columns.length}
              />
            ) : (
              data.map((row, index) => (
                <tr
                  key={getKey(row, index)}
                  className="hover:bg-gray-50 transition-colors duration-75"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-4 py-3 text-gray-700 whitespace-nowrap"
                    >
                      {col.render
                        ? col.render(row)
                        : (row[col.key] as React.ReactNode) ?? (
                            <span className="text-gray-400">—</span>
                          )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}