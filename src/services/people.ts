import { api } from '@/lib/http';
import type { Paginated, Student, Teacher, ClassRoom, Subject } from '@/types/api';

export interface ListParams {
  page?: number;
  per_page?: number;
  search?: string;
  class_id?: number | string;
  is_active?: boolean | string;
  [k: string]: unknown;
}

export const studentService = {
  list: (params: ListParams = {}) => api.paginated<Student>('/students', { params }),
  get: (id: number | string) => api.get<Student>(`/students/${id}`),
  create: (payload: Record<string, unknown>) => api.post<Student>('/students', payload),
  update: (id: number | string, payload: Record<string, unknown>) =>
    api.put<Student>(`/students/${id}`, payload),
  remove: (id: number | string) => api.delete(`/students/${id}`),

  attendanceReport: (id: number | string, params?: Record<string, unknown>) =>
    api.get<Record<string, unknown>>(`/students/${id}/attendance`, { params }),
  feeStatus: (id: number | string) => api.get<Record<string, unknown>>(`/students/${id}/fees`),

  parents: (studentId: number | string) =>
    api.get<Record<string, unknown>[]>(`/students/${studentId}/parents`),
  assignParent: (studentId: number | string, payload: Record<string, unknown>) =>
    api.post(`/students/${studentId}/parents/assign`, payload),
  createAndAssignParent: (studentId: number | string, payload: Record<string, unknown>) =>
    api.post(`/students/${studentId}/parents/create`, payload),
  removeParent: (studentId: number | string, parentId: number | string) =>
    api.delete(`/students/${studentId}/parents/${parentId}`),

  // Bulk import
  downloadTemplate: () => api.get<Blob>('/students/import/template', { responseType: 'blob' }),
  startImport: (payload: { file_path: string; file_name: string }) =>
    api.post('/students/import', payload),
  imports: () => api.get<Record<string, unknown>[]>('/students/import'),
  importDetail: (id: number | string) => api.get(`/students/import/${id}`),
  importErrors: (id: number | string) => api.get(`/students/import/${id}/errors`),
  cancelImport: (id: number | string) => api.post(`/students/import/${id}/cancel`),
};

export const parentService = {
  list: (params: ListParams = {}) => api.paginated<Record<string, unknown>>('/parents', { params }),
  create: (payload: Record<string, unknown>) => api.post('/parents', payload),
  get: (id: number | string) => api.get<Record<string, unknown>>(`/parents/${id}`),
  update: (id: number | string, payload: Record<string, unknown>) => api.put(`/parents/${id}`, payload),
};

export const teacherService = {
  list: (params: ListParams = {}) => api.paginated<Teacher>('/teachers', { params }),
  get: (id: number | string) => api.get<Teacher>(`/teachers/${id}`),
  create: (payload: Record<string, unknown>) => api.post<Teacher>('/teachers', payload),
  update: (id: number | string, payload: Record<string, unknown>) =>
    api.put<Teacher>(`/teachers/${id}`, payload),
  remove: (id: number | string) => api.delete(`/teachers/${id}`),
  search: (q: string) => api.get<Teacher[]>('/teachers/search', { params: { q } }),
  generateEmployeeId: () => api.get<{ employee_id: string }>('/teachers/generate-employee-id'),
  classes: (id: number | string) => api.get<ClassRoom[]>(`/teachers/${id}/classes`),
  dashboardStats: (id: number | string) =>
    api.get<Record<string, number>>(`/teachers/${id}/dashboard-stats`),
};

export const classService = {
  list: (params: ListParams = {}) => api.paginated<ClassRoom>('/classes', { params }),
  /** Lightweight list for dropdowns — cached 10min server-side. */
  simple: () => api.get<ClassRoom[]>('/classes/simple'),
  myClasses: () => api.get<ClassRoom[]>('/classes/teachers-classes'),
  myClassesSimple: () => api.get<ClassRoom[]>('/classes/my-classes-simple'),
  get: (id: number | string) => api.get<ClassRoom>(`/classes/${id}`),
  students: (id: number | string, params?: ListParams) =>
    api.paginated<Student>(`/classes/${id}/students`, { params }),
  subjects: (id: number | string) => api.get<Subject[]>(`/classes/${id}/subjects`),
  timetable: (id: number | string) => api.get<Record<string, unknown>>(`/classes/${id}/timetable`),
  create: (payload: Record<string, unknown>) => api.post<ClassRoom>('/classes', payload),
  update: (id: number | string, payload: Record<string, unknown>) =>
    api.put<ClassRoom>(`/classes/${id}`, payload),
  remove: (id: number | string) => api.delete(`/classes/${id}`),
  assignStudents: (id: number | string, student_ids: number[]) =>
    api.post(`/classes/${id}/assign-students`, { student_ids }),
  assignSubjects: (id: number | string, subject_ids: number[]) =>
    api.post(`/classes/${id}/assign-subjects`, { subject_ids }),
  setPromotionMapping: (id: number | string, promotes_to_class_id: number | null) =>
    api.put(`/classes/${id}/promotion-mapping`, { promotes_to_class_id }),
};

export const subjectService = {
  list: (params: ListParams = {}) => api.paginated<Subject>('/subjects', { params }),
  get: (id: number | string) => api.get<Subject>(`/subjects/${id}`),
  create: (payload: Record<string, unknown>) => api.post<Subject>('/subjects', payload),
  update: (id: number | string, payload: Record<string, unknown>) =>
    api.put<Subject>(`/subjects/${id}`, payload),
  remove: (id: number | string) => api.delete(`/subjects/${id}`),
  byClass: (classId: number | string) => api.get<Subject[]>(`/subjects/class/${classId}`),
  byTeacher: (teacherId: number | string) => api.get<Subject[]>(`/subjects/teacher/${teacherId}`),
};

export const admissionService = {
  generate: () => api.get<{ admission_number: string }>('/admission-number/generate'),
  checkAvailability: (admission_number: string) =>
    api.get<{ available: boolean }>('/admission-number/check-availability', {
      params: { admission_number },
    }),
  settings: () => api.get<Record<string, unknown>>('/admission-number/settings'),
  updateSettings: (payload: Record<string, unknown>) =>
    api.put('/admission-number/settings', payload),
};

export const rollNumberService = {
  next: (class_id: number | string) =>
    api.get<{ roll_number: number }>('/roll-number/next', { params: { class_id } }),
  available: (class_id: number | string) =>
    api.get<number[]>('/roll-number/available', { params: { class_id } }),
  statistics: (class_id: number | string) =>
    api.get<Record<string, number>>('/roll-number/statistics', { params: { class_id } }),
};
