import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CalendarCheck, CheckCheck, ClipboardCheck, Save } from 'lucide-react';
import { attendanceService } from '@/services/academics';
import { classService } from '@/services/people';
import { useAuth } from '@/app/auth-context';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { Avatar, PageHeader } from '@/components/ui/Primitives';
import { EmptyState, ErrorState, PageLoader } from '@/components/ui/Feedback';
import { ApiError } from '@/lib/http';
import { cn, percent, toApiDate } from '@/lib/utils';
import type { AttendanceStatus, Student } from '@/types/api';

const STATUSES: { value: AttendanceStatus; label: string; short: string; classes: string }[] = [
  {
    value: 'present',
    label: 'Present',
    short: 'P',
    classes: 'bg-[var(--color-success)] text-white border-[var(--color-success)]',
  },
  {
    value: 'absent',
    label: 'Absent',
    short: 'A',
    classes: 'bg-[var(--color-danger)] text-white border-[var(--color-danger)]',
  },
  {
    value: 'late',
    label: 'Late',
    short: 'L',
    classes: 'bg-[var(--color-warning)] text-white border-[var(--color-warning)]',
  },
  {
    value: 'excused',
    label: 'Excused',
    short: 'E',
    classes: 'bg-[var(--color-info)] text-white border-[var(--color-info)]',
  },
  {
    value: 'leave',
    label: 'Leave',
    short: 'LV',
    classes: 'bg-ink-500 text-white border-ink-500',
  },
];

