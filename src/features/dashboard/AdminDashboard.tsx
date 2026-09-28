import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  CalendarDays,
  GraduationCap,
  Layers,
  Receipt,
  UserCheck,
  UserSquare2,
} from 'lucide-react';
import { dashboardService } from '@/services/ops';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { PageHeader, StatCard } from '@/components/ui/Primitives';
import { Badge } from '@/components/ui/Badge';
import { EmptyState, ErrorState, PageLoader } from '@/components/ui/Feedback';
import {
  AttendanceTrend,
  DistributionChart,
  FeeCollectionChart,
  SimpleBar,
} from '@/components/charts/Charts';
import { formatCurrency, formatDate, formatNumber, percent } from '@/lib/utils';
import { useAuth } from '@/app/auth-context';

export function AdminDashboard() {
  const { school } = useAuth();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: dashboardService.admin,
    staleTime: 3 * 60 * 1000,
  });

  if (isLoading) return <PageLoader label="Loading your school" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;

  const dash = data?.data;
  const notification = data?.notification;
  const info = dash?.school_info;
  const stats = dash?.quick_stats;
  const analytics = dash?.analytics;

  const attendanceTotal = (stats?.present_today ?? 0) + (stats?.absent_today ?? 0);

  const attendanceSeries =
    analytics?.attendance_graph?.chart_data?.dates?.map((date, i) => ({
      date: formatDate(date, 'd MMM'),
      present: analytics.attendance_graph.chart_data.present?.[i] ?? 0,
      absent: analytics.attendance_graph.chart_data.absent?.[i] ?? 0,
    })) ?? [];

  const feeSeries =
    analytics?.fee_collection?.chart_data?.months?.map((month, i) => ({
      month,
      collected: analytics.fee_collection.chart_data.collected?.[i] ?? 0,
      pending: analytics.fee_collection.chart_data.pending?.[i] ?? 0,
    })) ?? [];

  const classDistribution =
    analytics?.class_distribution?.labels?.map((name, i) => ({
      name,
      value: analytics.class_distribution.data?.[i] ?? 0,
    })) ?? [];

  const classPerformance =
    analytics?.performance_analytics?.class_performance?.labels?.map((name, i) => ({
      name,
      value: analytics.performance_analytics.class_performance.data?.[i] ?? 0,
    })) ?? [];

  return (
    <>
      <PageHeader
        title={info?.name ? info.name : (school?.name ?? 'Dashboard')}
        description={
          info?.code
            ? `School code ${info.code} · ${formatNumber(info.total_students)} students on roll`
            : 'Everything happening in your school today.'
        }
      />

      {notification && (
        <div className="mb-6 flex flex-col gap-3 rounded-[var(--radius-card)] border border-gold-300 bg-gold-50 p-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold text-gold-800">{notification.title}</p>
            <p className="mt-0.5 text-[13px] text-gold-700">{notification.message}</p>
          </div>
          {notification.action && (
            <Link
              to="/academic-years"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-field)] bg-navy-900 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-navy-800"
            >
              {notification.action.text}
              <ArrowUpRight className="size-3.5" />
            </Link>
          )}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Students"
          value={formatNumber(info?.total_students)}
          sublabel={`${formatNumber(info?.total_classes)} classes`}
          icon={<GraduationCap className="size-4" />}
          accent="navy"
        />
        <StatCard
          label="Present today"
          value={formatNumber(stats?.present_today)}
          sublabel={
            attendanceTotal
              ? `${percent(stats?.present_today ?? 0, attendanceTotal)} of those marked`
              : 'Attendance not marked yet'
          }
          icon={<UserCheck className="size-4" />}
          accent="gold"
        />
        <StatCard
          label="Pending fees"
          value={formatCurrency(stats?.pending_fees, true)}
          sublabel="Outstanding across all plans"
          icon={<Receipt className="size-4" />}
        />
        <StatCard
          label="Teachers"
          value={formatNumber(info?.total_teachers)}
          sublabel={`${formatNumber(info?.active_modules)} modules active`}
          icon={<UserSquare2 className="size-4" />}
        />
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Attendance, last 30 days"
            description="Daily present and absent counts across the school"
            action={
              <Link
                to="/attendance"
                className="text-[13px] font-medium text-navy-900 underline-offset-4 hover:underline"
              >
                Open
              </Link>
            }
          />
          <CardBody className="pl-2">
            {attendanceSeries.length ? (
              <AttendanceTrend data={attendanceSeries} />
            ) : (
              <EmptyState
                icon={<UserCheck className="size-5" />}
                title="No attendance recorded yet"
                description="Once teachers start marking registers, the trend shows up here."
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Students by class" description="Where the roll sits today" />
          <CardBody>
            {classDistribution.length ? (
              <DistributionChart data={classDistribution} />
            ) : (
              <EmptyState
                icon={<Layers className="size-5" />}
                title="No classes yet"
                description="Create classes and assign students to see the split."
              />
            )}
          </CardBody>
        </Card>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Fee collection"
            description="Collected against pending, by month"
            action={
              <Link
                to="/fees"
                className="text-[13px] font-medium text-navy-900 underline-offset-4 hover:underline"
              >
                Open
              </Link>
            }
          />
          <CardBody className="pl-2">
            {feeSeries.length ? (
              <FeeCollectionChart data={feeSeries} />
            ) : (
              <EmptyState
                icon={<Receipt className="size-5" />}
                title="No fee data"
                description="Set up a fee structure and assign plans to students."
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Upcoming events"
            action={
              <Link
                to="/events"
                className="text-[13px] font-medium text-navy-900 underline-offset-4 hover:underline"
              >
                All
              </Link>
            }
          />
          <CardBody className="p-0">
            {dash?.upcoming_events?.length ? (
              <ul className="divide-y divide-[var(--hairline)]">
                {dash.upcoming_events.slice(0, 5).map((event) => (
                  <li key={event.id} className="flex gap-3 px-5 py-3.5">
                    <div className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-field)] bg-navy-900 text-white">
                      <span className="text-[15px] font-semibold leading-none tnum">
                        {formatDate(event.event_date, 'd')}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-gold-400">
                        {formatDate(event.event_date, 'MMM')}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium text-ink-900">
                        {event.title}
                      </p>
                      <p className="mt-0.5 truncate text-[12px] text-ink-500">
                        {event.formatted_time ?? 'All day'}
                        {event.location ? ` · ${event.location}` : ''}
                      </p>
                    </div>
                    {event.priority === 'urgent' || event.priority === 'high' ? (
                      <Badge tone={event.priority === 'urgent' ? 'danger' : 'warning'}>
                        {event.priority}
                      </Badge>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={<CalendarDays className="size-5" />}
                title="Nothing scheduled"
                description="Events you publish will be listed here."
              />
            )}
          </CardBody>
        </Card>
      </section>

      {classPerformance.length > 0 && (
        <section className="mt-5">
          <Card>
            <CardHeader
              title="Average performance by class"
              description="Mean marks across published assessments"
            />
            <CardBody className="pl-2">
              <SimpleBar data={classPerformance} color="#C9A84C" valueLabel="Avg marks" />
            </CardBody>
          </Card>
        </section>
      )}
    </>
  );
}
