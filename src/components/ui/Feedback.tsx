import type { ReactNode } from 'react';
import { AlertCircle, Inbox, Loader2, RefreshCw, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { ApiError } from '@/lib/http';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('size-5 animate-spin text-ink-400', className)} aria-hidden />;
}

export function PageLoader({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-[340px] flex-col items-center justify-center gap-3">
      <Spinner className="size-6 text-gold-500" />
      <p className="text-sm text-ink-500">{label}…</p>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <div className="mb-3 grid size-11 place-items-center rounded-full bg-ink-100 text-ink-400">
        {icon ?? <Inbox className="size-5" />}
      </div>
      <p className="text-[15px] font-semibold text-ink-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-[13px] text-ink-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
  className,
}: {
  error: unknown;
  onRetry?: () => void;
  className?: string;
}) {
  const apiError = error instanceof ApiError ? error : null;
  const offline = apiError?.code === 'NETWORK';
  const forbidden = apiError?.status === 403;

  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <div className="mb-3 grid size-11 place-items-center rounded-full bg-[var(--color-danger-soft)] text-[var(--color-danger)]">
        {offline ? <WifiOff className="size-5" /> : <AlertCircle className="size-5" />}
      </div>
      <p className="text-[15px] font-semibold text-ink-900">
        {offline ? 'Cannot reach the server' : forbidden ? 'Not available to you' : 'Something went wrong'}
      </p>
      <p className="mt-1 max-w-md text-[13px] text-ink-500">
        {apiError?.message ?? 'Unexpected error.'}
      </p>
      {apiError?.code === 'MODULE_ACCESS_DENIED' && (
        <p className="mt-2 max-w-md text-[13px] text-ink-500">
          This module is not activated for your school.
        </p>
      )}
      {onRetry && !forbidden && (
        <Button
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={onRetry}
          icon={<RefreshCw className="size-4" />}
        >
          Try again
        </Button>
      )}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('shimmer rounded-[var(--radius-field)]', className)} />;
}

/** Wraps the standard query states so pages don't repeat the ladder. */
export function QueryBoundary({
  isLoading,
  error,
  isEmpty,
  onRetry,
  emptyState,
  loader,
  children,
}: {
  isLoading: boolean;
  error: unknown;
  isEmpty?: boolean;
  onRetry?: () => void;
  emptyState?: ReactNode;
  loader?: ReactNode;
  children: ReactNode;
}) {
  if (isLoading) return <>{loader ?? <PageLoader />}</>;
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (isEmpty && emptyState) return <>{emptyState}</>;
  return <>{children}</>;
}
