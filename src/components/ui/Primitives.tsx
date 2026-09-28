import { useEffect, useState, type ReactNode } from 'react';
import { Search, TrendingDown, TrendingUp } from 'lucide-react';
import { cn, initials } from '@/lib/utils';
import { Input } from './Field';

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {breadcrumb && <div className="mb-1.5">{breadcrumb}</div>}
        <h1 className="text-[26px] text-ink-900 sm:text-[30px]">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-ink-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function StatCard({
  label,
  value,
  sublabel,
  icon,
  trend,
  accent,
}: {
  label: string;
  value: ReactNode;
  sublabel?: string;
  icon?: ReactNode;
  trend?: { value: number; label?: string };
  accent?: 'gold' | 'navy' | 'plain';
}) {
  const up = (trend?.value ?? 0) >= 0;
  return (
    <div
      className={cn(
        'rounded-[var(--radius-card)] bg-white p-5 hairline shadow-[var(--shadow-card)]',
        accent === 'navy' && 'bg-navy-900 border-navy-900',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p
          className={cn(
            'label-caps',
            accent === 'navy' && 'text-navy-200',
          )}
        >
          {label}
        </p>
        {icon && (
          <span
            className={cn(
              'grid size-8 place-items-center rounded-[var(--radius-field)]',
              accent === 'gold'
                ? 'bg-gold-50 text-gold-700'
                : accent === 'navy'
                  ? 'bg-white/10 text-gold-400'
                  : 'bg-ink-100 text-ink-500',
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <p
        className={cn(
          'mt-2.5 text-[28px] font-semibold leading-none tnum',
          accent === 'navy' ? 'text-white' : 'text-ink-900',
        )}
      >
        {value}
      </p>
      <div className="mt-2 flex items-center gap-2">
        {trend && (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-[12px] font-medium',
              up ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]',
            )}
          >
            {up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
            {Math.abs(trend.value)}%
          </span>
        )}
        {sublabel && (
          <span className={cn('text-[12px]', accent === 'navy' ? 'text-navy-200' : 'text-ink-500')}>
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}

export function Avatar({
  name,
  src,
  size = 36,
  className,
}: {
  name?: string | null;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name ?? ''}
        onError={() => setFailed(true)}
        style={{ width: size, height: size }}
        className={cn('shrink-0 rounded-full object-cover hairline', className)}
      />
    );
  }
  return (
    <span
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.36) }}
      className={cn(
        'grid shrink-0 place-items-center rounded-full bg-navy-900 font-semibold text-gold-400',
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      leading={<Search className="size-4" />}
      className={cn('sm:w-64', className)}
      type="search"
    />
  );
}

/** Debounced value — keeps list endpoints from firing on every keystroke. */
export function useDebounced<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string; count?: number }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto hairline-b" role="tablist">
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative whitespace-nowrap px-3.5 py-2.5 text-[13px] font-medium transition-colors',
              selected ? 'text-navy-900' : 'text-ink-500 hover:text-ink-700',
            )}
          >
            {tab.label}
            {typeof tab.count === 'number' && (
              <span className="ml-1.5 rounded-[var(--radius-pill)] bg-ink-100 px-1.5 py-0.5 text-[11px] text-ink-600 tnum">
                {tab.count}
              </span>
            )}
            {selected && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gold-500" />
            )}
          </button>
        );
      })}
    </div>
  );
}
