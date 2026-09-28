import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const variants: Record<Variant, string> = {
  primary:
    'bg-navy-900 text-white hover:bg-navy-800 active:bg-navy-950 disabled:bg-ink-300 disabled:text-ink-100',
  gold: 'bg-gold-500 text-navy-900 hover:bg-gold-400 active:bg-gold-600 disabled:bg-gold-200 disabled:text-gold-700',
  secondary:
    'bg-white text-navy-900 border border-ink-200 hover:bg-ink-50 hover:border-ink-300 active:bg-ink-100 disabled:text-ink-400',
  ghost: 'bg-transparent text-ink-700 hover:bg-ink-100 active:bg-ink-200 disabled:text-ink-400',
  danger:
    'bg-danger text-white hover:brightness-110 active:brightness-95 disabled:bg-ink-300',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-[15px] gap-2',
  icon: 'h-10 w-10 p-0 justify-center',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', loading, icon, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-[var(--radius-field)] font-medium',
        'transition-colors duration-150 disabled:cursor-not-allowed select-none whitespace-nowrap',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {size !== 'icon' && children}
    </button>
  );
});
