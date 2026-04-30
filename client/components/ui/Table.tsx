import React from 'react';
import type { TableColumn } from '@/types';

interface TableProps<T extends object> {
  columns: TableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  skeletonRows?: number;
  keyExtractor?: (row: T, index: number) => string | number;
}

function getValue(row: object, key: string): React.ReactNode {
  return (row as Record<string, React.ReactNode>)[key];
}

function getDefaultKey(row: object, index: number): string | number {
  return (row as { _id?: string | number })._id ?? index;
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      {Array.from({ length: cols }).map((_, index) => (
        <td key={index} className="px-4 py-3">
          <div
            className="h-4 rounded-md"
            style={{
              width: `${55 + ((index * 37) % 45)}%`,
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

export default function Table<T extends object>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No records found.',
  emptyIcon,
  skeletonRows = 6,
  keyExtractor,
}: TableProps<T>) {
  function getKey(row: T, index: number): string | number {
    return keyExtractor ? keyExtractor(row, index) : getDefaultKey(row, index);
  }

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 bg-white">
            {isLoading ? (
              Array.from({ length: skeletonRows }).map((_, index) => (
                <SkeletonRow key={index} cols={columns.length} />
              ))
            ) : data.length === 0 ? (
              <EmptyState message={emptyMessage} icon={emptyIcon} cols={columns.length} />
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={getKey(row, rowIndex)}
                  className="hover:bg-gray-50 transition-colors duration-75"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-4 py-3 text-gray-700 whitespace-nowrap"
                    >
                      {column.render ? (
                        column.render(row)
                      ) : (
                        getValue(row, column.key) ?? <span className="text-gray-400">-</span>
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
