import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationMeta } from '@/types/api';

export interface Column<T> {
  key: string;
  header: ReactNode;
  /** Right-align numeric columns so digits line up. */
  align?: 'left' | 'right' | 'center';
  width?: string;
  render: (row: T, index: number) => ReactNode;
}

export function DataTable<T>({
  columns,
  rows,
  loading,
  empty,
  onRowClick,
  rowKey,
  className,
}: {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  empty?: ReactNode;
  onRowClick?: (row: T) => void;
  rowKey: (row: T, index: number) => string | number;
  className?: string;
}) {
  if (loading) return <TableSkeleton columns={columns.length} />;

  if (!rows.length) {
    return (
      <div className="px-5 py-14 text-center">
        {empty ?? <p className="text-sm text-ink-500">Nothing here yet.</p>}
      </div>
    );
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="hairline-b bg-ink-50/70">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                style={{ width: col.width }}
                className={cn(
                  'px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500',
                  col.align === 'right' && 'text-right',
                  col.align === 'center' && 'text-center',
                  (!col.align || col.align === 'left') && 'text-left',
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={rowKey(row, i)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                'hairline-b last:border-b-0 transition-colors',
                onRowClick && 'cursor-pointer hover:bg-gold-50/50',
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-ink-700 align-middle',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                  )}
                >
                  {col.render(row, i)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TableSkeleton({ columns = 5, rows = 6 }: { columns?: number; rows?: number }) {
  return (
    <div className="p-4">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 py-3">
          {Array.from({ length: columns }).map((__, c) => (
            <div
              key={c}
              className="shimmer h-4 rounded"
              style={{ width: c === 0 ? '22%' : `${Math.max(10, 70 / columns)}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function Pagination({
  meta,
  onPage,
}: {
  meta: PaginationMeta | undefined;
  onPage: (page: number) => void;
}) {
  if (!meta || meta.last_page <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3 hairline-t">
      <p className="text-[13px] text-ink-500 tnum">
        {meta.from ?? 0}–{meta.to ?? 0} of {meta.total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={meta.current_page <= 1}
          onClick={() => onPage(meta.current_page - 1)}
          icon={<ChevronLeft className="size-4" />}
        >
          Prev
        </Button>
        <span className="text-[13px] text-ink-600 tnum px-1">
          {meta.current_page} / {meta.last_page}
        </span>
        <Button
          size="sm"
          variant="secondary"
          disabled={meta.current_page >= meta.last_page}
          onClick={() => onPage(meta.current_page + 1)}
        >
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
