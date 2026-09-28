import { useMemo, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BarChart3, Save } from 'lucide-react';
import { assessmentService } from '@/services/academics';
import { classService } from '@/services/people';
import { useAuth } from '@/app/auth-context';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, statusTone } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { DataTable, Pagination, type Column } from '@/components/ui/Table';
import { PageHeader } from '@/components/ui/Primitives';
import { EmptyState, ErrorState, PageLoader } from '@/components/ui/Feedback';
import { ApiError } from '@/lib/http';
import { formatDate, fullName, titleCase } from '@/lib/utils';
import type { Assessment } from '@/types/api';

export function AssessmentsPage() {
  const { isRole } = useAuth();
  const [page, setPage] = useState(1);
  const [classId, setClassId] = useState('');
  const [marksFor, setMarksFor] = useState<Assessment | null>(null);

  const classes = useQuery({
    queryKey: ['classes', isRole('teacher') ? 'mine' : 'simple'],
    queryFn: () => (isRole('teacher') ? classService.myClassesSimple() : classService.simple()),
    staleTime: 10 * 60 * 1000,
  });

  const params = useMemo(
    () => ({ page, per_page: 15, ...(classId ? { class_id: classId } : {}) }),
    [page, classId],
  );

  const assessments = useQuery({
    queryKey: ['assessments', params],
    queryFn: () => assessmentService.list(params),
    placeholderData: keepPreviousData,
  });

  const columns: Column<Assessment>[] = [
    {
      key: 'title',
      header: 'Assessment',
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink-900">{row.title}</p>
          <p className="truncate text-[12px] text-ink-500">
            {[row.subject?.name, row.class?.name].filter(Boolean).join(' · ') || '—'}
          </p>
        </div>
      ),
    },
    { key: 'date', header: 'Date', render: (row) => formatDate(row.assessment_date) },
    {
      key: 'max',
      header: 'Max marks',
      align: 'right',
      render: (row) => <span className="tnum">{row.max_marks}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <div className="flex gap-1.5">
          <Badge tone={statusTone(row.status)}>{titleCase(row.status)}</Badge>
          {row.results_published && <Badge tone="success">Results out</Badge>}
        </div>
      ),
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      width: '110px',
      render: (row) => (
        <Button size="sm" variant="secondary" onClick={() => setMarksFor(row)}>
          Marks
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Assessments"
        description="Tests and exams, and the marks recorded against them."
        actions={
          <Select
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              setPage(1);
            }}
            placeholder="All classes"
            className="w-48"
            options={(classes.data ?? []).map((c) => ({
              value: c.id,
              label: `${c.name}${c.section ? ` ${c.section}` : ''}`,
            }))}
          />
        }
      />

      <Card>
        {assessments.error ? (
          <ErrorState error={assessments.error} onRetry={() => assessments.refetch()} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={assessments.data?.items ?? []}
              loading={assessments.isLoading}
              rowKey={(row) => row.id}
              empty={
                <EmptyState
                  icon={<BarChart3 className="size-5" />}
                  title="No assessments"
                  description="Schedule a test or exam to start recording marks."
                />
              }
            />
            <Pagination meta={assessments.data?.meta} onPage={setPage} />
          </>
        )}
      </Card>

      <MarksModal assessment={marksFor} onClose={() => setMarksFor(null)} />
    </>
  );
}

/* --------------------------------- marks -------------------------------- */

function MarksModal({
  assessment,
  onClose,
}: {
  assessment: Assessment | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [marks, setMarks] = useState<Record<number, string>>({});

  const roster = useQuery({
    queryKey: ['classes', assessment?.class_id, 'students'],
    queryFn: () => classService.students(assessment!.class_id, { per_page: 200 }),
    enabled: Boolean(assessment?.class_id),
  });

  const existing = useQuery({
    queryKey: ['assessments', assessment?.id, 'results'],
    queryFn: () => assessmentService.results(assessment!.id),
    enabled: Boolean(assessment?.id),
    retry: false,
  });

  const save = useMutation({
    mutationFn: () => {
      const results = Object.entries(marks)
        .filter(([, value]) => value !== '')
        .map(([studentId, value]) => ({
          student_id: Number(studentId),
          marks_obtained: Number(value),
        }));
      if (!results.length) throw new ApiError('Enter marks for at least one student.', 422);
      return assessmentService.saveResults(assessment!.id, results);
    },
    onSuccess: () => {
      toast.success('Marks saved.');
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      onClose();
    },
    onError: (err: ApiError) => toast.error(err.message),
  });

  const publish = useMutation({
    mutationFn: () => assessmentService.publishResults(assessment!.id),
    onSuccess: () => {
      toast.success('Results published to parents.');
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      onClose();
    },
    onError: (err: ApiError) => toast.error(err.message),
  });

  const students = roster.data?.items ?? [];
  const max = assessment?.max_marks ?? 100;

  return (
    <Modal
      open={Boolean(assessment)}
      onClose={onClose}
      size="lg"
      title={assessment?.title ?? 'Marks'}
      description={
        assessment
          ? `${assessment.class?.name ?? 'Class'} · ${assessment.subject?.name ?? 'Subject'} · out of ${max}`
          : undefined
      }
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => publish.mutate()}
            loading={publish.isPending}
            disabled={assessment?.results_published}
          >
            {assessment?.results_published ? 'Already published' : 'Publish results'}
          </Button>
          <Button onClick={() => save.mutate()} loading={save.isPending} icon={<Save className="size-4" />}>
            Save marks
          </Button>
        </>
      }
    >
      {roster.isLoading || existing.isLoading ? (
        <PageLoader label="Loading roster" />
      ) : !students.length ? (
        <EmptyState title="No students in this class" />
      ) : (
        <ul className="divide-y divide-[var(--hairline)]">
          {students.map((student, index) => {
            const saved = (existing.data ?? []).find((r) => r.student_id === student.id);
            const value = marks[student.id] ?? (saved ? String(saved.marks_obtained) : '');
            return (
              <li key={student.id} className="flex items-center gap-3 py-2.5">
                <span className="w-6 shrink-0 text-[12px] text-ink-400 tnum">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] text-ink-900">{fullName(student)}</p>
                  <p className="truncate text-[12px] text-ink-500 tnum">
                    {student.admission_number}
                  </p>
                </div>
                <Input
                  type="number"
                  min={0}
                  max={max}
                  step="0.5"
                  value={value}
                  placeholder="—"
                  onChange={(e) =>
                    setMarks((prev) => ({ ...prev, [student.id]: e.target.value }))
                  }
                  className="w-24 text-right"
                  aria-label={`Marks for ${fullName(student)}`}
                />
                <span className="w-10 shrink-0 text-[12px] text-ink-400 tnum">/ {max}</span>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
