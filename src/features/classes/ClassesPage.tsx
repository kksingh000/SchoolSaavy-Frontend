import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Layers, Plus, Users } from 'lucide-react';
import { classService, teacherService } from '@/services/people';
import { useAuth } from '@/app/auth-context';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Table';
import { PageHeader, SearchInput, useDebounced } from '@/components/ui/Primitives';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { ApiError } from '@/lib/http';
import { percent } from '@/lib/utils';
import type { ClassRoom, Teacher } from '@/types/api';

export function ClassesPage() {
  const { isRole } = useAuth();
  const queryClient = useQueryClient();
  const canEdit = isRole('school_admin');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ClassRoom | null>(null);

  const debounced = useDebounced(search);
  const params = useMemo(
    () => ({ page, per_page: 12, ...(debounced ? { search: debounced } : {}) }),
    [page, debounced],
  );

  const classes = useQuery({
    queryKey: ['classes', 'list', params],
    queryFn: () => classService.list(params),
    placeholderData: keepPreviousData,
  });

  const teachers = useQuery({
    queryKey: ['teachers', 'picker'],
    queryFn: () => teacherService.list({ per_page: 100 }),
    enabled: canEdit,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <>
      <PageHeader
        title="Classes"
        description={
          classes.data?.meta.total
            ? `${classes.data.meta.total} classes this academic year`
            : 'Grades, sections and their class teachers.'
        }
        actions={
          canEdit && (
            <Button
              icon={<Plus className="size-4" />}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              New class
            </Button>
          )
        }
      />

      <div className="mb-5">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search classes…"
        />
      </div>

      {classes.error ? (
        <Card>
          <ErrorState error={classes.error} onRetry={() => classes.refetch()} />
        </Card>
      ) : classes.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[168px]" />
          ))}
        </div>
      ) : !classes.data?.items.length ? (
        <Card>
          <EmptyState
            icon={<Layers className="size-5" />}
            title={search ? 'No classes match' : 'No classes yet'}
            description={
              search
                ? 'Try a different name or grade.'
                : 'Create your first class, then assign a teacher and students.'
            }
            action={
              canEdit &&
              !search && (
                <Button
                  icon={<Plus className="size-4" />}
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                >
                  New class
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {classes.data.items.map((classroom) => {
              const enrolled = classroom.students_count ?? 0;
              const fill = classroom.capacity ? (enrolled / classroom.capacity) * 100 : 0;
              return (
                <Card key={classroom.id} className="group flex flex-col">
                  <CardBody className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-sans text-[16px] font-semibold tracking-normal text-ink-900">
                          {classroom.name}
                          {classroom.section && (
                            <span className="ml-1.5 text-gold-600">{classroom.section}</span>
                          )}
                        </h3>
                        <p className="mt-0.5 text-[12px] text-ink-500">
                          Grade {classroom.grade_level}
                        </p>
                      </div>
                      <Badge tone={classroom.is_active ? 'success' : 'neutral'} dot>
                        {classroom.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <p className="mt-3 flex items-center gap-1.5 text-[13px] text-ink-600">
                      <Users className="size-3.5 text-ink-400" />
                      {classroom.class_teacher?.name ?? (
                        <span className="text-ink-400">No class teacher</span>
                      )}
                    </p>

                    <div className="mt-4">
                      <div className="mb-1.5 flex items-baseline justify-between">
                        <span className="text-[12px] text-ink-500">Enrolment</span>
                        <span className="text-[12px] font-medium text-ink-800 tnum">
                          {enrolled} / {classroom.capacity}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-ink-100">
                        <div
                          className={
                            fill >= 100
                              ? 'h-full rounded-full bg-[var(--color-danger)]'
                              : fill >= 85
                                ? 'h-full rounded-full bg-gold-500'
                                : 'h-full rounded-full bg-navy-900'
                          }
                          style={{ width: `${Math.min(100, fill)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-ink-400">
                        {percent(enrolled, classroom.capacity || 1)} full
                      </p>
                    </div>
                  </CardBody>

                  <div className="flex items-center gap-2 px-5 py-3 hairline-t">
                    <Link
                      to={`/students?class_id=${classroom.id}`}
                      className="text-[13px] font-medium text-navy-900 underline-offset-4 hover:underline"
                    >
                      View students
                    </Link>
                    {canEdit && (
                      <button
                        onClick={() => {
                          setEditing(classroom);
                          setFormOpen(true);
                        }}
                        className="ml-auto text-[13px] text-ink-500 hover:text-navy-900"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          <Card className="mt-4">
            <Pagination meta={classes.data.meta} onPage={setPage} />
          </Card>
        </>
      )}

      <ClassFormModal
        open={formOpen}
        classroom={editing}
        teachers={teachers.data?.items ?? []}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          queryClient.invalidateQueries({ queryKey: ['classes'] });
        }}
      />
    </>
  );
}

/* --------------------------------- form --------------------------------- */

const BLANK = {
  name: '',
  grade_level: '',
  section: '',
  capacity: '40',
  teacher_id: '',
  description: '',
};

function ClassFormModal({
  open,
  classroom,
  teachers,
  onClose,
  onSaved,
}: {
  open: boolean;
  classroom: ClassRoom | null;
  teachers: Teacher[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(classroom);
  const [form, setForm] = useState({ ...BLANK });
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      classroom
        ? {
            name: classroom.name ?? '',
            grade_level: String(classroom.grade_level ?? ''),
            section: classroom.section ?? '',
            capacity: String(classroom.capacity ?? 40),
            teacher_id: classroom.class_teacher?.id ? String(classroom.class_teacher.id) : '',
            description: classroom.description ?? '',
          }
        : { ...BLANK },
    );
  }, [open, classroom]);

  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      isEdit ? classService.update(classroom!.id, payload) : classService.create(payload),
    onSuccess: () => {
      toast.success(isEdit ? 'Class updated.' : 'Class created.');
      onSaved();
    },
    onError: (err: ApiError) => {
      setError(err);
      if (!err.errors) toast.error(err.message);
    },
  });

  const set = (key: keyof typeof BLANK, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));
  const err = (field: string) => error?.fieldError(field);

  function submit() {
    setError(null);
    save.mutate({
      name: form.name.trim(),
      grade_level: Number(form.grade_level),
      capacity: Number(form.capacity),
      ...(form.section ? { section: form.section.trim() } : {}),
      ...(form.teacher_id ? { teacher_id: Number(form.teacher_id) } : {}),
      ...(form.description ? { description: form.description.trim() } : {}),
      ...(isEdit ? { is_active: classroom?.is_active ?? true } : {}),
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit class' : 'New class'}
      description="Grade level drives promotion mapping at the end of the year."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} loading={save.isPending}>
            {isEdit ? 'Save changes' : 'Create class'}
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Class name"
            required
            placeholder="Class 8"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            error={err('name')}
          />
          <Input
            label="Section"
            placeholder="A"
            maxLength={10}
            value={form.section}
            onChange={(e) => set('section', e.target.value)}
            error={err('section')}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            type="number"
            label="Grade level"
            required
            min={1}
            max={12}
            value={form.grade_level}
            onChange={(e) => set('grade_level', e.target.value)}
            error={err('grade_level')}
            hint="1–12"
          />
          <Input
            type="number"
            label="Capacity"
            required
            min={1}
            value={form.capacity}
            onChange={(e) => set('capacity', e.target.value)}
            error={err('capacity')}
          />
        </div>

        <Select
          label="Class teacher"
          value={form.teacher_id}
          onChange={(e) => set('teacher_id', e.target.value)}
          placeholder="Assign later"
          error={err('teacher_id')}
          options={teachers.map((t) => ({ value: t.id, label: `${t.name} · ${t.employee_id}` }))}
        />

        <Textarea
          label="Description"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          error={err('description')}
        />

        {error && !error.errors && (
          <p className="rounded-[var(--radius-field)] bg-[var(--color-danger-soft)] px-3.5 py-2.5 text-[13px] text-[var(--color-danger)]">
            {error.message}
          </p>
        )}
      </form>
    </Modal>
  );
}
