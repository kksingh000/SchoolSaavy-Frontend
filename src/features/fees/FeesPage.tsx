import { useMemo, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { IndianRupee, Plus, Receipt, Wallet } from 'lucide-react';
import { feeService } from '@/services/fees';
import { studentService } from '@/services/people';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, statusTone } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { DataTable, Pagination, type Column } from '@/components/ui/Table';
import { PageHeader, StatCard, Tabs, SearchInput, useDebounced } from '@/components/ui/Primitives';
import { EmptyState, ErrorState } from '@/components/ui/Feedback';
import { ApiError } from '@/lib/http';
import { formatCurrency, formatDate, fullName, titleCase, toApiDate } from '@/lib/utils';
import type { FeeInstallment, FeeStructure, StudentFeePlan } from '@/types/api';

const PAYMENT_MODES = ['cash', 'cheque', 'upi', 'card', 'net_banking', 'bank_transfer'];

export function FeesPage() {
  const [tab, setTab] = useState('dues');
  const [collectFor, setCollectFor] = useState<FeeInstallment | null>(null);

  return (
    <>
      <PageHeader
        title="Fees"
        description="Structures, per-student plans and collection."
        actions={
          <Button icon={<Wallet className="size-4" />} onClick={() => setCollectFor({} as FeeInstallment)}>
            Collect payment
          </Button>
        }
      />

      <Card>
        <div className="px-2">
          <Tabs
            active={tab}
            onChange={setTab}
            tabs={[
              { id: 'dues', label: 'Outstanding' },
              { id: 'plans', label: 'Student plans' },
              { id: 'structures', label: 'Fee structures' },
            ]}
          />
        </div>

        {tab === 'dues' && <DuesTab onCollect={setCollectFor} />}
        {tab === 'plans' && <PlansTab />}
        {tab === 'structures' && <StructuresTab />}
      </Card>

      <CollectPaymentModal
        open={Boolean(collectFor)}
        installment={collectFor?.id ? collectFor : null}
        onClose={() => setCollectFor(null)}
      />
    </>
  );
}

/* --------------------------------- dues --------------------------------- */

function DuesTab({ onCollect }: { onCollect: (row: FeeInstallment) => void }) {
  const [page, setPage] = useState(1);

  const dues = useQuery({
    queryKey: ['fees', 'dues', page],
    queryFn: () => feeService.dueInstallments({ page, per_page: 15 }),
    placeholderData: keepPreviousData,
  });

  const totals = useMemo(() => {
    const rows = dues.data?.items ?? [];
    const due = rows.reduce((sum, r) => sum + (Number(r.amount) - Number(r.paid_amount ?? 0)), 0);
    const overdue = rows.filter((r) => r.status === 'overdue').length;
    return { due, overdue, count: dues.data?.meta.total ?? rows.length };
  }, [dues.data]);

  const columns: Column<FeeInstallment>[] = [
    {
      key: 'student',
      header: 'Student',
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink-900">
            {row.student ? fullName(row.student) : `Student #${row.student_id ?? '—'}`}
          </p>
          <p className="truncate text-[12px] text-ink-500 tnum">
            {row.student?.admission_number ?? ''}
          </p>
        </div>
      ),
    },
    { key: 'due_date', header: 'Due date', render: (row) => formatDate(row.due_date) },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (row) => <span className="tnum">{formatCurrency(row.amount)}</span>,
    },
    {
      key: 'paid',
      header: 'Paid',
      align: 'right',
      render: (row) => <span className="tnum text-ink-500">{formatCurrency(row.paid_amount ?? 0)}</span>,
    },
    {
      key: 'balance',
      header: 'Balance',
      align: 'right',
      render: (row) => (
        <span className="font-semibold tnum text-ink-900">
          {formatCurrency(Number(row.amount) - Number(row.paid_amount ?? 0))}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone={statusTone(row.status)}>{titleCase(row.status)}</Badge>,
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      width: '100px',
      render: (row) => (
        <Button size="sm" variant="secondary" onClick={() => onCollect(row)}>
          Collect
        </Button>
      ),
    },
  ];

  return (
    <>
      <CardBody className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Outstanding"
          value={formatCurrency(totals.due, true)}
          sublabel="On this page"
          icon={<IndianRupee className="size-4" />}
          accent="navy"
        />
        <StatCard
          label="Installments due"
          value={totals.count}
          sublabel="Across all students"
          icon={<Receipt className="size-4" />}
          accent="gold"
        />
        <StatCard label="Overdue" value={totals.overdue} sublabel="Past the due date" />
      </CardBody>

      {dues.error ? (
        <ErrorState error={dues.error} onRetry={() => dues.refetch()} />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={dues.data?.items ?? []}
            loading={dues.isLoading}
            rowKey={(row) => row.id}
            empty={
              <EmptyState
                icon={<Receipt className="size-5" />}
                title="Nothing outstanding"
                description="Every installment on file has been collected."
              />
            }
          />
          <Pagination meta={dues.data?.meta} onPage={setPage} />
        </>
      )}
    </>
  );
}

