import { useMemo, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CalendarDays, Check, MapPin, Plus } from 'lucide-react';
import { eventService } from '@/services/academics';
import { useAuth } from '@/app/auth-context';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, type Tone } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Checkbox, Input, Select, Textarea } from '@/components/ui/Field';
import { Pagination } from '@/components/ui/Table';
import { PageHeader, Tabs } from '@/components/ui/Primitives';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { ApiError } from '@/lib/http';
import { formatDate, titleCase, toApiDate } from '@/lib/utils';
import type { EventType, Priority, SchoolEvent } from '@/types/api';

const EVENT_TYPES: EventType[] = [
  'announcement',
  'holiday',
  'exam',
  'meeting',
  'sports',
  'cultural',
  'academic',
  'emergency',
  'other',
];

const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent'];
const AUDIENCES = ['all', 'students', 'teachers', 'parents', 'staff'];

const PRIORITY_TONE: Record<Priority, Tone> = {
  low: 'neutral',
  medium: 'info',
  high: 'warning',
  urgent: 'danger',
};

export function EventsPage() {
  const { isRole } = useAuth();
  const queryClient = useQueryClient();
  const canEdit = isRole('school_admin');

  const [tab, setTab] = useState('upcoming');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);

  const params = useMemo(
    () => ({ page, per_page: 12, ...(tab !== 'all' ? { filter: tab } : {}) }),
    [page, tab],
  );

  const events = useQuery({
    queryKey: ['events', params],
    queryFn: () => eventService.list(params),
    placeholderData: keepPreviousData,
  });

  const acknowledge = useMutation({
    mutationFn: (id: number) => eventService.acknowledge(id),
    onSuccess: () => {
      toast.success('Acknowledged.');
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (err: ApiError) => toast.error(err.message),
  });

  const rows = (events.data?.items ?? []).filter((event) =>
    tab === 'upcoming' ? event.is_upcoming || event.is_today : true,
  );

  return (
    <>
      <PageHeader
        title="Events"
        description="Holidays, exams, meetings and announcements."
        actions={
          canEdit && (
            <Button icon={<Plus className="size-4" />} onClick={() => setFormOpen(true)}>
              New event
            </Button>
          )
        }
      />

      <div className="mb-5">
        <Tabs
          active={tab}
          onChange={(id) => {
            setTab(id);
            setPage(1);
          }}
          tabs={[
            { id: 'upcoming', label: 'Upcoming' },
            { id: 'all', label: 'All events' },
          ]}
        />
      </div>

      {events.error ? (
        <Card>
          <ErrorState error={events.error} onRetry={() => events.refetch()} />
        </Card>
      ) : events.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[180px]" />
          ))}
        </div>
      ) : !rows.length ? (
        <Card>
          <EmptyState
            icon={<CalendarDays className="size-5" />}
            title={tab === 'upcoming' ? 'Nothing coming up' : 'No events yet'}
            description="Published events appear to the audiences you select."
            action={
              canEdit && (
                <Button icon={<Plus className="size-4" />} onClick={() => setFormOpen(true)}>
                  New event
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((event) => (
              <Card key={event.id} className="flex flex-col">
                <CardBody className="flex-1">
                  <div className="flex items-start gap-3">
                    <div className="grid size-12 shrink-0 place-items-center rounded-[var(--radius-field)] bg-navy-900 text-white">
                      <span className="text-[17px] font-semibold leading-none tnum">
                        {formatDate(event.event_date, 'd')}
                      </span>
                      <span className="mt-0.5 text-[9px] uppercase tracking-wider text-gold-400">
                        {formatDate(event.event_date, 'MMM')}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge tone="gold">{titleCase(event.type)}</Badge>
                        <Badge tone={PRIORITY_TONE[event.priority] ?? 'neutral'}>
                          {titleCase(event.priority)}
                        </Badge>
                        {event.is_today && <Badge tone="success">Today</Badge>}
                      </div>
                      <h3 className="mt-2 font-sans text-[15px] font-semibold tracking-normal text-ink-900">
                        {event.title}
                      </h3>
                    </div>
                  </div>

                  {event.description && (
                    <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-ink-600">
                      {event.description}
                    </p>
                  )}

                  <div className="mt-3 space-y-1 text-[12px] text-ink-500">
                    {event.formatted_time && <p>{event.formatted_time}</p>}
                    {event.location && (
                      <p className="flex items-center gap-1.5">
                        <MapPin className="size-3.5 text-ink-400" />
                        {event.location}
                      </p>
                    )}
                  </div>
                </CardBody>

                {event.requires_acknowledgment && (
                  <div className="flex items-center gap-2 px-5 py-3 hairline-t">
                    {event.is_acknowledged_by_current_user ? (
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-success)]">
                        <Check className="size-3.5" />
                        Acknowledged
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => acknowledge.mutate(event.id)}
                        loading={acknowledge.isPending && acknowledge.variables === event.id}
                      >
                        Acknowledge
                      </Button>
                    )}
                    {typeof event.acknowledgment_rate === 'number' && (
                      <span className="ml-auto text-[12px] text-ink-400 tnum">
                        {Math.round(event.acknowledgment_rate)}% acknowledged
                      </span>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>

          <Card className="mt-4">
            <Pagination meta={events.data?.meta} onPage={setPage} />
          </Card>
        </>
      )}

      <EventFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          queryClient.invalidateQueries({ queryKey: ['events'] });
        }}
      />
    </>
  );
}