export function AttendancePage() {
  const { isRole } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [classId, setClassId] = useState(searchParams.get('class_id') ?? '');
  const [date, setDate] = useState(searchParams.get('date') ?? toApiDate());
  const [marks, setMarks] = useState<Record<number, AttendanceStatus>>({});
  const [dirty, setDirty] = useState(false);

  const isTeacher = isRole('teacher');

  const classes = useQuery({
    queryKey: ['classes', isTeacher ? 'mine' : 'simple'],
    queryFn: () => (isTeacher ? classService.myClassesSimple() : classService.simple()),
    staleTime: 10 * 60 * 1000,
  });

  // Default to the first class once the list arrives.
  useEffect(() => {
    if (!classId && classes.data?.length) setClassId(String(classes.data[0].id));
  }, [classes.data, classId]);

  useEffect(() => {
    const next = new URLSearchParams();
    if (classId) next.set('class_id', classId);
    next.set('date', date);
    setSearchParams(next, { replace: true });
  }, [classId, date, setSearchParams]);

  const roster = useQuery({
    queryKey: ['classes', classId, 'students'],
    queryFn: () => classService.students(classId, { per_page: 200 }),
    enabled: Boolean(classId),
  });

  const existing = useQuery({
    queryKey: ['attendance', classId, date],
    queryFn: () =>
      isTeacher
        ? attendanceService.teacher.classByDate(classId, date)
        : attendanceService.classByDate(classId, date),
    enabled: Boolean(classId && date),
    retry: false,
  });

  // Seed the register from whatever is already saved for that date.
  useEffect(() => {
    const records = (existing.data?.records ?? []) as { student_id?: number; status?: string; student?: { id: number } }[];
    const seeded: Record<number, AttendanceStatus> = {};
    records.forEach((record) => {
      const studentId = record.student_id ?? record.student?.id;
      if (studentId && record.status) seeded[studentId] = record.status as AttendanceStatus;
    });
    setMarks(seeded);
    setDirty(false);
  }, [existing.data, classId, date]);

  const students = useMemo(() => roster.data?.items ?? [], [roster.data]);

  const counts = useMemo(() => {
    const tally = { present: 0, absent: 0, late: 0, excused: 0, leave: 0, unmarked: 0 };
    students.forEach((student) => {
      const status = marks[student.id];
      if (status) tally[status] += 1;
      else tally.unmarked += 1;
    });
    return tally;
  }, [marks, students]);

  const save = useMutation({
    mutationFn: () => {
      const attendances = students
        .filter((student) => marks[student.id])
        .map((student) => ({ student_id: student.id, status: marks[student.id] }));

      if (!attendances.length) throw new ApiError('Mark at least one student first.', 422);

      const payload = { class_id: Number(classId), date, attendances };
      return isTeacher ? attendanceService.teacher.markBulk(payload) : attendanceService.markBulk(payload);
    },
    onSuccess: () => {
      toast.success(`Attendance saved for ${students.length} students.`);
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: ApiError) => toast.error(err.message),
  });

  function mark(studentId: number, status: AttendanceStatus) {
    setMarks((prev) => ({ ...prev, [studentId]: status }));
    setDirty(true);
  }

  function markAll(status: AttendanceStatus) {
    const next: Record<number, AttendanceStatus> = {};
    students.forEach((student) => {
      next[student.id] = status;
    });
    setMarks(next);
    setDirty(true);
  }

  const alreadySaved = Object.keys(marks).length > 0 && !dirty && !existing.isLoading;

  return (
    <>
      <PageHeader
        title="Attendance"
        description="Pick a class and a date, mark the register, save once."
        actions={
          <Button
            icon={<Save className="size-4" />}
            onClick={() => save.mutate()}
            loading={save.isPending}
            disabled={!classId || !students.length || (!dirty && alreadySaved)}
          >
            {alreadySaved ? 'Saved' : 'Save register'}
          </Button>
        }
      />

      <Card className="mb-5">
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <Select
            label="Class"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            placeholder={classes.isLoading ? 'Loading…' : 'Select a class'}
            className="sm:w-56"
            options={(classes.data ?? []).map((c) => ({
              value: c.id,
              label: `${c.name}${c.section ? ` ${c.section}` : ''}`,
            }))}
          />
          <Input
            type="date"
            label="Date"
            value={date}
            max={toApiDate()}
            onChange={(e) => setDate(e.target.value)}
            className="sm:w-48"
          />

          <div className="flex flex-1 flex-wrap items-center gap-2 sm:justify-end">
            <Button
              size="sm"
              variant="secondary"
              icon={<CheckCheck className="size-4" />}
              onClick={() => markAll('present')}
              disabled={!students.length}
            >
              All present
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setMarks({});
                setDirty(true);
              }}
              disabled={!students.length}
            >
              Clear
            </Button>
          </div>
        </CardBody>
      </Card>

      {classId && students.length > 0 && (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ['Present', counts.present, 'text-[var(--color-success)]'],
            ['Absent', counts.absent, 'text-[var(--color-danger)]'],
            ['Late', counts.late, 'text-[var(--color-warning)]'],
            ['Excused', counts.excused, 'text-[var(--color-info)]'],
            ['Leave', counts.leave, 'text-ink-600'],
            ['Unmarked', counts.unmarked, 'text-ink-400'],
          ].map(([label, value, tone]) => (
            <div
              key={String(label)}
              className="rounded-[var(--radius-card)] bg-white px-4 py-3 hairline shadow-[var(--shadow-card)]"
            >
              <p className="label-caps">{label}</p>
              <p className={cn('mt-0.5 text-xl font-semibold tnum', tone as string)}>
                {value as number}
              </p>
            </div>
          ))}
        </div>
      )}

      <Card>
        <CardHeader
          title="Register"
          description={
            students.length
              ? `${students.length} students · ${percent(counts.present, students.length)} present`
              : undefined
          }
          action={
            alreadySaved && (
              <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-success)]">
                <CalendarCheck className="size-3.5" />
                Already recorded
              </span>
            )
          }
        />

        {!classId ? (
          <EmptyState
            icon={<ClipboardCheck className="size-5" />}
            title="Pick a class"
            description="Choose a class above to load its roster."
          />
        ) : roster.isLoading ? (
          <PageLoader label="Loading roster" />
        ) : roster.error ? (
          <ErrorState error={roster.error} onRetry={() => roster.refetch()} />
        ) : !students.length ? (
          <EmptyState
            icon={<ClipboardCheck className="size-5" />}
            title="No students in this class"
            description="Assign students to the class before marking attendance."
          />
        ) : (
          <ul className="divide-y divide-[var(--hairline)]">
            {students.map((student: Student, index) => {
              const status = marks[student.id];
              return (
                <li
                  key={student.id}
                  className={cn(
                    'flex flex-col gap-3 px-5 py-3 transition-colors sm:flex-row sm:items-center',
                    !status && 'bg-gold-50/30',
                  )}
                >
                  <span className="hidden w-7 shrink-0 text-[12px] text-ink-400 tnum sm:block">
                    {index + 1}
                  </span>
                  <Avatar
                    name={`${student.first_name} ${student.last_name}`}
                    src={student.profile_photo_url}
                    size={34}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-ink-900">
                      {student.first_name} {student.last_name}
                    </p>
                    <p className="truncate text-[12px] text-ink-500 tnum">
                      {student.admission_number}
                      {student.roll_number ? ` · Roll ${student.roll_number}` : ''}
                    </p>
                  </div>

                  <div
                    className="flex shrink-0 gap-1.5"
                    role="radiogroup"
                    aria-label={`Attendance for ${student.first_name}`}
                  >
                    {STATUSES.map((option) => {
                      const selected = status === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          title={option.label}
                          onClick={() => mark(student.id, option.value)}
                          className={cn(
                            'h-9 min-w-9 rounded-[var(--radius-field)] border px-2 text-[12px] font-semibold transition-all',
                            selected
                              ? option.classes
                              : 'border-ink-200 bg-white text-ink-500 hover:border-ink-400 hover:text-ink-800',
                          )}
                        >
                          {option.short}
                        </button>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {students.length > 0 && (
          <div className="flex flex-col gap-3 px-5 py-4 hairline-t sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] text-ink-500">
              {counts.unmarked > 0
                ? `${counts.unmarked} student${counts.unmarked === 1 ? '' : 's'} still unmarked — only marked students are submitted.`
                : 'Every student is marked.'}
            </p>
            <Button
              icon={<Save className="size-4" />}
              onClick={() => save.mutate()}
              loading={save.isPending}
              disabled={!dirty && alreadySaved}
            >
              Save register
            </Button>
          </div>
        )}
      </Card>
    </>
  );
}