/* --------------------------------- plans -------------------------------- */

function PlansTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search);

  const plans = useQuery({
    queryKey: ['fees', 'plans', page, debounced],
    queryFn: () =>
      feeService.plans({ page, per_page: 15, ...(debounced ? { search: debounced } : {}) }),
    placeholderData: keepPreviousData,
  });

  const columns: Column<StudentFeePlan>[] = [
    {
      key: 'student',
      header: 'Student',
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink-900">
            {row.student ? fullName(row.student) : `Student #${row.student_id}`}
          </p>
          <p className="truncate text-[12px] text-ink-500 tnum">
            {row.student?.admission_number ?? ''}
          </p>
        </div>
      ),
    },
    {
      key: 'structure',
      header: 'Structure',
      render: (row) => row.fee_structure?.name ?? `#${row.fee_structure_id}`,
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      render: (row) => <span className="tnum">{formatCurrency(row.total_amount ?? 0)}</span>,
    },
    {
      key: 'paid',
      header: 'Paid',
      align: 'right',
      render: (row) => (
        <span className="tnum text-[var(--color-success)]">{formatCurrency(row.paid_amount ?? 0)}</span>
      ),
    },
    {
      key: 'due',
      header: 'Due',
      align: 'right',
      render: (row) => (
        <span className="font-semibold tnum text-ink-900">{formatCurrency(row.due_amount ?? 0)}</span>
      ),
    },
    {
      key: 'period',
      header: 'Period',
      render: (row) => (
        <span className="text-[12px] text-ink-500">
          {formatDate(row.start_date, 'MMM yyyy')} – {formatDate(row.end_date, 'MMM yyyy')}
        </span>
      ),
    },
  ];

  return (
    <>
      <div className="p-4 hairline-b">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search by student…"
        />
      </div>
      {plans.error ? (
        <ErrorState error={plans.error} onRetry={() => plans.refetch()} />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={plans.data?.items ?? []}
            loading={plans.isLoading}
            rowKey={(row) => row.id}
            empty={
              <EmptyState
                icon={<Receipt className="size-5" />}
                title="No fee plans"
                description="Assign a fee structure to students to generate their installments."
              />
            }
          />
          <Pagination meta={plans.data?.meta} onPage={setPage} />
        </>
      )}
    </>
  );
}

/* ------------------------------ structures ------------------------------ */

