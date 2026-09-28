import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarRange } from 'lucide-react';
import { timetableService } from '@/services/academics';
import { classService } from '@/services/people';
import { useAuth } from '@/app/auth-context';
import { Card, CardBody } from '@/components/ui/Card';
import { Select } from '@/components/ui/Field';
import { PageHeader } from '@/components/ui/Primitives';
import { EmptyState, ErrorState, PageLoader } from '@/components/ui/Feedback';
import { cn, formatTime } from '@/lib/utils';
import type { TimetableSlot } from '@/types/api';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export function TimetablePage() {
  const { isRole } = useAuth();
  const isTeacher = isRole('teacher');
  const [classId, setClassId] = useState('');

  const classes = useQuery({
    queryKey: ['classes', isTeacher ? 'mine' : 'simple'],
    queryFn: () => (isTeacher ? classService.myClassesSimple() : classService.simple()),
    staleTime: 10 * 60 * 1000,
    enabled: !isTeacher || true,
  });

  useEffect(() => {
    if (!classId && classes.data?.length && !isTeacher) setClassId(String(classes.data[0].id));
  }, [classes.data, classId, isTeacher]);

  const schedule = useQuery({
    queryKey: ['timetable', isTeacher && !classId ? 'mine' : `class-${classId}`],
    queryFn: () =>
      isTeacher && !classId ? timetableService.mySchedule() : timetableService.forClass(classId),
    enabled: isTeacher || Boolean(classId),
  });

  const { grid, periods } = useMemo(() => {
    const slots = (schedule.data ?? []) as TimetableSlot[];
    const times = Array.from(new Set(slots.map((s) => `${s.start_time}|${s.end_time}`))).sort();
    const map: Record<string, Record<string, TimetableSlot>> = {};
    slots.forEach((slot) => {
      const key = `${slot.start_time}|${slot.end_time}`;
      const day = String(slot.day_of_week ?? '').toLowerCase();
      map[key] ??= {};
      map[key][day] = slot;
    });
    return { grid: map, periods: times };
  }, [schedule.data]);

  return (
    <>
      <PageHeader
        title="Timetable"
        description={isTeacher ? 'Your weekly teaching schedule.' : 'Weekly schedule by class.'}
        actions={
          <Select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            placeholder={isTeacher ? 'My schedule' : 'Select a class'}
            className="w-52"
            options={(classes.data ?? []).map((c) => ({
              value: c.id,
              label: `${c.name}${c.section ? ` ${c.section}` : ''}`,
            }))}
          />
        }
      />

      <Card>
        {schedule.isLoading ? (
          <PageLoader label="Loading timetable" />
        ) : schedule.error ? (
          <ErrorState error={schedule.error} onRetry={() => schedule.refetch()} />
        ) : !periods.length ? (
          <EmptyState
            icon={<CalendarRange className="size-5" />}
            title="No timetable published"
            description={
              isTeacher
                ? 'Your periods will appear here once the office publishes the schedule.'
                : 'Build the weekly schedule for this class to see it laid out here.'
            }
          />
        ) : (
          <CardBody className="overflow-x-auto p-0">
            <table className="w-full min-w-[820px] border-collapse text-sm">
              <thead>
                <tr className="hairline-b bg-ink-50/70">
                  <th
                    scope="col"
                    className="w-[120px] px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500"
                  >
                    Period
                  </th>
                  {DAYS.map((day) => (
                    <th
                      key={day}
                      scope="col"
                      className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500"
                    >
                      {day.slice(0, 3)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {periods.map((period) => {
                  const [start, end] = period.split('|');
                  return (
                    <tr key={period} className="hairline-b last:border-b-0">
                      <th
                        scope="row"
                        className="whitespace-nowrap px-4 py-2 text-left align-top text-[12px] font-medium text-ink-600 tnum"
                      >
                        {formatTime(start)}
                        <span className="block text-[11px] font-normal text-ink-400">
                          {formatTime(end)}
                        </span>
                      </th>
                      {DAYS.map((day) => {
                        const slot = grid[period]?.[day];
                        return (
                          <td key={day} className="px-2 py-2 align-top">
                            {slot ? (
                              <div
                                className={cn(
                                  'rounded-[var(--radius-field)] border-l-[3px] bg-ink-50 px-2.5 py-2',
                                  'border-l-gold-500',
                                )}
                              >
                                <p className="truncate text-[12.5px] font-medium text-ink-900">
                                  {slot.subject?.name ?? 'Period'}
                                </p>
                                <p className="truncate text-[11px] text-ink-500">
                                  {isTeacher
                                    ? `${slot.class?.name ?? ''}${slot.class?.section ? ` ${slot.class.section}` : ''}`
                                    : (slot.teacher?.name ?? '')}
                                </p>
                                {slot.room && (
                                  <p className="truncate text-[11px] text-ink-400">{slot.room}</p>
                                )}
                              </div>
                            ) : (
                              <div className="h-full min-h-[46px] rounded-[var(--radius-field)] border border-dashed border-ink-200" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardBody>
        )}
      </Card>
    </>
  );
}
