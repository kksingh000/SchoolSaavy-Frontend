import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  BookOpenCheck,
  CalendarClock,
  ClipboardList,
  GraduationCap,
  Layers,
  Users,
} from 'lucide-react';
import { useAuth } from '@/app/auth-context';
import { dashboardService, parentPortalService } from '@/services/ops';
import { timetableService } from '@/services/academics';
import { AdminDashboard } from './AdminDashboard';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Avatar, PageHeader, StatCard } from '@/components/ui/Primitives';
import { EmptyState, ErrorState, PageLoader } from '@/components/ui/Feedback';
import { Badge } from '@/components/ui/Badge';
import { formatNumber, formatTime, fullName, titleCase } from '@/lib/utils';
import type { TeacherDashboard as TeacherDashboardData } from '@/types/api';

export function DashboardPage() {
  const { role } = useAuth();
  if (role === 'school_admin') return <AdminDashboard />;
  if (role === 'teacher') return <TeacherHome />;
  if (role === 'parent') return <ParentHome />;
  return <PageLoader />;
}

/* ------------------------------- teacher -------------------------------- */

const METRIC_ICONS: Record<string, typeof Layers> = {
  total_classes: Layers,
  total_students: GraduationCap,
  total_assignments: ClipboardList,
  pending_submissions: BookOpenCheck,
};

