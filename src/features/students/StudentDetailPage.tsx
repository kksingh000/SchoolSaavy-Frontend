import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CalendarCheck, Phone, Receipt, User } from 'lucide-react';
import { studentService } from '@/services/people';
import { feeService } from '@/services/fees';
import { assignmentService } from '@/services/academics';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Avatar, PageHeader, StatCard, Tabs } from '@/components/ui/Primitives';
import { Badge, statusTone } from '@/components/ui/Badge';
import { EmptyState, ErrorState, PageLoader, Skeleton } from '@/components/ui/Feedback';
import { DataTable, type Column } from '@/components/ui/Table';
import { formatCurrency, formatDate, titleCase } from '@/lib/utils';
import type { Assignment, FeePayment } from '@/types/api';

export function StudentDetailPage() {
  const { id = '' } = useParams();
  const [tab, setTab] = useState('overview');

  const student = useQuery({
    queryKey: ['students', id],
    queryFn: () => studentService.get(id),
    enabled: Boolean(id),
  });

  const fees = useQuery({
    queryKey: ['fees', 'summary', id],
    queryFn: () => feeService.summary(id),
    enabled: Boolean(id) && tab === 'overview',
    retry: false,
  });

  const attendance = useQuery({
    queryKey: ['students', id, 'attendance'],
    queryFn: () => studentService.attendanceReport(id),
    enabled: Boolean(id) && (tab === 'overview' || tab === 'attendance'),
    retry: false,
  });

  const assignments = useQuery({
    queryKey: ['assignments', 'student', id],
    queryFn: () => assignmentService.forStudent(id),
    enabled: Boolean(id) && tab === 'assignments',
    retry: false,
  });

  const payments = useQuery({
    queryKey: ['fees', 'payments', id],
    queryFn: () => feeService.paymentHistory(id, { per_page: 25 }),
    enabled: Boolean(id) && tab === 'fees',
    retry: false,
  });

  if (student.isLoading) return <PageLoader label="Loading student" />;
  if (student.error) return <ErrorState error={student.error} onRetry={() => student.refetch()} />;

  const s = student.data!;
  const attendanceSummary = (attendance.data ?? {}) as Record<string, number | undefined>;
  const presentPct =
    attendanceSummary.attendance_percentage ?? attendanceSummary.percentage ?? undefined;

  const assignmentColumns: Column<Assignment>[] = [
    {
      key: 'title',
      header: 'Assignment',
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink-900">{row.title}</p>
          <p className="truncate text-[12px] text-ink-500">
            {row.subject?.name ?? titleCase(row.type)}
          </p>
        </div>
      ),
    },
    { key: 'due', header: 'Due', render: (row) => formatDate(row.due_date) },
    {
      key: 'marks',
      header: 'Max marks',
      align: 'right',
      render: (row) => <span className="tnum">{row.max_marks ?? '—'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge tone={row.is_overdue ? 'danger' : statusTone(row.status)}>
          {row.is_overdue ? 'Overdue' : titleCase(row.status)}
        </Badge>
      ),
    },
  ];

  const paymentColumns: Column<FeePayment>[] = [
    { key: 'date', header: 'Date', render: (row) => formatDate(row.payment_date) },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (row) => <span className="font-medium tnum">{formatCurrency(row.amount)}</span>,
    },
    { key: 'mode', header: 'Mode', render: (row) => titleCase(row.payment_mode) },
    {
      key: 'ref',
      header: 'Reference',
      render: (row) => (
        <span className="text-[12px] text-ink-500 tnum">
          {row.receipt_number ?? row.reference_number ?? '—'}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={`${s.first_name} ${s.last_name}`}
        breadcrumb={
          <Link
            to="/students"
            className="inline-flex items-center gap-1.5 text-[13px] text-ink-500 transition-colors hover:text-navy-900"
          >
            <ArrowLeft className="size-3.5" />
            Students
          </Link>
        }
        description={`${s.admission_number}${s.class_name ? ` · ${s.class_name}` : ''}`}
      />

      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        {/* ------------------------------ profile ------------------------- */}
        <Card className="h-fit">
          <CardBody className="text-center">
            <Avatar
              name={`${s.first_name} ${s.last_name}`}
              src={s.profile_photo_url}
              size={84}
              className="mx-auto"
            />
            <p className="mt-3 text-[17px] font-semibold text-ink-900">
              {s.first_name} {s.last_name}
            </p>
            <p className="mt-0.5 text-[13px] text-ink-500 tnum">{s.admission_number}</p>
            <div className="mt-2.5 flex justify-center gap-2">
              <Badge tone={s.is_active ? 'success' : 'neutral'} dot>
                {s.is_active ? 'Active' : 'Inactive'}
              </Badge>
              {s.class_name && <Badge tone="gold">{s.class_name}</Badge>}
            </div>
          </CardBody>
          <dl className="divide-y divide-[var(--hairline)] hairline-t text-[13px]">
            {[
              ['Roll number', s.roll_number ?? '—'],
              ['Date of birth', formatDate(s.date_of_birth)],
              ['Gender', titleCase(s.gender)],
              ['Blood group', s.blood_group ?? '—'],
              ['Admitted', formatDate(s.admission_date)],
              ['Phone', s.phone ?? '—'],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex justify-between gap-3 px-5 py-2.5">
                <dt className="text-ink-500">{label}</dt>
                <dd className="text-right font-medium text-ink-800">{value}</dd>
              </div>
            ))}
            <div className="px-5 py-3">
              <dt className="text-ink-500">Address</dt>
              <dd className="mt-1 leading-relaxed text-ink-800">{s.address || '—'}</dd>
            </div>
          </dl>
        </Card>

        {/* ------------------------------- detail -------------------------- */}
        <div className="min-w-0">
          <Card>
            <div className="px-2">
              <Tabs
                active={tab}
                onChange={setTab}
                tabs={[
                  { id: 'overview', label: 'Overview' },
                  { id: 'attendance', label: 'Attendance' },
                  { id: 'assignments', label: 'Assignments' },
                  { id: 'fees', label: 'Fees' },
                ]}
              />
            </div>

            {tab === 'overview' && (
              <CardBody className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  {attendance.isLoading ? (
                    <>
                      <Skeleton className="h-[108px]" />
                      <Skeleton className="h-[108px]" />
                      <Skeleton className="h-[108px]" />
                    </>
                  ) : (
                    <>
                      <StatCard
                        label="Attendance"
                        value={presentPct !== undefined ? `${Math.round(presentPct)}%` : '—'}
                        sublabel="This academic year"
                        icon={<CalendarCheck className="size-4" />}
                        accent="gold"
                      />
                      <StatCard
                        label="Fees due"
                        value={
                          fees.data?.total_due !== undefined
                            ? formatCurrency(fees.data.total_due, true)
                            : '—'
                        }
                        sublabel={
                          fees.data?.next_due_date
                            ? `Next ${formatDate(fees.data.next_due_date)}`
                            : 'No plan assigned'
                        }
                        icon={<Receipt className="size-4" />}
                      />
                      <StatCard
                        label="Fees paid"
                        value={
                          fees.data?.total_paid !== undefined
                            ? formatCurrency(fees.data.total_paid, true)
                            : '—'
                        }
                        sublabel="Lifetime"
                        icon={<Receipt className="size-4" />}
                      />
                    </>
                  )}
                </div>

                <div className="rounded-[var(--radius-field)] bg-ink-50 p-4">
                  <p className="label-caps mb-2">Guardian contact</p>
                  <p className="flex items-center gap-2 text-[13px] text-ink-700">
                    <Phone className="size-3.5 text-ink-400" />
                    {s.phone ?? 'No number on file'}
                  </p>
                </div>
              </CardBody>
            )}

            {tab === 'attendance' && (
              <CardBody>
                {attendance.isLoading ? (
                  <Skeleton className="h-48" />
                ) : attendance.error ? (
                  <ErrorState error={attendance.error} onRetry={() => attendance.refetch()} />
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {Object.entries(attendanceSummary)
                      .filter(([, v]) => typeof v === 'number')
                      .slice(0, 8)
                      .map(([key, value]) => (
                        <div
                          key={key}
                          className="rounded-[var(--radius-field)] border border-ink-200 p-3.5"
                        >
                          <p className="label-caps">{titleCase(key)}</p>
                          <p className="mt-1 text-xl font-semibold text-ink-900 tnum">
                            {String(value)}
                          </p>
                        </div>
                      ))}
                  </div>
                )}
              </CardBody>
            )}

            {tab === 'assignments' &&
              (assignments.error ? (
                <ErrorState error={assignments.error} onRetry={() => assignments.refetch()} />
              ) : (
                <DataTable
                  columns={assignmentColumns}
                  rows={assignments.data ?? []}
                  loading={assignments.isLoading}
                  rowKey={(row) => row.id}
                  empty={
                    <EmptyState
                      icon={<User className="size-5" />}
                      title="No assignments"
                      description="Nothing has been set for this student's class yet."
                    />
                  }
                />
              ))}

            {tab === 'fees' &&
              (payments.error ? (
                <ErrorState error={payments.error} onRetry={() => payments.refetch()} />
              ) : (
                <DataTable
                  columns={paymentColumns}
                  rows={payments.data?.items ?? []}
                  loading={payments.isLoading}
                  rowKey={(row) => row.id}
                  empty={
                    <EmptyState
                      icon={<Receipt className="size-5" />}
                      title="No payments recorded"
                      description="Collected payments will be receipted here."
                    />
                  }
                />
              ))}
          </Card>
        </div>
      </div>
    </>
  );
}
