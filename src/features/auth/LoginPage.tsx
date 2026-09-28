import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Lock, Mail, PlayCircle } from 'lucide-react';
import { useAuth } from '@/app/auth-context';
import { DEMO_ROLES } from '@/demo/session';
import { ApiError } from '@/lib/http';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Field';
import { cn } from '@/lib/utils';
import type { UserType } from '@/types/api';

const ROLES: { value: UserType; label: string; blurb: string }[] = [
  { value: 'school_admin', label: 'Administrator', blurb: 'Run the whole school' },
  { value: 'teacher', label: 'Teacher', blurb: 'Classes and marks' },
  { value: 'parent', label: 'Parent', blurb: 'Follow your child' },
];

export function LoginPage() {
  const { login, user, bootstrapping, enterDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [userType, setUserType] = useState<UserType>('school_admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!bootstrapping && user) {
    const from = (location.state as { from?: string } | null)?.from ?? '/';
    return <Navigate to={from} replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email: email.trim(), password, user_type: userType });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError('Login failed', 0));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* ------------------------------ brand side ------------------------- */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-navy-900 p-12 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #C9A84C 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
          aria-hidden
        />
        <div className="relative flex items-center gap-3">
          <svg viewBox="0 0 32 32" className="size-9" aria-hidden>
            <rect width="32" height="32" rx="7" fill="#C9A84C" />
            <path d="M16 6 5 11.5 16 17l11-5.5L16 6Z" fill="#0A0F2C" />
            <path
              d="M9 14.6v5.1c0 2.2 3.1 4 7 4s7-1.8 7-4v-5.1l-7 3.5-7-3.5Z"
              fill="#0A0F2C"
              opacity=".6"
            />
          </svg>
          <span className="font-display text-xl font-semibold text-white">SchoolSaavy</span>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-[40px] leading-[1.1] text-white">
            One school,
            <br />
            <span className="text-gold-400">every record</span> in place.
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-navy-100/75">
            Admissions, attendance, timetables, assessments and fee collection — each school's
            data isolated end to end, from the token to the query.
          </p>

          <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-white/10 pt-6">
            {[
              ['Modules', '14'],
              ['Roles', '4'],
              ['Tenancy', 'Isolated'],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-300">
                  {label}
                </dt>
                <dd className="mt-1 font-display text-2xl text-gold-400">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="relative text-[12px] text-navy-300">
          © {new Date().getFullYear()} SchoolSaavy
        </p>
      </aside>

      {/* ------------------------------ form side -------------------------- */}
      <main className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 lg:hidden">
            <svg viewBox="0 0 32 32" className="size-10" aria-hidden>
              <rect width="32" height="32" rx="7" fill="#0A0F2C" />
              <path d="M16 6 5 11.5 16 17l11-5.5L16 6Z" fill="#C9A84C" />
              <path
                d="M9 14.6v5.1c0 2.2 3.1 4 7 4s7-1.8 7-4v-5.1l-7 3.5-7-3.5Z"
                fill="#C9A84C"
                opacity=".6"
              />
            </svg>
          </div>

          <h2 className="text-[28px] text-ink-900">Sign in</h2>
          <p className="mt-1.5 text-sm text-ink-500">
            Pick how you use SchoolSaavy, then enter your credentials.
          </p>

          <form onSubmit={onSubmit} className="mt-7 space-y-5" noValidate>
            <div>
              <Label>I am a…</Label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map((role) => {
                  const selected = userType === role.value;
                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => setUserType(role.value)}
                      aria-pressed={selected}
                      className={cn(
                        'rounded-[var(--radius-field)] border px-2.5 py-2.5 text-left transition-all',
                        selected
                          ? 'border-gold-500 bg-gold-50 ring-2 ring-gold-500/25'
                          : 'border-ink-200 bg-white hover:border-ink-300',
                      )}
                    >
                      <span
                        className={cn(
                          'block text-[13px] font-medium',
                          selected ? 'text-navy-900' : 'text-ink-700',
                        )}
                      >
                        {role.label}
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-tight text-ink-400">
                        {role.blurb}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Input
              name="email"
              type="email"
              label="Email"
              autoComplete="username"
              required
              placeholder="you@school.edu"
              leading={<Mail className="size-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error?.fieldError('email')}
            />

            <div>
              <Input
                name="password"
                type={showPassword ? 'text' : 'password'}
                label="Password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                leading={<Lock className="size-4" />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={error?.fieldError('password')}
                className="pr-10"
              />
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute -top-[34px] right-3 text-ink-400 transition-colors hover:text-ink-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error && !error.errors && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-[var(--radius-field)] bg-[var(--color-danger-soft)] px-3.5 py-3"
              >
                <AlertCircle className="mt-px size-4 shrink-0 text-[var(--color-danger)]" />
                <p className="text-[13px] leading-snug text-[var(--color-danger)]">
                  {error.message}
                </p>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" loading={submitting}>
              Sign in
            </Button>

            <div className="text-center">
              <Link
                to="/forgot-password"
                className="text-[13px] text-ink-500 underline-offset-4 transition-colors hover:text-navy-900 hover:underline"
              >
                Forgot your password?
              </Link>
            </div>
          </form>

          {/* No account? Explore the whole app with sample data, no backend. */}
          <div className="mt-8">
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-ink-200" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                Or explore the demo
              </span>
              <span className="h-px flex-1 bg-ink-200" />
            </div>

            <p className="mt-3 text-center text-[13px] text-ink-500">
              Sample data, no sign-in needed. Pick a role to see what they see.
            </p>

            <div className="mt-3.5 space-y-2">
              {DEMO_ROLES.map((option) => (
                <button
                  key={option.role}
                  type="button"
                  onClick={() => {
                    enterDemo(option.role);
                    navigate('/', { replace: true });
                  }}
                  className={cn(
                    'group flex w-full items-center gap-3 rounded-[var(--radius-field)] border border-ink-200 bg-white px-3.5 py-2.5 text-left',
                    'transition-all hover:border-gold-400 hover:bg-gold-50/60',
                  )}
                >
                  <PlayCircle className="size-[18px] shrink-0 text-ink-400 transition-colors group-hover:text-gold-600" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-medium text-ink-900">
                      Explore as {option.label}
                    </span>
                    <span className="block truncate text-[12px] text-ink-500">{option.blurb}</span>
                  </span>
                  <span className="shrink-0 text-ink-300 transition-transform group-hover:translate-x-0.5">›</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
