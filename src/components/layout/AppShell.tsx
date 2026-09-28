import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, LogOut, Menu, User, X } from 'lucide-react';
import { useAuth } from '@/app/auth-context';
import { visibleNavigation } from '@/app/navigation';
import { moduleService, notificationService } from '@/services/ops';
import { academicYearService } from '@/services/academics';
import { Avatar } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { cn, titleCase } from '@/lib/utils';

function Logo({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden>
        <rect width="32" height="32" rx="7" fill="#C9A84C" />
        <path d="M16 6 5 11.5 16 17l11-5.5L16 6Z" fill="#0A0F2C" />
        <path
          d="M9 14.6v5.1c0 2.2 3.1 4 7 4s7-1.8 7-4v-5.1l-7 3.5-7-3.5Z"
          fill="#0A0F2C"
          opacity=".6"
        />
      </svg>
      {!compact && (
        <span className="font-display text-[17px] font-semibold tracking-tight text-white">
          SchoolSaavy
        </span>
      )}
    </div>
  );
}

export function AppShell() {
  const { user, school, logout, role, demo, enterDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  const { data: modules } = useQuery({
    queryKey: ['modules', 'school'],
    queryFn: moduleService.schoolModules,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  const { data: academicYear } = useQuery({
    queryKey: ['academic-year', 'current'],
    queryFn: academicYearService.current,
    staleTime: 10 * 60 * 1000,
    retry: false,
    enabled: role === 'school_admin' || role === 'teacher',
  });

  const { data: unread } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationService.unreadCount,
    refetchInterval: 90_000,
    retry: false,
    enabled: role === 'parent',
  });

  const activeModules = useMemo(
    () =>
      new Set(
        (modules ?? [])
          .filter((m) => !m.status || m.status === 'active')
          .map((m) => m.slug),
      ),
    [modules],
  );

  const sections = visibleNavigation(role, activeModules);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-[var(--surface)]">
      {/* ------------------------------ sidebar ------------------------------ */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col bg-navy-900 transition-transform duration-200 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Logo />
          <button
            className="text-navy-200 hover:text-white lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>

        {school?.name && (
          <div className="mx-4 mb-3 rounded-[var(--radius-field)] bg-white/[0.07] px-3 py-2.5">
            <p className="truncate text-[13px] font-medium text-white">{school.name}</p>
            <p className="mt-0.5 text-[11px] text-navy-200">
              {academicYear?.name ? `AY ${academicYear.name}` : titleCase(role ?? '')}
            </p>
          </div>
        )}

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-5">
          {sections.map((section) => (
            <div key={section.heading}>
              <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-300">
                {section.heading}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === '/'}
                      className={({ isActive }) =>
                        cn(
                          'group flex items-center gap-2.5 rounded-[var(--radius-field)] px-3 py-2 text-[13.5px] transition-colors',
                          isActive
                            ? 'bg-white/10 font-medium text-white'
                            : 'text-navy-100/80 hover:bg-white/[0.06] hover:text-white',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon
                            className={cn(
                              'size-[17px] shrink-0',
                              isActive ? 'text-gold-400' : 'text-navy-200 group-hover:text-gold-400',
                            )}
                          />
                          <span className="truncate">{item.label}</span>
                          {item.to === '/notifications' && (unread?.count ?? 0) > 0 && (
                            <span className="ml-auto rounded-full bg-gold-500 px-1.5 text-[10px] font-semibold text-navy-900 tnum">
                              {unread!.count}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-[var(--radius-field)] px-3 py-2 text-[13.5px] text-navy-100/80 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <LogOut className="size-[17px] text-navy-200" />
            Sign out
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-navy-950/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* ------------------------------- main -------------------------------- */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-[264px]">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-[var(--hairline)] bg-white/85 px-4 backdrop-blur-md sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-[var(--radius-pill)] py-1 pl-1 pr-2.5 transition-colors hover:bg-ink-100"
              >
                <Avatar name={user?.name} size={30} />
                <span className="hidden text-[13px] font-medium text-ink-800 sm:block">
                  {user?.name}
                </span>
                <ChevronDown className="size-3.5 text-ink-400" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden />
                  <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-pop)] hairline">
                    <div className="px-4 py-3 hairline-b">
                      <p className="truncate text-[13px] font-semibold text-ink-900">{user?.name}</p>
                      <p className="truncate text-[12px] text-ink-500">{user?.email}</p>
                      <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-gold-700">
                        {titleCase(role ?? '')}
                      </p>
                    </div>
                    <NavLink
                      to="/profile"
                      className="flex items-center gap-2 px-4 py-2.5 text-[13px] text-ink-700 hover:bg-ink-50"
                    >
                      <User className="size-4 text-ink-400" />
                      My profile
                    </NavLink>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-[13px] text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
                    >
                      <LogOut className="size-4" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {demo && (
          <div className="flex flex-col gap-2 border-b border-gold-300 bg-gold-50 px-4 py-2.5 sm:flex-row sm:items-center sm:px-6">
            <p className="text-[13px] text-gold-800">
              <span className="font-semibold">Demo</span> — sample data, viewing as{' '}
              {titleCase(role ?? '')}. Nothing you do here is saved.
            </p>
            <div className="flex items-center gap-2 sm:ml-auto">
              {(['school_admin', 'teacher', 'parent'] as const)
                .filter((r) => r !== role)
                .map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      enterDemo(r);
                      navigate('/', { replace: true });
                    }}
                    className="rounded-[var(--radius-field)] border border-gold-400 bg-white px-2.5 py-1 text-[12px] font-medium text-navy-900 hover:bg-gold-100"
                  >
                    View as {titleCase(r)}
                  </button>
                ))}
              <button
                onClick={handleLogout}
                className="rounded-[var(--radius-field)] px-2.5 py-1 text-[12px] font-medium text-gold-800 underline-offset-2 hover:underline"
              >
                Exit
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1280px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
