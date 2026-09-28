import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  BookOpen,
  CalendarRange,
  CheckCircle2,
  Images,
  Plus,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { academicYearService } from '@/services/academics';
import { subjectService, parentService } from '@/services/people';
import { activityService, galleryService, moduleService, settingsService } from '@/services/ops';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Field';
import { DataTable, Pagination, type Column } from '@/components/ui/Table';
import { PageHeader, SearchInput, useDebounced } from '@/components/ui/Primitives';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { ApiError } from '@/lib/http';
import { formatDate, titleCase } from '@/lib/utils';
import type { AcademicYear, ActivityLog, Subject } from '@/types/api';

/* ----------------------------- academic years --------------------------- */

export function AcademicYearsPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [makeCurrent, setMakeCurrent] = useState<AcademicYear | null>(null);
  const [form, setForm] = useState({ name: '', start_date: '', end_date: '' });
  const [error, setError] = useState<ApiError | null>(null);

  const years = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => academicYearService.list({ per_page: 50 }),
  });

  const create = useMutation({
    mutationFn: () => academicYearService.create(form),
    onSuccess: () => {
      toast.success('Academic year created.');
      setFormOpen(false);
      setForm({ name: '', start_date: '', end_date: '' });
      queryClient.invalidateQueries({ queryKey: ['academic-years'] });
      queryClient.invalidateQueries({ queryKey: ['academic-year'] });
    },
    onError: (err: ApiError) => {
      setError(err);
      if (!err.errors) toast.error(err.message);
    },
  });

  const setCurrent = useMutation({
    mutationFn: (id: number) => academicYearService.setCurrent(id),
    onSuccess: () => {
      toast.success('Current academic year updated.');
      setMakeCurrent(null);
      queryClient.invalidateQueries({ queryKey: ['academic-years'] });
      queryClient.invalidateQueries({ queryKey: ['academic-year'] });
    },
    onError: (err: ApiError) => toast.error(err.message),
  });

  const columns: Column<AcademicYear>[] = [
    {
      key: 'name',
      header: 'Academic year',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-ink-900">{row.name}</span>
          {row.is_current && <Badge tone="gold">Current</Badge>}
        </div>
      ),
    },
    { key: 'start', header: 'Starts', render: (row) => formatDate(row.start_date) },
    { key: 'end', header: 'Ends', render: (row) => formatDate(row.end_date) },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone="neutral">{titleCase(row.status ?? 'active')}</Badge>,
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      width: '130px',
      render: (row) =>
        row.is_current ? (
          <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--color-success)]">
            <CheckCircle2 className="size-3.5" />
            In use
          </span>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setMakeCurrent(row)}>
            Make current
          </Button>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Academic years"
        description="Most modules refuse to work until one year is marked current."
        actions={
          <Button icon={<Plus className="size-4" />} onClick={() => setFormOpen(true)}>
            New academic year
          </Button>
        }
      />

      <Card>
        {years.error ? (
          <ErrorState error={years.error} onRetry={() => years.refetch()} />
        ) : (
          <DataTable
            columns={columns}
            rows={years.data?.items ?? []}
            loading={years.isLoading}
            rowKey={(row) => row.id}
            empty={
              <EmptyState
                icon={<CalendarRange className="size-5" />}
                title="No academic year set up"
                description="Create one to unlock attendance, fees, assessments and promotions."
                action={
                  <Button icon={<Plus className="size-4" />} onClick={() => setFormOpen(true)}>
                    New academic year
                  </Button>
                }
              />
            }
          />
        )}
      </Card>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="New academic year"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => create.mutate()} loading={create.isPending}>
              Create
            </Button>
          </>
        }
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <Input
            label="Name"
            required
            placeholder="2026–27"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            error={error?.fieldError('name')}
          />
          <Input
            type="date"
            label="Start date"
            required
            value={form.start_date}
            onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
            error={error?.fieldError('start_date')}
          />
          <Input
            type="date"
            label="End date"
            required
            min={form.start_date}
            value={form.end_date}
            onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
            error={error?.fieldError('end_date')}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(makeCurrent)}
        onClose={() => setMakeCurrent(null)}
        onConfirm={() => makeCurrent && setCurrent.mutate(makeCurrent.id)}
        loading={setCurrent.isPending}
        title="Switch academic year"
        message={`New attendance, fees and assessments will be recorded against ${makeCurrent?.name}. Existing records stay with their own year.`}
        confirmLabel="Make current"
      />
    </>
  );
}

/* -------------------------------- subjects ------------------------------ */

