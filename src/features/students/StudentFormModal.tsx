import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';
import { admissionService, parentService, studentService } from '@/services/people';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { ApiError } from '@/lib/http';
import { useAuth } from '@/app/auth-context';
import type { ClassRoom, Student } from '@/types/api';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

interface FormState {
  admission_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  admission_date: string;
  blood_group: string;
  address: string;
  phone: string;
  class_id: string;
  class_roll_number: string;
  parent_id: string;
  relationship: string;
  is_active: boolean;
}

const EMPTY: FormState = {
  admission_number: '',
  first_name: '',
  last_name: '',
  date_of_birth: '',
  gender: '',
  admission_date: new Date().toISOString().slice(0, 10),
  blood_group: '',
  address: '',
  phone: '',
  class_id: '',
  class_roll_number: '',
  parent_id: '',
  relationship: 'father',
  is_active: true,
};

export function StudentFormModal({
  open,
  student,
  classes,
  onClose,
  onSaved,
}: {
  open: boolean;
  student: Student | null;
  classes: ClassRoom[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { school } = useAuth();
  const isEdit = Boolean(student);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      student
        ? {
            ...EMPTY,
            admission_number: student.admission_number ?? '',
            first_name: student.first_name ?? '',
            last_name: student.last_name ?? '',
            date_of_birth: student.date_of_birth?.slice(0, 10) ?? '',
            gender: student.gender ?? '',
            admission_date: student.admission_date?.slice(0, 10) ?? '',
            blood_group: student.blood_group ?? '',
            address: student.address ?? '',
            phone: student.phone ?? '',
            class_id: student.class_id ? String(student.class_id) : '',
            class_roll_number: student.roll_number ? String(student.roll_number) : '',
            is_active: student.is_active,
          }
        : EMPTY,
    );
  }, [open, student]);

  // Parents are required on create (backend: parent_id required|exists:parents,id).
  const parents = useQuery({
    queryKey: ['parents', 'picker'],
    queryFn: () => parentService.list({ per_page: 100 }),
    enabled: open && !isEdit,
    staleTime: 5 * 60 * 1000,
  });

  const generateAdmission = useMutation({
    mutationFn: admissionService.generate,
    onSuccess: (res) => set('admission_number', res.admission_number),
    onError: (err: ApiError) => toast.error(err.message),
  });

  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      isEdit ? studentService.update(student!.id, payload) : studentService.create(payload),
    onSuccess: () => {
      toast.success(isEdit ? 'Student updated.' : 'Student added.');
      onSaved();
    },
    onError: (err: ApiError) => {
      setError(err);
      if (!err.errors) toast.error(err.message);
    },
  });

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function submit() {
    setError(null);
    const base: Record<string, unknown> = {
      admission_number: form.admission_number.trim(),
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      date_of_birth: form.date_of_birth,
      gender: form.gender,
      admission_date: form.admission_date,
      address: form.address.trim(),
      ...(form.blood_group ? { blood_group: form.blood_group } : {}),
      ...(form.phone ? { phone: form.phone.trim() } : {}),
      ...(form.class_id ? { class_id: Number(form.class_id) } : {}),
      ...(form.class_roll_number ? { class_roll_number: Number(form.class_roll_number) } : {}),
    };

    if (isEdit) {
      save.mutate({ ...base, is_active: form.is_active });
    } else {
      save.mutate({
        ...base,
        school_id: school?.id,
        parent_id: Number(form.parent_id),
        relationship: form.relationship,
        is_primary: true,
      });
    }
  }

  const err = (field: string) => error?.fieldError(field);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? 'Edit student' : 'Add a student'}
      description={
        isEdit
          ? 'Changes apply to the current academic year.'
          : 'A student needs a parent on file — create the parent first if they are not listed.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} loading={save.isPending}>
            {isEdit ? 'Save changes' : 'Add student'}
          </Button>
        </>
      }
    >
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <fieldset className="space-y-4">
          <legend className="label-caps mb-1">Identity</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="First name"
              required
              value={form.first_name}
              onChange={(e) => set('first_name', e.target.value)}
              error={err('first_name')}
            />
            <Input
              label="Last name"
              required
              value={form.last_name}
              onChange={(e) => set('last_name', e.target.value)}
              error={err('last_name')}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Input
                label="Admission number"
                required
                value={form.admission_number}
                onChange={(e) => set('admission_number', e.target.value)}
                error={err('admission_number')}
                hint={
                  !isEdit && (
                    <button
                      type="button"
                      onClick={() => generateAdmission.mutate()}
                      className="inline-flex items-center gap-1 text-gold-700 hover:underline"
                    >
                      <Sparkles className="size-3" />
                      Generate
                    </button>
                  )
                }
              />
            </div>
            <Select
              label="Gender"
              required
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

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              type="date"
              label="Date of birth"
              required
              value={form.date_of_birth}
              onChange={(e) => set('date_of_birth', e.target.value)}
              error={err('date_of_birth')}
            />
            <Input
              type="date"
              label="Admission date"
              required
              value={form.admission_date}
              onChange={(e) => set('admission_date', e.target.value)}
              error={err('admission_date')}
            />
            <Select
              label="Blood group"
              value={form.blood_group}
              onChange={(e) => set('blood_group', e.target.value)}
              placeholder="Not recorded"
              error={err('blood_group')}
              options={BLOOD_GROUPS.map((g) => ({ value: g, label: g }))}
            />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="label-caps mb-1">Placement</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Class"
              value={form.class_id}
              onChange={(e) => set('class_id', e.target.value)}
              placeholder="Assign later"
              error={err('class_id')}
              options={classes.map((c) => ({
                value: c.id,
                label: `${c.name}${c.section ? ` ${c.section}` : ''}`,
              }))}
            />
            <Input
              type="number"
              label="Roll number"
              min={1}
              value={form.class_roll_number}
              onChange={(e) => set('class_roll_number', e.target.value)}
              error={err('class_roll_number')}
            />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="label-caps mb-1">Contact</legend>
          <Textarea
            label="Address"
            required
            value={form.address}
            onChange={(e) => set('address', e.target.value)}
            error={err('address')}
          />
          <Input
            label="Phone"
            type="tel"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            error={err('phone')}
          />
        </fieldset>

        {!isEdit && (
          <fieldset className="space-y-4">
            <legend className="label-caps mb-1">Parent or guardian</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Parent"
                required
                value={form.parent_id}
                onChange={(e) => set('parent_id', e.target.value)}
                placeholder={parents.isLoading ? 'Loading…' : 'Select a parent'}
                error={err('parent_id')}
                options={(parents.data?.items ?? []).map((p) => {
                  const record = p as Record<string, unknown>;
                  return {
                    value: String(record.id),
                    label: `${String(record.name ?? record.first_name ?? 'Parent')}${
                      record.phone ? ` · ${String(record.phone)}` : ''
                    }`,
                  };
                })}
              />
              <Select
                label="Relationship"
                required
                value={form.relationship}
                onChange={(e) => set('relationship', e.target.value)}
                error={err('relationship')}
                options={[
                  { value: 'father', label: 'Father' },
                  { value: 'mother', label: 'Mother' },
                  { value: 'guardian', label: 'Guardian' },
                ]}
              />
            </div>
          </fieldset>
        )}

        {error && !error.errors && (
          <p className="rounded-[var(--radius-field)] bg-[var(--color-danger-soft)] px-3.5 py-2.5 text-[13px] text-[var(--color-danger)]">
            {error.message}
          </p>
        )}
      </form>
    </Modal>
  );
}