function StructuresTab() {
  const [page, setPage] = useState(1);

  const structures = useQuery({
    queryKey: ['fees', 'structures', page],
    queryFn: () => feeService.structures({ page, per_page: 15 }),
    placeholderData: keepPreviousData,
  });

  const columns: Column<FeeStructure>[] = [
    { key: 'name', header: 'Structure', render: (row) => <span className="font-medium text-ink-900">{row.name}</span> },
    {
      key: 'components',
      header: 'Components',
      align: 'right',
      render: (row) => <span className="tnum">{row.components?.length ?? '—'}</span>,
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      render: (row) => <span className="font-semibold tnum">{formatCurrency(row.total_amount ?? 0)}</span>,
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
  ];

  return structures.error ? (
    <ErrorState error={structures.error} onRetry={() => structures.refetch()} />
  ) : (
    <>
      <DataTable
        columns={columns}
        rows={structures.data?.items ?? []}
        loading={structures.isLoading}
        rowKey={(row) => row.id}
        empty={
          <EmptyState
            icon={<Plus className="size-5" />}
            title="No fee structures"
            description="A structure bundles tuition, transport and other components into one plan."
          />
        }
      />
      <Pagination meta={structures.data?.meta} onPage={setPage} />
    </>
  );
}

/* ------------------------------- collect -------------------------------- */

function CollectPaymentModal({
  open,
  installment,
  onClose,
}: {
  open: boolean;
  installment: FeeInstallment | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [studentSearch, setStudentSearch] = useState('');
  const debounced = useDebounced(studentSearch);

  const [form, setForm] = useState({
    student_id: '',
    amount: '',
    payment_mode: 'cash',
    payment_date: toApiDate(),
    reference_number: '',
    remarks: '',
  });
  const [error, setError] = useState<ApiError | null>(null);

  const students = useQuery({
    queryKey: ['students', 'picker', debounced],
    queryFn: () => studentService.list({ per_page: 20, ...(debounced ? { search: debounced } : {}) }),
    enabled: open && !installment,
  });

  const pay = useMutation({
    mutationFn: () =>
      feeService.processPayment({
        student_id: Number(form.student_id || installment?.student_id),
        amount: Number(form.amount),
        payment_mode: form.payment_mode,
        payment_date: form.payment_date,
        ...(form.reference_number ? { reference_number: form.reference_number.trim() } : {}),
        ...(form.remarks ? { remarks: form.remarks.trim() } : {}),
        ...(installment?.id ? { allocations: [{ installment_id: installment.id, amount: Number(form.amount) }] } : {}),
      }),
    onSuccess: () => {
      toast.success('Payment recorded.');
      queryClient.invalidateQueries({ queryKey: ['fees'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
    },
    onError: (err: ApiError) => {
      setError(err);
      if (!err.errors) toast.error(err.message);
    },
  });

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  const err = (field: string) => error?.fieldError(field);
  const balance = installment
    ? Number(installment.amount) - Number(installment.paid_amount ?? 0)
    : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Collect payment"
      description={
        installment
          ? `Installment due ${formatDate(installment.due_date)}`
          : 'Record a payment against a student account.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pay.isPending}>
            Cancel
          </Button>
          <Button onClick={() => pay.mutate()} loading={pay.isPending}>
            Record payment
          </Button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          pay.mutate();
        }}
      >
        {installment ? (
          <div className="rounded-[var(--radius-field)] bg-navy-900 px-4 py-3.5 text-white">
            <p className="text-[12px] text-navy-200">
              {installment.student ? fullName(installment.student) : `Student #${installment.student_id}`}
            </p>
            <p className="mt-0.5 text-[22px] font-semibold tnum">{formatCurrency(balance ?? 0)}</p>
            <p className="text-[12px] text-gold-400">outstanding on this installment</p>
          </div>
        ) : (
          <>
            <SearchInput
              value={studentSearch}
              onChange={setStudentSearch}
              placeholder="Find a student…"
              className="w-full sm:w-full"
            />
            <Select
              label="Student"
              required
              value={form.student_id}
              onChange={(e) => set('student_id', e.target.value)}
              placeholder={students.isLoading ? 'Loading…' : 'Select a student'}
              error={err('student_id')}
              options={(students.data?.items ?? []).map((s) => ({
                value: s.id,
                label: `${s.first_name} ${s.last_name} · ${s.admission_number}`,
              }))}
            />
          </>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            type="number"
            label="Amount"
            required
            min={1}
            step="0.01"
            max={balance ?? undefined}
            value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
            error={err('amount')}
            leading={<IndianRupee className="size-4" />}
            hint={balance !== null ? `Max ${formatCurrency(balance)}` : undefined}
          />
          <Input
            type="date"
            label="Payment date"
            required
            max={toApiDate()}
            value={form.payment_date}
            onChange={(e) => set('payment_date', e.target.value)}
            error={err('payment_date')}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Mode"
            required
            value={form.payment_mode}
            onChange={(e) => set('payment_mode', e.target.value)}
            error={err('payment_mode')}
            options={PAYMENT_MODES.map((m) => ({ value: m, label: titleCase(m) }))}
          />
          <Input
            label="Reference number"
            placeholder="UTR / cheque no."
            value={form.reference_number}
            onChange={(e) => set('reference_number', e.target.value)}
            error={err('reference_number')}
          />
        </div>

        <Textarea
          label="Remarks"
          value={form.remarks}
          onChange={(e) => set('remarks', e.target.value)}
          error={err('remarks')}
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