/* --------------------------------- form --------------------------------- */

function EventFormModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'announcement',
    priority: 'medium',
    event_date: toApiDate(),
    start_time: '',
    end_time: '',
    location: '',
    requires_acknowledgment: false,
    is_published: true,
  });
  const [audience, setAudience] = useState<string[]>(['all']);
  const [error, setError] = useState<ApiError | null>(null);

  const save = useMutation({
    mutationFn: () =>
      eventService.create({
        title: form.title.trim(),
        type: form.type,
        priority: form.priority,
        event_date: form.event_date,
        target_audience: audience,
        requires_acknowledgment: form.requires_acknowledgment,
        is_published: form.is_published,
        ...(form.description ? { description: form.description.trim() } : {}),
        ...(form.start_time ? { start_time: form.start_time } : {}),
        ...(form.end_time ? { end_time: form.end_time } : {}),
        ...(form.location ? { location: form.location.trim() } : {}),
      }),
    onSuccess: () => {
      toast.success('Event published.');
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

  function toggleAudience(value: string) {
    setAudience((prev) => {
      if (value === 'all') return ['all'];
      const without = prev.filter((a) => a !== 'all');
      return without.includes(value) ? without.filter((a) => a !== value) : [...without, value];
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="New event"
      description="Everyone in the selected audiences gets a notification."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button onClick={() => save.mutate()} loading={save.isPending}>
            Publish event
          </Button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <Input
          label="Title"
          required
          placeholder="Annual Sports Day"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          error={err('title')}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Type"
            required
            value={form.type}
            onChange={(e) => set('type', e.target.value)}
            error={err('type')}
            options={EVENT_TYPES.map((t) => ({ value: t, label: titleCase(t) }))}
          />
          <Select
            label="Priority"
            required
            value={form.priority}
            onChange={(e) => set('priority', e.target.value)}
            error={err('priority')}
            options={PRIORITIES.map((p) => ({ value: p, label: titleCase(p) }))}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            type="date"
            label="Date"
            required
            value={form.event_date}
            onChange={(e) => set('event_date', e.target.value)}
            error={err('event_date')}
          />
          <Input
            type="time"
            label="Start time"
            value={form.start_time}
            onChange={(e) => set('start_time', e.target.value)}
            error={err('start_time')}
          />
          <Input
            type="time"
            label="End time"
            value={form.end_time}
            onChange={(e) => set('end_time', e.target.value)}
            error={err('end_time')}
          />
        </div>

        <Input
          label="Location"
          placeholder="School ground"
          value={form.location}
          onChange={(e) => set('location', e.target.value)}
          error={err('location')}
        />

        <div>
          <p className="mb-1.5 text-[13px] font-medium text-ink-700">
            Audience <span className="text-[var(--color-danger)]">*</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {AUDIENCES.map((option) => {
              const selected = audience.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleAudience(option)}
                  aria-pressed={selected}
                  className={
                    selected
                      ? 'rounded-[var(--radius-pill)] border border-gold-500 bg-gold-50 px-3.5 py-1.5 text-[13px] font-medium text-navy-900'
                      : 'rounded-[var(--radius-pill)] border border-ink-200 bg-white px-3.5 py-1.5 text-[13px] text-ink-600 hover:border-ink-300'
                  }
                >
                  {titleCase(option)}
                </button>
              );
            })}
          </div>
          {err('target_audience') && (
            <p className="mt-1.5 text-[12px] text-[var(--color-danger)]">{err('target_audience')}</p>
          )}
        </div>

        <Textarea
          label="Description"
          rows={4}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          error={err('description')}
        />

        <div className="flex flex-wrap gap-5 rounded-[var(--radius-field)] bg-ink-50 px-4 py-3">
          <Checkbox
            label="Require acknowledgment"
            checked={form.requires_acknowledgment}
            onChange={(e) => set('requires_acknowledgment', e.target.checked)}
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