export function SubjectsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  const [error, setError] = useState<ApiError | null>(null);

  const subjects = useQuery({
    queryKey: ['subjects', page],
    queryFn: () => subjectService.list({ page, per_page: 20 }),
    placeholderData: keepPreviousData,
  });

  const create = useMutation({
    mutationFn: () => subjectService.create(form),
    onSuccess: () => {
      toast.success('Subject added.');
      setFormOpen(false);
      setForm({ name: '', code: '', description: '' });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
    onError: (err: ApiError) => {
      setError(err);
      if (!err.errors) toast.error(err.message);
    },
  });

  const columns: Column<Subject>[] = [
    { key: 'name', header: 'Subject', render: (row) => <span className="font-medium text-ink-900">{row.name}</span> },
    { key: 'code', header: 'Code', render: (row) => <span className="tnum text-ink-600">{row.code}</span> },
    {
      key: 'description',
      header: 'Description',
      render: (row) => (
        <span className="line-clamp-1 text-ink-500">{(row.description as string) ?? '—'}</span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Subjects"
        description="The catalogue classes and assignments draw from."
        actions={
          <Button icon={<Plus className="size-4" />} onClick={() => setFormOpen(true)}>
            Add subject
          </Button>
        }
      />

      <Card>
        {subjects.error ? (
          <ErrorState error={subjects.error} onRetry={() => subjects.refetch()} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={subjects.data?.items ?? []}
              loading={subjects.isLoading}
              rowKey={(row) => row.id}
              empty={
                <EmptyState
                  icon={<BookOpen className="size-5" />}
                  title="No subjects yet"
                  description="Add subjects before assigning them to classes and teachers."
                />
              }
            />
            <Pagination meta={subjects.data?.meta} onPage={setPage} />
          </>
        )}
      </Card>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Add subject"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => create.mutate()} loading={create.isPending}>
              Add
            </Button>
          </>
        }
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <Input
            label="Name"
            required
            placeholder="Mathematics"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            error={error?.fieldError('name')}
          />
          <Input
            label="Code"
            required
            placeholder="MATH"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            error={error?.fieldError('code')}
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </form>
      </Modal>
    </>
  );
}

/* -------------------------------- parents ------------------------------- */

export function ParentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search);

  const parents = useQuery({
    queryKey: ['parents', page, debounced],
    queryFn: () =>
      parentService.list({ page, per_page: 20, ...(debounced ? { search: debounced } : {}) }),
    placeholderData: keepPreviousData,
  });

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'name',
      header: 'Parent',
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink-900">
            {String(row.name ?? row.first_name ?? '—')}
          </p>
          <p className="truncate text-[12px] text-ink-500">{String(row.email ?? '')}</p>
        </div>
      ),
    },
    { key: 'phone', header: 'Phone', render: (row) => <span className="tnum">{String(row.phone ?? '—')}</span> },
    {
      key: 'occupation',
      header: 'Occupation',
      render: (row) => String(row.occupation ?? '—'),
    },
    {
      key: 'children',
      header: 'Children',
      align: 'right',
      render: (row) => (
        <span className="tnum">
          {Array.isArray(row.students) ? row.students.length : (row.students_count as number) ?? '—'}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Parents" description="Guardian accounts linked to students." />
      <Card>
        <div className="p-4 hairline-b">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Name, email or phone…"
          />
        </div>
        {parents.error ? (
          <ErrorState error={parents.error} onRetry={() => parents.refetch()} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={parents.data?.items ?? []}
              loading={parents.isLoading}
              rowKey={(row, i) => String(row.id ?? i)}
              empty={
                <EmptyState
                  icon={<Users className="size-5" />}
                  title="No parents on file"
                  description="Parents are created when you add a student, or directly here."
                />
              }
            />
            <Pagination meta={parents.data?.meta} onPage={setPage} />
          </>
        )}
      </Card>
    </>
  );
}

/* ------------------------------ activity log ---------------------------- */