function TeacherHome() {
  const { user } = useAuth();

  const dashboard = useQuery({
    queryKey: ['dashboard', 'teacher'],
    queryFn: dashboardService.teacher,
    staleTime: 3 * 60 * 1000,
  });

  const schedule = useQuery({
    queryKey: ['timetable', 'my-schedule'],
    queryFn: timetableService.mySchedule,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  if (dashboard.isLoading) return <PageLoader label="Loading your classes" />;
  if (dashboard.error)
    return <ErrorState error={dashboard.error} onRetry={() => dashboard.refetch()} />;

  const data = dashboard.data as TeacherDashboardData | undefined;
  const metrics = data?.dashboard_metrics ?? {};
  const today = (data?.today_schedule ?? schedule.data ?? []).slice(0, 8);

  return (
    <>
      <PageHeader
        title={`Good day, ${user?.name?.split(' ')[0] ?? 'there'}`}
        description={
          data?.teacher_info
            ? `${data.teacher_info.employee_id} · ${data.teacher_info.classes_assigned} ${
                data.teacher_info.classes_assigned === 1 ? 'class' : 'classes'
              } assigned`
            : undefined
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Object.entries(metrics)
          .slice(0, 4)
          .map(([key, value], i) => {
            const Icon = METRIC_ICONS[key] ?? Layers;
            return (
              <StatCard
                key={key}
                label={titleCase(key)}
                value={formatNumber(value)}
                icon={<Icon className="size-4" />}
                accent={i === 0 ? 'navy' : i === 1 ? 'gold' : 'plain'}
              />
            );
          })}
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Today's schedule"
            description="Your periods for the day"
            action={
              <Link
                to="/timetable"
                className="text-[13px] font-medium text-navy-900 underline-offset-4 hover:underline"
              >
                Full week
              </Link>
            }
          />
          <CardBody className="p-0">
            {today.length ? (
              <ul className="divide-y divide-[var(--hairline)]">
                {today.map((slot, i) => (
                  <li key={slot.id ?? i} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="w-[68px] shrink-0 text-[12px] text-ink-500 tnum">
                      {formatTime(slot.start_time)}
                    </div>
                    <div className="h-8 w-px shrink-0 bg-gold-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium text-ink-900">
                        {slot.subject?.name ?? 'Period'}
                      </p>
                      <p className="truncate text-[12px] text-ink-500">
                        {slot.class?.name}
                        {slot.class?.section ? ` ${slot.class.section}` : ''}
                        {slot.room ? ` · ${slot.room}` : ''}
                      </p>
                    </div>
                    <Link
                      to={`/attendance?class_id=${slot.class_id ?? ''}`}
                      className="shrink-0 rounded-[var(--radius-field)] border border-ink-200 px-2.5 py-1 text-[12px] font-medium text-navy-900 hover:bg-ink-50"
                    >
                      Mark
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={<CalendarClock className="size-5" />}
                title="No periods today"
                description="Your timetable is clear, or it hasn't been published yet."
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Quick actions" description="The things you do most days" />
          <CardBody className="grid grid-cols-2 gap-3">
            {[
              { to: '/attendance', label: 'Mark attendance', icon: BookOpenCheck },
              { to: '/assignments/new', label: 'New assignment', icon: ClipboardList },
              { to: '/classes', label: 'My classes', icon: Layers },
              { to: '/assessments', label: 'Enter marks', icon: GraduationCap },
            ].map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="group flex flex-col gap-2 rounded-[var(--radius-field)] border border-ink-200 p-4 transition-all hover:border-gold-400 hover:bg-gold-50/50"
              >
                <action.icon className="size-5 text-ink-400 transition-colors group-hover:text-gold-600" />
                <span className="text-[13px] font-medium text-ink-800">{action.label}</span>
              </Link>
            ))}
          </CardBody>
        </Card>
      </section>
    </>
  );
}

/* -------------------------------- parent -------------------------------- */

function ParentHome() {
  const { user } = useAuth();

  const children = useQuery({
    queryKey: ['parent', 'children'],
    queryFn: parentPortalService.children,
    staleTime: 10 * 60 * 1000,
  });

  if (children.isLoading) return <PageLoader label="Loading your children" />;
  if (children.error)
    return <ErrorState error={children.error} onRetry={() => children.refetch()} />;

  const kids = (children.data ?? []) as Record<string, string | number | null>[];

  return (
    <>
      <PageHeader
        title={`Welcome, ${user?.name?.split(' ')[0] ?? ''}`}
        description="Attendance, assignments and fees for each of your children."
      />

      {kids.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {kids.map((child) => (
            <Card key={String(child.id)} className="overflow-hidden">
              <div className="flex items-center gap-3 bg-navy-900 px-5 py-4">
                <Avatar
                  name={fullName(child as never)}
                  src={child.profile_photo_url as string | null}
                  size={42}
                  className="ring-2 ring-gold-400/40"
                />
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-white">
                    {fullName(child as never)}
                  </p>
                  <p className="truncate text-[12px] text-navy-200">
                    {(child.class_name as string) ?? 'Class not assigned'}
                    {child.admission_number ? ` · ${child.admission_number}` : ''}
                  </p>
                </div>
              </div>
              <CardBody className="space-y-2">
                {[
                  { label: 'Attendance', to: `/children/${child.id}/attendance` },
                  { label: 'Assignments', to: `/children/${child.id}/assignments` },
                  { label: 'Fees', to: `/fees?student_id=${child.id}` },
                ].map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="flex items-center justify-between rounded-[var(--radius-field)] px-3 py-2 text-[13px] text-ink-700 transition-colors hover:bg-ink-50"
                  >
                    {link.label}
                    <span className="text-ink-300">›</span>
                  </Link>
                ))}
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={<Users className="size-5" />}
            title="No children linked to your account"
            description="Ask the school office to link your child's record to this account."
          />
        </Card>
      )}

      <section className="mt-5">
        <Card>
          <CardHeader title="What's next" description="Upcoming across all your children" />
          <CardBody className="p-0">
            <EmptyState
              icon={<CalendarClock className="size-5" />}
              title="Nothing due right now"
              description="Assignments and events appear here as teachers publish them."
              action={
                <Link
                  to="/events"
                  className="text-[13px] font-medium text-navy-900 underline-offset-4 hover:underline"
                >
                  Browse school events
                </Link>
              }
            />
          </CardBody>
        </Card>
      </section>
    </>
  );
}
