import { useMemo, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ClipboardList, Plus } from 'lucide-react';
import { assignmentService } from '@/services/academics';
import { classService, subjectService } from '@/services/people';
import { useAuth } from '@/app/auth-context';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, statusTone } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea, Checkbox } from '@/components/ui/Field';
import { DataTable, Pagination, type Column } from '@/components/ui/Table';
import { PageHeader, SearchInput, Tabs, useDebounced } from '@/components/ui/Primitives';
import { EmptyState, ErrorState } from '@/components/ui/Feedback';
import { ApiError } from '@/lib/http';
import { formatDate, titleCase, toApiDate } from '@/lib/utils';
import type { Assignment } from '@/types/api';

const TYPES = ['homework', 'classwork', 'project', 'practice'];

export function AssignmentsPage() {
  const { isRole } = useAuth();
  const queryClient = useQueryClient();
  const canEdit = isRole('school_admin', 'teacher');

  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [classId, setClassId] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  const debounced = useDebounced(search);

  const classes = useQuery({
    queryKey: ['classes', isRole('teacher') ? 'mine' : 'simple'],
    queryFn: () => (isRole('teacher') ? classService.myClassesSimple() : classService.simple()),
    staleTime: 10 * 60 * 1000,
  });

  const params = useMemo(
    () => ({
      page,
      per_page: 15,
      ...(debounced ? { search: debounced } : {}),
      ...(classId ? { class_id: classId } : {}),
      ...(tab !== 'all' ? { status: tab } : {}),
    }),
    [page, debounced, classId, tab],
  );

  const assignments = useQuery({
    queryKey: ['assignments', params],
    queryFn: () => assignmentService.list(params),
    placeholderData: keepPreviousData,
  });

  const columns: Column<Assignment>[] = [
    {
      key: 'title',
      header: 'Assignment',
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink-900">{row.title}</p>
          <p className="truncate text-[12px] text-ink-500">
            {[row.subject?.name, row.class?.name && `${row.class.name} ${row.class.section ?? ''}`]
              .filter(Boolean)
              .join(' · ') || titleCase(row.type)}
          </p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => <Badge tone="neutral">{titleCase(row.type)}</Badge>,
    },
    {
      key: 'due',
      header: 'Due',
      render: (row) => (
        <div>
          <p className="text-ink-700">{formatDate(row.due_date)}</p>
          {row.is_overdue ? (
            <p className="text-[12px] text-[var(--color-danger)]">Overdue</p>
          ) : row.days_until_due >= 0 ? (
            <p className="text-[12px] text-ink-400">
              in {row.days_until_due} day{row.days_until_due === 1 ? '' : 's'}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'submissions',
      header: 'Submitted',
      align: 'right',
      render: (row) => {
        const stats = row.submission_stats ?? {};
        return (
          <span className="tnum text-ink-700">
            {stats.submitted ?? 0}
            <span className="text-ink-400"> / {stats.total ?? 0}</span>
          </span>
        );
      },
    },
    {
      key: 'marks',
      header: 'Max',
      align: 'right',
      width: '70px',
      render: (row) => <span className="tnum">{row.max_marks ?? '—'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone={statusTone(row.status)}>{titleCase(row.status)}</Badge>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Assignments"
        description="Homework, projects and classwork across your classes."
        actions={
          canEdit && (
            <Button icon={<Plus className="size-4" />} onClick={() => setFormOpen(true)}>
              New assignment
            </Button>
          )
        }
      />

      <Card>
        <div className="px-2">
          <Tabs
            active={tab}
            onChange={(id) => {
              setTab(id);
              setPage(1);
            }}
            tabs={[
              { id: 'all', label: 'All' },
              { id: 'published', label: 'Published' },
              { id: 'draft', label: 'Drafts' },
            ]}
          />
        </div>

        <div className="flex flex-col gap-3 p-4 hairline-b sm:flex-row sm:items-center">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search assignments…"
          />
          <Select
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              setPage(1);
            }}
            placeholder="All classes"
            className="sm:ml-auto sm:w-48"
            options={(classes.data ?? []).map((c) => ({
              value: c.id,
              label: `${c.name}${c.section ? ` ${c.section}` : ''}`,
            }))}
          />
        </div>

        {assignments.error ? (
          <ErrorState error={assignments.error} onRetry={() => assignments.refetch()} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={assignments.data?.items ?? []}
              loading={assignments.isLoading}
              rowKey={(row) => row.id}
              empty={
                <EmptyState
                  icon={<ClipboardList className="size-5" />}
                  title="No assignments"
                  description={
                    search || classId
                      ? 'Nothing matches those filters.'
                      : 'Set your first assignment and students will see it in their portal.'
                  }
                  action={
                    canEdit &&
                    !search &&
                    !classId && (
                      <Button icon={<Plus className="size-4" />} onClick={() => setFormOpen(true)}>
                        New assignment
                      </Button>
                    )
                  }
                />
              }
            />
            <Pagination meta={assignments.data?.meta} onPage={setPage} />
          </>
        )}
      </Card>

      <AssignmentFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          queryClient.invalidateQueries({ queryKey: ['assignments'] });
        }}
      />
    </>
  );
}

/* --------------------------------- form --------------------------------- */

function AssignmentFormModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { isRole } = useAuth();
  const [form, setForm] = useState({
    title: '',
    description: '',
    instructions: '',
    type: 'homework',
    class_id: '',
    subject_id: '',
    assigned_date: toApiDate(),
    due_date: '',
    due_time: '',
    max_marks: '',
    allow_late_submission: false,
    is_published: true,
  });
  const [error, setError] = useState<ApiError | null>(null);

  const classes = useQuery({
    queryKey: ['classes', isRole('teacher') ? 'mine' : 'simple'],
    queryFn: () => (isRole('teacher') ? classService.myClassesSimple() : classService.simple()),
    enabled: open,
    staleTime: 10 * 60 * 1000,
  });

  const subjects = useQuery({
    queryKey: ['subjects', 'class', form.class_id],
    queryFn: () => subjectService.byClass(form.class_id),
    enabled: open && Boolean(form.class_id),
  });

  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      isRole('teacher')
        ? assignmentService.create(payload)
        : assignmentService.create(payload),
    onSuccess: () => {
      toast.success('Assignment created.');
      onSaved();
    },
    onError: (err: ApiError) => {
      setError(err);
      if (!err.errors) toast.error(err.message);
    },
  });

  const set = (key: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));
  const err = (field: string) => error?.fieldError(field);

  function submit() {
    setError(null);
    save.mutate({
      title: form.title.trim(),
      type: form.type,
      class_id: Number(form.class_id),
      subject_id: Number(form.subject_id),
      assigned_date: form.assigned_date,
      due_date: form.due_date,
      allow_late_submission: form.allow_late_submission,
      status: form.is_published ? 'published' : 'draft',
      ...(form.description ? { description: form.description.trim() } : {}),
      ...(form.instructions ? { instructions: form.instructions.trim() } : {}),
      ...(form.due_time ? { due_time: form.due_time } : {}),
      ...(form.max_marks ? { max_marks: Number(form.max_marks) } : {}),
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="New assignment"
      description="Students in the selected class see it as soon as it is published."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} loading={save.isPending}>
            Create assignment
          </Button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Input
          label="Title"
          required
          placeholder="Chapter 4 — Quadratic equations"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          error={err('title')}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            label="Class"
            required
            value={form.class_id}
            onChange={(e) => {
              set('class_id', e.target.value);
              set('subject_id', '');
            }}
            placeholder="Select…"
            error={err('class_id')}
            options={(classes.data ?? []).map((c) => ({
              value: c.id,
              label: `${c.name}${c.section ? ` ${c.section}` : ''}`,
            }))}
          />
          <Select
            label="Subject"
            required
            disabled={!form.class_id}
            value={form.subject_id}
            onChange={(e) => set('subject_id', e.target.value)}
            placeholder={form.class_id ? 'Select…' : 'Pick a class first'}
            error={err('subject_id')}
            options={(subjects.data ?? []).map((s) => ({ value: s.id, label: s.name }))}
          />
          <Select
            label="Type"
            required
            value={form.type}
            onChange={(e) => set('type', e.target.value)}
            error={err('type')}
            options={TYPES.map((t) => ({ value: t, label: titleCase(t) }))}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <Input
            type="date"
            label="Assigned"
            required
            value={form.assigned_date}
            onChange={(e) => set('assigned_date', e.target.value)}
            error={err('assigned_date')}
          />
          <Input
            type="date"
            label="Due date"
            required
            min={form.assigned_date}
            value={form.due_date}
            onChange={(e) => set('due_date', e.target.value)}
            error={err('due_date')}
          />
          <Input
            type="time"
            label="Due time"
            value={form.due_time}
            onChange={(e) => set('due_time', e.target.value)}
            error={err('due_time')}
          />
          <Input
            type="number"
            label="Max marks"
            min={0}
            value={form.max_marks}
            onChange={(e) => set('max_marks', e.target.value)}
            error={err('max_marks')}
          />
        </div>

        <Textarea
          label="Description"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          error={err('description')}
        />

        <Textarea
          label="Instructions"
          rows={4}
          placeholder="What students should do, and how it will be graded."
          value={form.instructions}
          onChange={(e) => set('instructions', e.target.value)}
          error={err('instructions')}
        />

        <div className="flex flex-wrap gap-5 rounded-[var(--radius-field)] bg-ink-50 px-4 py-3">
          <Checkbox
            label="Allow late submissions"
            checked={form.allow_late_submission}
            onChange={(e) => set('allow_late_submission', e.target.checked)}
          />
          <Checkbox
            label="Publish immediately"
            checked={form.is_published}
            onChange={(e) => set('is_published', e.target.checked)}
          />
        </div>

        {error && !error.errors && (
          <p className="rounded-[var(--radius-field)] bg-[var(--color-danger-soft)] px-3.5 py-2.5 text-[13px] text-[var(--color-danger)]">
            {error.message}
          </p>
        )}
      </form>
    </Modal>
  );
}
