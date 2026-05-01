import { Inbox } from 'lucide-react';
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
    <tr className="border-b border-slate-100 last:border-0 dark:border-[#1a2236]">
      {Array.from({ length: cols }).map((_, index) => (
        <td key={index} className="px-5 py-4 first:pl-6 last:pr-6">
          <div
            className="h-4 rounded-md bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] animate-shimmer dark:from-slate-800 dark:via-slate-700 dark:to-slate-800"
            style={{ width: `${55 + ((index * 37) % 45)}%` }}
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
        <div className="py-20 text-center">
          <div className="mx-auto flex max-w-xs flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
              {icon ?? <Inbox className="h-8 w-8 text-slate-300 dark:text-slate-600" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-400">
                No records found
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-600">
                {message}
              </p>
            </div>
          </div>
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
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card dark:border-[#1e293b] dark:bg-[#111827]">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 dark:border-[#1e293b] dark:bg-[#0A0F1E]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="whitespace-nowrap px-5 py-3.5 text-left text-2xs font-semibold uppercase tracking-wider text-slate-500 first:pl-6 last:pr-6 dark:text-slate-500"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
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
                  className="border-b border-slate-100 transition-colors duration-100 last:border-0 hover:bg-slate-50/50 dark:border-[#1a2236] dark:hover:bg-[#1a2236]/60"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="whitespace-nowrap px-5 py-4 text-slate-700 first:pl-6 last:pr-6 dark:text-slate-300"
                    >
                      {column.render ? (
                        column.render(row)
                      ) : (
                        getValue(row, column.key) ?? <span className="text-slate-400">-</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
