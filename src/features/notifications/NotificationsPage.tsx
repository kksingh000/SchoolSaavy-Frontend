import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BellRing, CheckCheck, Send } from 'lucide-react';
import { notificationService } from '@/services/ops';
import { useAuth } from '@/app/auth-context';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, type Tone } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { Pagination } from '@/components/ui/Table';
import { PageHeader } from '@/components/ui/Primitives';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { ApiError } from '@/lib/http';
import { cn, formatDate, titleCase } from '@/lib/utils';
import type { Priority } from '@/types/api';

const PRIORITY_TONE: Record<string, Tone> = {
  low: 'neutral',
  medium: 'info',
  high: 'warning',
  urgent: 'danger',
};

export function NotificationsPage() {
  const { isRole } = useAuth();
  const queryClient = useQueryClient();
  const isParent = isRole('parent');

  const [page, setPage] = useState(1);
  const [composeOpen, setComposeOpen] = useState(false);

  const notifications = useQuery({
    queryKey: ['notifications', isParent ? 'mine' : 'sent', page],
    queryFn: () =>
      isParent
        ? notificationService.mine({ page, per_page: 20 })
        : notificationService.list({ page, per_page: 20 }),
    placeholderData: keepPreviousData,
  });

  const markAll = useMutation({
    mutationFn: notificationService.markAllRead,
    onSuccess: () => {
      toast.success('All marked as read.');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err: ApiError) => toast.error(err.message),
  });

  const markRead = useMutation({
    mutationFn: (id: number) => notificationService.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const rows = notifications.data?.items ?? [];
  const hasUnread = rows.some((n) => n.is_read === false);

  return (
    <>
      <PageHeader
        title="Notifications"
        description={
          isParent ? 'Messages from your school.' : 'Everything your school has sent out.'
        }
        actions={
          isParent ? (
            hasUnread && (
              <Button
                variant="secondary"
                icon={<CheckCheck className="size-4" />}
                onClick={() => markAll.mutate()}
                loading={markAll.isPending}
              >
                Mark all read
              </Button>
            )
          ) : (
            <Button icon={<Send className="size-4" />} onClick={() => setComposeOpen(true)}>
              Send notification
            </Button>
          )
        }
      />

      <Card>
        {notifications.error ? (
          <ErrorState error={notifications.error} onRetry={() => notifications.refetch()} />
        ) : notifications.isLoading ? (
          <CardBody className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </CardBody>
        ) : !rows.length ? (
          <EmptyState
            icon={<BellRing className="size-5" />}
            title="No notifications"
            description={
              isParent
                ? 'Messages from the school will show up here.'
                : 'Send your first notification to parents or teachers.'
            }
          />
        ) : (
          <>
            <ul className="divide-y divide-[var(--hairline)]">
              {rows.map((notification) => {
                const unread = notification.is_read === false;
                return (
                  <li
                    key={notification.id}
                    className={cn('flex gap-3 px-5 py-4', unread && 'bg-gold-50/40')}
                  >
                    <span
                      className={cn(
                        'mt-1.5 size-2 shrink-0 rounded-full',
                        unread ? 'bg-gold-500' : 'bg-transparent',
                      )}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[14px] font-semibold text-ink-900">
                          {notification.title}
                        </p>
                        <Badge tone={PRIORITY_TONE[notification.priority] ?? 'neutral'}>
                          {titleCase(notification.priority)}
                        </Badge>
                        {notification.type && (
                          <span className="text-[12px] text-ink-400">
                            {titleCase(String(notification.type))}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[13px] leading-relaxed text-ink-600">
                        {notification.message}
                      </p>
                      <p className="mt-1.5 text-[12px] text-ink-400">
                        {formatDate(notification.created_at, 'd MMM yyyy, h:mm a')}
                      </p>
                    </div>
                    {isParent && unread && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markRead.mutate(notification.id)}
                      >
                        Mark read
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
            <Pagination meta={notifications.data?.meta} onPage={setPage} />
          </>
        )}
      </Card>

      <ComposeModal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onSent={() => {
          setComposeOpen(false);
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }}
      />
    </>
  );
}

/* -------------------------------- compose ------------------------------- */

function ComposeModal({
  open,
  onClose,
  onSent,
}: {
  open: boolean;
  onClose: () => void;
  onSent: () => void;
}) {
  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'general',
    priority: 'medium' as Priority,
    target_type: 'all',
  });
  const [error, setError] = useState<ApiError | null>(null);

  const config = useQuery({
    queryKey: ['notifications', 'config'],
    queryFn: async () => ({
      types: await notificationService.types().catch(() => ['general', 'academic', 'fee', 'event']),
      targets: await notificationService
        .targetTypes()
        .catch(() => ['all', 'parents', 'teachers', 'class']),
    }),
    enabled: open,
    staleTime: 30 * 60 * 1000,
  });

  const send = useMutation({
    mutationFn: () =>
      notificationService.send({
        title: form.title.trim(),
        message: form.message.trim(),
        type: form.type,
        priority: form.priority,
        target_type: form.target_type,
      }),
    onSuccess: () => {
      toast.success('Notification queued for delivery.');
      onSent();
    },
    onError: (err: ApiError) => {
      setError(err);
      if (!err.errors) toast.error(err.message);
    },
  });

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  const err = (field: string) => error?.fieldError(field);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Send a notification"
      description="Delivered in-app and as a push notification where devices are registered."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={send.isPending}>
            Cancel
          </Button>
          <Button onClick={() => send.mutate()} loading={send.isPending} icon={<Send className="size-4" />}>
            Send
          </Button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          send.mutate();
        }}
      >
        <Input
          label="Title"
          required
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          error={err('title')}
        />
        <Textarea
          label="Message"
          required
          rows={5}
          value={form.message}
          onChange={(e) => set('message', e.target.value)}
          error={err('message')}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            label="Audience"
            required
            value={form.target_type}
            onChange={(e) => set('target_type', e.target.value)}
            error={err('target_type')}
            options={(config.data?.targets ?? ['all']).map((t) => ({
              value: t,
              label: titleCase(t),
            }))}
          />
          <Select
            label="Type"
            required
            value={form.type}
            onChange={(e) => set('type', e.target.value)}
            error={err('type')}
            options={(config.data?.types ?? ['general']).map((t) => ({
              value: t,
              label: titleCase(t),
            }))}
          />
          <Select
            label="Priority"
            required
            value={form.priority}
            onChange={(e) => set('priority', e.target.value)}
            error={err('priority')}
            options={['low', 'medium', 'high', 'urgent'].map((p) => ({
              value: p,
              label: titleCase(p),
            }))}
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
