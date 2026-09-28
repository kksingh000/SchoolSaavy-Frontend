import { api } from '@/lib/http';
import type {
  FeeInstallment,
  FeePayment,
  FeeStructure,
  MasterFeeComponent,
  StudentFeePlan,
  StudentFeeSummary,
} from '@/types/api';
import type { ListParams } from './people';

export const feeService = {
  /* master components — catalogue the school draws structures from */
  masterComponents: () =>
    api.get<MasterFeeComponent[]>('/fee-management/master-components'),

  /* fee structures */
  structures: (params: ListParams = {}) =>
    api.paginated<FeeStructure>('/fee-management/structures', { params }),
  structure: (id: number | string) => api.get<FeeStructure>(`/fee-management/structures/${id}`),
  createStructure: (payload: Record<string, unknown>) =>
    api.post<FeeStructure>('/fee-management/structures', payload),
  updateStructure: (id: number | string, payload: Record<string, unknown>) =>
    api.put<FeeStructure>(`/fee-management/structures/${id}`, payload),
  removeStructure: (id: number | string) => api.delete(`/fee-management/structures/${id}`),

  /* per-student plans */
  plans: (params: ListParams = {}) =>
    api.paginated<StudentFeePlan>('/fee-management/student-plans', { params }),
  plan: (id: number | string) => api.get<StudentFeePlan>(`/fee-management/student-plans/${id}`),
  createPlan: (payload: Record<string, unknown>) =>
    api.post<StudentFeePlan>('/fee-management/student-plans', payload),
  updatePlan: (id: number | string, payload: Record<string, unknown>) =>
    api.put(`/fee-management/student-plans/${id}`, payload),
  removePlan: (id: number | string) => api.delete(`/fee-management/student-plans/${id}`),

  /* collection */
  dueInstallments: (params: ListParams = {}) =>
    api.paginated<FeeInstallment>('/fee-management/payments/due-installments', { params }),
  studentFeeDetails: (params: { student_id: number | string }) =>
    api.get<Record<string, unknown>>('/fee-management/payments/student-fee-details', { params }),
  detailedStudentFees: (studentId: number | string) =>
    api.get<Record<string, unknown>>(
      `/fee-management/payments/${studentId}/student-fee-details`,
    ),
  processPayment: (payload: {
    student_id: number;
    amount: number;
    payment_mode: string;
    payment_date: string;
    reference_number?: string;
    remarks?: string;
    allocations?: { installment_id: number; amount: number }[];
  }) => api.post<FeePayment>('/fee-management/payments', payload),

  paymentHistory: (studentId: number | string, params?: ListParams) =>
    api.paginated<FeePayment>(`/fee-management/students/${studentId}/payments`, { params }),
  summary: (studentId: number | string) =>
    api.get<StudentFeeSummary>(`/fee-management/students/${studentId}/summary`),
};