export function ActivityLogPage() {
  const [page, setPage] = useState(1);

  const logs = useQuery({
    queryKey: ['activity-logs', page],
    queryFn: () => activityService.list({ page, per_page: 25 }),
    placeholderData: keepPreviousData,
  });

  const columns: Column<ActivityLog>[] = [
    {
      key: 'when',
      header: 'When',
      width: '170px',
      render: (row) => (
        <span className="text-[12.5px] text-ink-600">
          {formatDate(row.created_at, 'd MMM, h:mm a')}
        </span>
      ),
    },
    {
      key: 'user',
      header: 'User',
      render: (row) => <span className="text-ink-700">{row.user_name ?? `#${row.user_id ?? '—'}`}</span>,
    },
    {
      key: 'action',
      header: 'Action',
      render: (row) => <Badge tone="neutral">{titleCase(row.action)}</Badge>,
    },
    {
      key: 'entity',
      header: 'Entity',
      render: (row) => (
        <span className="text-ink-600">
          {row.entity_type ? `${titleCase(row.entity_type)} ${row.entity_id ?? ''}` : '—'}
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Detail',
      render: (row) => <span className="line-clamp-1 text-ink-500">{row.description ?? '—'}</span>,
    },
  ];

  return (
    <>
      <PageHeader title="Activity log" description="Every write action taken in your school." />
      <Card>
        {logs.error ? (
          <ErrorState error={logs.error} onRetry={() => logs.refetch()} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={logs.data?.items ?? []}
              loading={logs.isLoading}
              rowKey={(row) => row.id}
              empty={
                <EmptyState
                  icon={<ShieldCheck className="size-5" />}
                  title="Nothing logged yet"
                  description="Actions are recorded as staff use the system."
                />
              }
            />
            <Pagination meta={logs.data?.meta} onPage={setPage} />
          </>
        )}
      </Card>
    </>
  );
}

/* -------------------------------- settings ------------------------------ */

export function SettingsPage() {
  const modules = useQuery({
    queryKey: ['modules', 'school'],
    queryFn: moduleService.schoolModules,
    retry: false,
  });

  const settings = useQuery({
    queryKey: ['school-settings'],
    queryFn: settingsService.list,
    retry: false,
  });

  return (
    <>
      <PageHeader
        title="Settings"
        description="Modules your school has activated, and stored configuration."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Modules"
            description="Activated by the platform team for your school."
          />
          <CardBody className="p-0">
            {modules.isLoading ? (
              <div className="space-y-2 p-5">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            ) : modules.error ? (
              <ErrorState error={modules.error} onRetry={() => modules.refetch()} />
            ) : !modules.data?.length ? (
              <EmptyState title="No modules listed" description="Contact your platform admin." />
            ) : (
              <ul className="divide-y divide-[var(--hairline)]">
                {modules.data.map((mod) => (
                  <li key={mod.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium text-ink-900">{mod.name}</p>
                      <p className="truncate text-[12px] text-ink-500">{mod.slug}</p>
                    </div>
                    <Badge tone={mod.status === 'active' ? 'success' : 'neutral'} dot>
                      {titleCase(mod.status ?? 'inactive')}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="School settings" description="Key–value configuration." />
          <CardBody className="p-0">
            {settings.isLoading ? (
              <div className="space-y-2 p-5">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            ) : settings.error ? (
              <ErrorState error={settings.error} onRetry={() => settings.refetch()} />
            ) : !settings.data?.length ? (
              <EmptyState title="Nothing configured" description="Defaults are in use." />
            ) : (
              <dl className="divide-y divide-[var(--hairline)] text-[13px]">
                {settings.data.slice(0, 20).map((setting, i) => {
                  const record = setting as Record<string, unknown>;
                  return (
                    <div key={i} className="flex justify-between gap-4 px-5 py-2.5">
                      <dt className="min-w-0 truncate text-ink-500">
                        {titleCase(String(record.key ?? ''))}
                      </dt>
                      <dd className="max-w-[55%] truncate text-right font-medium text-ink-800">
                        {String(record.value ?? '—')}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}

/* -------------------------------- gallery ------------------------------- */

export function GalleryPage() {
  const [page, setPage] = useState(1);

  const albums = useQuery({
    queryKey: ['gallery', page],
    queryFn: () => galleryService.albums({ page, per_page: 12 }),
    placeholderData: keepPreviousData,
  });

  const rows = useMemo(() => albums.data?.items ?? [], [albums.data]);

  return (
    <>
      <PageHeader title="Gallery" description="Photo albums from events and class activities." />

      {albums.error ? (
        <Card>
          <ErrorState error={albums.error} onRetry={() => albums.refetch()} />
        </Card>
      ) : albums.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[180px]" />
          ))}
        </div>
      ) : !rows.length ? (
        <Card>
          <EmptyState
            icon={<Images className="size-5" />}
            title="No albums yet"
            description="Albums published by the school appear here."
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {rows.map((album, i) => {
              const record = album as Record<string, unknown>;
              const cover = record.cover_image_url as string | undefined;
              return (
                <Card key={String(record.id ?? i)} className="overflow-hidden">
                  <div className="aspect-[4/3] bg-ink-100">
                    {cover ? (
                      <img src={cover} alt="" className="size-full object-cover" loading="lazy" />
                    ) : (
                      <div className="grid size-full place-items-center text-ink-300">
                        <Images className="size-7" />
                      </div>
                    )}
                  </div>
                  <CardBody className="py-3.5">
                    <p className="truncate text-[13.5px] font-medium text-ink-900">
                      {String(record.title ?? record.name ?? 'Untitled album')}
                    </p>
                    <p className="mt-0.5 text-[12px] text-ink-500">
                      {String(record.media_count ?? 0)} items
                      {record.created_at ? ` · ${formatDate(String(record.created_at))}` : ''}
                    </p>
                  </CardBody>
                </Card>
              );
            })}
          </div>
          <Card className="mt-4">
            <Pagination meta={albums.data?.meta} onPage={setPage} />
          </Card>
        </>
      )}
    </>
  );
}

/* ------------------------------- not found ------------------------------ */

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="font-display text-[64px] leading-none text-gold-500">404</p>
      <h1 className="mt-3 text-[24px] text-ink-900">Page not found</h1>
      <p className="mt-1.5 max-w-sm text-sm text-ink-500">
        That link doesn't lead anywhere in SchoolSaavy.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-[var(--radius-field)] bg-navy-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-800"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
