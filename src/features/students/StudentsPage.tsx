import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Download, GraduationCap, Plus, Trash2 } from 'lucide-react';
import { classService, studentService } from '@/services/people';
import { Card } from '@/components/ui/Card';
import { DataTable, Pagination, type Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import { ConfirmDialog } from '@/components/ui/Modal';
import { Avatar, PageHeader, SearchInput, useDebounced } from '@/components/ui/Primitives';
import { EmptyState, ErrorState } from '@/components/ui/Feedback';
import { StudentFormModal } from './StudentFormModal';
import { ApiError } from '@/lib/http';
import { downloadBlob, formatDate } from '@/lib/utils';
import { useAuth } from '@/app/auth-context';
import type { Student } from '@/types/api';

export function StudentsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isRole } = useAuth();
  const canEdit = isRole('school_admin');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [classId, setClassId] = useState('');
  const [status, setStatus] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState<Student | null>(null);

  const debouncedSearch = useDebounced(search);

  const classes = useQuery({
    queryKey: ['classes', 'simple'],
    queryFn: classService.simple,
    staleTime: 10 * 60 * 1000,
  });

  const params = useMemo(
    () => ({
      page,
      per_page: 15,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(classId ? { class_id: classId } : {}),
      ...(status ? { is_active: status } : {}),
    }),
    [page, debouncedSearch, classId, status],
  );

  const students = useQuery({
    queryKey: ['students', params],
    queryFn: () => studentService.list(params),
    placeholderData: keepPreviousData,
  });

  const remove = useMutation({
    mutationFn: (id: number) => studentService.remove(id),
    onSuccess: () => {
      toast.success('Student removed.');
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (err: ApiError) => toast.error(err.message),
  });

  async function downloadTemplate() {
    try {
      const blob = await studentService.downloadTemplate();
      downloadBlob(blob, 'student-import-template.xlsx');
    } catch (err) {
      toast.error((err as ApiError).message);
    }
  }

  const columns: Column<Student>[] = [
    {
      key: 'student',
      header: 'Student',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={`${row.first_name} ${row.last_name}`} src={row.profile_photo_url} size={34} />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink-900">
              {row.first_name} {row.last_name}
            </p>
            <p className="truncate text-[12px] text-ink-500 tnum">{row.admission_number}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'class',
      header: 'Class',
      render: (row) =>
        row.class_name ? (
          <span className="text-ink-700">{row.class_name}</span>
        ) : (
          <span className="text-ink-400">Unassigned</span>
        ),
    },
    {
      key: 'roll',
      header: 'Roll',
      align: 'right',
      width: '80px',
      render: (row) => <span className="tnum">{row.roll_number ?? '—'}</span>,
    },
    {
      key: 'admitted',
      header: 'Admitted',
      render: (row) => <span className="text-ink-600">{formatDate(row.admission_date)}</span>,
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
    ...(canEdit
      ? [
          {
            key: 'actions',
            header: '',
            align: 'right' as const,
            width: '110px',
            render: (row: Student) => (
              <div
                className="flex justify-end gap-1"
                onClick={(e) => e.stopPropagation()}
                role="presentation"
              >
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
                  aria-label="Delete student"
                  onClick={() => setDeleting(row)}
                  className="text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <PageHeader
        title="Students"
        description={
          students.data?.meta.total
            ? `${students.data.meta.total} on the roll`
            : 'Everyone enrolled at your school.'
        }
        actions={
          canEdit && (
            <>
              <Button variant="secondary" icon={<Download className="size-4" />} onClick={downloadTemplate}>
                Import template
              </Button>
              <Button
                icon={<Plus className="size-4" />}
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                Add student
              </Button>
            </>
          )
        }
      />

      <Card>
        <div className="flex flex-col gap-3 p-4 hairline-b sm:flex-row sm:items-center">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Name or admission number…"
          />
          <div className="flex gap-3 sm:ml-auto">
            <Select
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value);
                setPage(1);
              }}
              placeholder="All classes"
              className="sm:w-44"
              options={(classes.data ?? []).map((c) => ({
                value: c.id,
                label: `${c.name}${c.section ? ` ${c.section}` : ''}`,
              }))}
            />
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              placeholder="Any status"
              className="sm:w-36"
              options={[
                { value: '1', label: 'Active' },
                { value: '0', label: 'Inactive' },
              ]}
            />
          </div>
        </div>

        {students.error ? (
          <ErrorState error={students.error} onRetry={() => students.refetch()} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={students.data?.items ?? []}
              loading={students.isLoading}
              rowKey={(row) => row.id}
              onRowClick={(row) => navigate(`/students/${row.id}`)}
              empty={
                <EmptyState
                  icon={<GraduationCap className="size-5" />}
                  title={search || classId ? 'No students match those filters' : 'No students yet'}
                  description={
                    search || classId
                      ? 'Try clearing the search or picking a different class.'
                      : 'Add your first student, or bulk-import from a spreadsheet.'
                  }
                  action={
                    canEdit &&
                    !search &&
                    !classId && (
                      <Button
                        icon={<Plus className="size-4" />}
                        onClick={() => {
                          setEditing(null);
                          setFormOpen(true);
                        }}
                      >
                        Add student
                      </Button>
                    )
                  }
                />
              }
            />
            <Pagination meta={students.data?.meta} onPage={setPage} />
          </>
        )}
      </Card>

      <StudentFormModal
        open={formOpen}
        student={editing}
        classes={classes.data ?? []}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          queryClient.invalidateQueries({ queryKey: ['students'] });
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        loading={remove.isPending}
        title="Remove student"
        message={`${deleting?.first_name ?? ''} ${deleting?.last_name ?? ''} will be removed from the roll. Attendance and fee history stays on file.`}
        confirmLabel="Remove"
      />
    </>
  );
}
