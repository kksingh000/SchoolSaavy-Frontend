import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2, UserSquare2 } from 'lucide-react';
import { teacherService } from '@/services/people';
import { Card } from '@/components/ui/Card';
import { DataTable, Pagination, type Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { Avatar, PageHeader, SearchInput, useDebounced } from '@/components/ui/Primitives';
import { EmptyState, ErrorState } from '@/components/ui/Feedback';
import { ApiError } from '@/lib/http';
import { formatDate } from '@/lib/utils';
import type { Teacher } from '@/types/api';

export function TeachersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [deleting, setDeleting] = useState<Teacher | null>(null);

  const debounced = useDebounced(search);
  const params = useMemo(
    () => ({ page, per_page: 15, ...(debounced ? { search: debounced } : {}) }),
    [page, debounced],
  );

  const teachers = useQuery({
    queryKey: ['teachers', params],
    queryFn: () => teacherService.list(params),
    placeholderData: keepPreviousData,
  });

  const remove = useMutation({
    mutationFn: (id: number) => teacherService.remove(id),
    onSuccess: () => {
      toast.success('Teacher removed.');
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
    onError: (err: ApiError) => toast.error(err.message),
  });

  const columns: Column<Teacher>[] = [
    {
      key: 'teacher',
      header: 'Teacher',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} src={row.profile_photo_url} size={34} />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink-900">{row.name}</p>
            <p className="truncate text-[12px] text-ink-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'employee_id',
      header: 'Employee ID',
      render: (row) => <span className="tnum text-ink-700">{row.employee_id}</span>,
    },
    {
      key: 'qualification',
      header: 'Qualification',
      render: (row) => <span className="text-ink-600">{row.qualification ?? '—'}</span>,
    },
    {
      key: 'classes',
      header: 'Classes',
      align: 'right',
      width: '90px',
      render: (row) => <span className="tnum">{row.classes_count ?? row.classes?.length ?? 0}</span>,
    },
    {
      key: 'joined',
      header: 'Joined',
      render: (row) => <span className="text-ink-600">{formatDate(row.joining_date)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge tone={row.is_active ? 'success' : 'neutral'} dot>
          {row.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '110px',
      render: (row) => (
        <div className="flex justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setEditing(row);
              setFormOpen(true);
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            aria-label="Remove teacher"
            onClick={() => setDeleting(row)}
            className="text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Teachers"
        description={
          teachers.data?.meta.total
            ? `${teachers.data.meta.total} on staff`
            : 'Teaching staff and their assignments.'
        }
        actions={
          <Button
            icon={<Plus className="size-4" />}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Add teacher
          </Button>
        }
      />

      <Card>
        <div className="p-4 hairline-b">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Name, email or employee ID…"
          />
        </div>

        {teachers.error ? (
          <ErrorState error={teachers.error} onRetry={() => teachers.refetch()} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={teachers.data?.items ?? []}
              loading={teachers.isLoading}
              rowKey={(row) => row.id}
              empty={
                <EmptyState
                  icon={<UserSquare2 className="size-5" />}
                  title={search ? 'No teachers match' : 'No teachers yet'}
                  description={
                    search
                      ? 'Try a different name or employee ID.'
                      : 'Add your first teacher to start assigning classes.'
                  }
                />
              }
            />
            <Pagination meta={teachers.data?.meta} onPage={setPage} />
          </>
        )}
      </Card>

      <TeacherFormModal
        open={formOpen}
        teacher={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          queryClient.invalidateQueries({ queryKey: ['teachers'] });
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        loading={remove.isPending}
        title="Remove teacher"
        message={`${deleting?.name ?? 'This teacher'} will lose access. Reassign their classes first if they are still teaching.`}
        confirmLabel="Remove"
      />
    </>
  );
}

/* --------------------------------- form --------------------------------- */

const BLANK = {
  name: '',
  email: '',
  password: '',
  employee_id: '',
  phone: '',
  date_of_birth: '',
  joining_date: new Date().toISOString().slice(0, 10),
  gender: '',
  qualification: '',
  address: '',
};

function TeacherFormModal({
  open,
  teacher,
  onClose,
  onSaved,
}: {
  open: boolean;
  teacher: Teacher | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(teacher);
  const [form, setForm] = useState({ ...BLANK });
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      teacher
        ? {
            ...BLANK,
            name: teacher.name ?? '',
            email: teacher.email ?? '',
            employee_id: teacher.employee_id ?? '',
            phone: teacher.phone ?? '',
            date_of_birth: teacher.date_of_birth ?? '',
            joining_date: teacher.joining_date ?? '',
            gender: teacher.gender ?? '',
            qualification: teacher.qualification ?? '',
            address: teacher.address ?? '',
          }
        : { ...BLANK },
    );
  }, [open, teacher]);

  const generateId = useMutation({
    mutationFn: teacherService.generateEmployeeId,
    onSuccess: (res) => setForm((f) => ({ ...f, employee_id: res.employee_id })),
    onError: (err: ApiError) => toast.error(err.message),
  });

  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      isEdit ? teacherService.update(teacher!.id, payload) : teacherService.create(payload),
    onSuccess: () => {
      toast.success(isEdit ? 'Teacher updated.' : 'Teacher added.');
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
    const payload: Record<string, unknown> = { ...form };
    if (isEdit) delete payload.password;
    Object.keys(payload).forEach((k) => {
      if (payload[k] === '') delete payload[k];
    });
    save.mutate(payload);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? 'Edit teacher' : 'Add a teacher'}
      description={
        isEdit
          ? 'Account credentials are managed separately.'
          : 'A user account is created with the email and password you set here.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} loading={save.isPending}>
            {isEdit ? 'Save changes' : 'Add teacher'}
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
            label="Full name"
            required
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            error={err('name')}
          />
          <Input
            label="Employee ID"
            required
            value={form.employee_id}
            onChange={(e) => set('employee_id', e.target.value)}
            error={err('employee_id')}
            hint={
              !isEdit && (
                <button
                  type="button"
                  onClick={() => generateId.mutate()}
                  className="text-gold-700 hover:underline"
                >
                  Generate
                </button>
              )
            }
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            type="email"
            label="Email"
            required
            disabled={isEdit}
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            error={err('email')}
          />
          {!isEdit && (
            <Input
              type="password"
              label="Temporary password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              error={err('password')}
              hint="8+ characters"
            />
          )}
          {isEdit && (
            <Input
              label="Phone"
              type="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              error={err('phone')}
            />
          )}
        </div>

        {!isEdit && (
          <Input
            label="Phone"
            type="tel"
            required
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            error={err('phone')}
          />
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            type="date"
            label="Date of birth"
            required={!isEdit}
            value={form.date_of_birth}
            onChange={(e) => set('date_of_birth', e.target.value)}
            error={err('date_of_birth')}
          />
          <Input
            type="date"
            label="Joining date"
            required={!isEdit}
            value={form.joining_date}
            onChange={(e) => set('joining_date', e.target.value)}
            error={err('joining_date')}
          />
          <Select
            label="Gender"
            required={!isEdit}
            value={form.gender}
            onChange={(e) => set('gender', e.target.value)}
            placeholder="Select…"
            error={err('gender')}
            options={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' },
            ]}
          />
        </div>

        <Input
          label="Qualification"
          required={!isEdit}
          placeholder="M.Sc. Mathematics, B.Ed."
          value={form.qualification}
          onChange={(e) => set('qualification', e.target.value)}
          error={err('qualification')}
        />

        <Textarea
          label="Address"
          required={!isEdit}
          value={form.address}
          onChange={(e) => set('address', e.target.value)}
          error={err('address')}
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
