import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'gold' | 'navy';

const tones: Record<Tone, string> = {
  neutral: 'bg-ink-100 text-ink-700 ring-ink-200',
  success: 'bg-[var(--color-success-soft)] text-[var(--color-success)] ring-[var(--color-success)]/20',
  warning: 'bg-[var(--color-warning-soft)] text-[var(--color-warning)] ring-[var(--color-warning)]/20',
  danger: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)] ring-[var(--color-danger)]/20',
  info: 'bg-[var(--color-info-soft)] text-[var(--color-info)] ring-[var(--color-info)]/20',
  gold: 'bg-gold-50 text-gold-700 ring-gold-300/50',
  navy: 'bg-navy-900 text-white ring-navy-900',
};

export function Badge({
  children,
  tone = 'neutral',
  className,
  dot,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-2.5 py-0.5',
        'text-[12px] font-medium ring-1 ring-inset whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}

/** Maps the backend's attendance/assignment/fee status strings to a tone. */
export function statusTone(status: string | null | undefined): Tone {
  switch ((status ?? '').toLowerCase()) {
    case 'present':
    case 'paid':
    case 'active':
    case 'graded':
    case 'published':
    case 'completed':
    case 'submitted':
      return 'success';
    case 'late':
    case 'partial':
    case 'pending':
    case 'draft':
    case 'excused':
      return 'warning';
    case 'absent':
    case 'overdue':
    case 'failed':
    case 'inactive':
    case 'rejected':
      return 'danger';
    case 'leave':
    case 'scheduled':
    case 'upcoming':
      return 'info';
    default:
      return 'neutral';
  }
}
