import { api } from '@/lib/http';
import type {
  AcademicYear,
  Assessment,
  AssessmentResult,
  AssessmentType,
  Assignment,
  AssignmentSubmission,
  AttendanceRecord,
  AttendanceStatus,
  BulkAttendancePayload,
  SchoolEvent,
  TimetableSlot,
} from '@/types/api';
import type { ListParams } from './people';

/* ------------------------------ attendance ------------------------------ */

export const attendanceService = {
  list: (params: ListParams = {}) => api.paginated<AttendanceRecord>('/attendance', { params }),

  classByDate: (classId: number | string, date: string) =>
    api.get<{
      class_id: number;
      date: string;
      records: AttendanceRecord[];
      [k: string]: unknown;
    }>(`/attendance/class/${classId}/date`, { params: { date } }),

  classReport: (classId: number | string, params: { from?: string; to?: string; month?: string }) =>
    api.get<Record<string, unknown>>(`/attendance/class/${classId}/report`, { params }),

  studentReport: (studentId: number | string, params?: Record<string, unknown>) =>
    api.get<Record<string, unknown>>(`/attendance/student/${studentId}/report`, { params }),

  markOne: (payload: {
    student_id: number;
    class_id: number;
    date: string;
    status: AttendanceStatus;
    remarks?: string;
  }) => api.post('/attendance', payload),

  markBulk: (payload: BulkAttendancePayload) => api.post('/attendance/bulk', payload),

  /** Teacher-scoped variants (same controller, role-guarded route). */
  teacher: {
    markBulk: (payload: BulkAttendancePayload) => api.post('/teacher/attendance/bulk', payload),
    classByDate: (classId: number | string, date: string) =>
      api.get<{ records: AttendanceRecord[]; [k: string]: unknown }>(
        `/teacher/attendance/class/${classId}/date`,
        { params: { date } },
      ),
    classReport: (classId: number | string, params: Record<string, unknown>) =>
      api.get<Record<string, unknown>>(`/teacher/attendance/class/${classId}/report`, { params }),
  },
};

/* ------------------------------ assignments ----------------------------- */

export const assignmentService = {
  list: (params: ListParams = {}) => api.paginated<Assignment>('/assignments', { params }),
  get: (id: number | string) => api.get<Assignment>(`/assignments/${id}`),
  create: (payload: Record<string, unknown>) => api.post<Assignment>('/assignments', payload),
  update: (id: number | string, payload: Record<string, unknown>) =>
    api.put<Assignment>(`/assignments/${id}`, payload),
  remove: (id: number | string) => api.delete(`/assignments/${id}`),

  statistics: () => api.get<Record<string, number>>('/assignments/statistics'),
  teacherDashboard: () => api.get<Record<string, unknown>>('/assignments/teacher-dashboard'),
  byClass: (classId: number | string, params?: ListParams) =>
    api.paginated<Assignment>(`/assignments/class/${classId}`, { params }),
  upcomingByClass: (classId: number | string) =>
    api.get<Assignment[]>(`/assignments/class/${classId}/upcoming`),
  forStudent: (studentId: number | string) =>
    api.get<Assignment[]>(`/assignments/student/${studentId}`),

  submissionOverview: (id: number | string) =>
    api.get<{ submissions: AssignmentSubmission[]; [k: string]: unknown }>(
      `/assignments/${id}/submission-overview`,
    ),
  submissionDetail: (assignmentId: number | string, studentId: number | string) =>
    api.get<AssignmentSubmission>(`/assignments/${assignmentId}/student/${studentId}/submission`),

  grade: (submissionId: number | string, payload: { marks_obtained: number; feedback?: string }) =>
    api.post(`/assignment-submissions/${submissionId}/grade`, payload),
  returnForRevision: (submissionId: number | string, feedback?: string) =>
    api.post(`/assignment-submissions/${submissionId}/return-for-revision`, { feedback }),
};

/* ------------------------------ assessments ----------------------------- */

export const assessmentService = {
  list: (params: ListParams = {}) => api.paginated<Assessment>('/assessments', { params }),
  get: (id: number | string) => api.get<Assessment>(`/assessments/${id}`),
  create: (payload: Record<string, unknown>) => api.post<Assessment>('/assessments', payload),
  update: (id: number | string, payload: Record<string, unknown>) =>
    api.put<Assessment>(`/assessments/${id}`, payload),
  remove: (id: number | string) => api.delete(`/assessments/${id}`),

  upcoming: () => api.get<Assessment[]>('/assessments/upcoming'),
  completed: () => api.get<Assessment[]>('/assessments/completed'),
  statistics: () => api.get<Record<string, number>>('/assessments/statistics'),
  byClass: (classId: number | string) => api.get<Assessment[]>(`/assessments/class/${classId}`),

  results: (id: number | string) => api.get<AssessmentResult[]>(`/assessments/${id}/results`),
  saveResults: (
    id: number | string,
    results: { student_id: number; marks_obtained: number; remarks?: string }[],
  ) => api.post(`/assessments/${id}/results/bulk`, { results }),
  publishResults: (id: number | string) => api.patch(`/assessments/${id}/publish-results`),
  studentResults: (studentId: number | string) =>
    api.get<AssessmentResult[]>(`/assessment-results/student/${studentId}`),
};

export const assessmentTypeService = {
  list: () => api.get<AssessmentType[]>('/assessment-types'),
  active: () => api.get<AssessmentType[]>('/assessment-types/active'),
  create: (payload: Record<string, unknown>) => api.post('/assessment-types', payload),
  update: (id: number | string, payload: Record<string, unknown>) =>
    api.put(`/assessment-types/${id}`, payload),
  remove: (id: number | string) => api.delete(`/assessment-types/${id}`),
  toggle: (id: number | string) => api.patch(`/assessment-types/${id}/toggle-status`),
};

/* ------------------------------- timetable ------------------------------ */

export const timetableService = {
  list: (params: ListParams = {}) => api.paginated<TimetableSlot>('/timetable', { params }),
  create: (payload: Record<string, unknown>) => api.post('/timetable', payload),
  update: (id: number | string, payload: Record<string, unknown>) =>
    api.put(`/timetable/${id}`, payload),
  remove: (id: number | string) => api.delete(`/timetable/${id}`),
  forClass: (classId: number | string) => api.get<TimetableSlot[]>(`/timetable/class/${classId}`),
  forTeacher: (teacherId: number | string) =>
    api.get<TimetableSlot[]>(`/timetable/teacher/${teacherId}`),
  weeklyOverview: (params?: Record<string, unknown>) =>
    api.get<Record<string, TimetableSlot[]>>('/timetable/weekly-overview', { params }),
  filterOptions: () => api.get<Record<string, unknown>>('/timetable/filter-options'),
  createBulk: (payload: Record<string, unknown>) => api.post('/timetable/bulk/create', payload),
  replace: (payload: Record<string, unknown>) => api.put('/timetable/bulk/replace', payload),
  mySchedule: () => api.get<TimetableSlot[]>('/teacher/timetable/my-schedule'),
};

/* --------------------------------- events ------------------------------- */

export const eventService = {
  list: (params: ListParams = {}) => api.paginated<SchoolEvent>('/events', { params }),
  get: (id: number | string) => api.get<SchoolEvent>(`/events/${id}`),
  create: (payload: Record<string, unknown>) => api.post<SchoolEvent>('/events', payload),
  update: (id: number | string, payload: Record<string, unknown>) =>
    api.put<SchoolEvent>(`/events/${id}`, payload),
  remove: (id: number | string) => api.delete(`/events/${id}`),
  today: () => api.get<SchoolEvent[]>('/events/todays'),
  upcoming: () => api.get<SchoolEvent[]>('/events/upcoming'),
  calendar: (params: { month?: number; year?: number }) =>
    api.get<SchoolEvent[]>('/events/calendar', { params }),
  unacknowledged: () => api.get<SchoolEvent[]>('/events/unacknowledged'),
  statistics: () => api.get<Record<string, number>>('/events/statistics'),
  acknowledge: (id: number | string, comments?: string) =>
    api.post(`/events/${id}/acknowledge`, { comments }),
  duplicate: (id: number | string) => api.post(`/events/${id}/duplicate`),
};

/* ---------------------------- academic years ---------------------------- */

export const academicYearService = {
  list: (params: ListParams = {}) => api.paginated<AcademicYear>('/academic-years', { params }),
  current: () => api.get<AcademicYear>('/academic-years/get-current'),
  get: (id: number | string) => api.get<AcademicYear>(`/academic-years/${id}`),
  create: (payload: Record<string, unknown>) => api.post<AcademicYear>('/academic-years', payload),
  update: (id: number | string, payload: Record<string, unknown>) =>
    api.put(`/academic-years/${id}`, payload),
  remove: (id: number | string) => api.delete(`/academic-years/${id}`),
  setCurrent: (id: number | string) => api.post(`/academic-years/${id}/set-current`),
  startPromotion: (id: number | string) => api.post(`/academic-years/${id}/start-promotion`),
  complete: (id: number | string) => api.post(`/academic-years/${id}/complete`),
  generateNext: (id: number | string) => api.get(`/academic-years/${id}/generate-next`),
  /** Injected by the CheckAcademicYear middleware on most admin routes. */
  check: () => api.get<{ has_academic_year: boolean; [k: string]: unknown }>('/academic-year-check'),
};

/* ------------------------------- promotions ----------------------------- */

export const promotionService = {
  readiness: (yearId: number | string) => api.get(`/promotions/readiness/${yearId}`),
  criteria: (yearId: number | string, params?: ListParams) =>
    api.paginated<Record<string, unknown>>(`/promotions/criteria/${yearId}`, { params }),
  storeCriteria: (payload: Record<string, unknown>) => api.post('/promotions/criteria', payload),
  bulkEvaluate: (payload: Record<string, unknown>) => api.post('/promotions/bulk-evaluate', payload),
  applyPromotions: (payload: Record<string, unknown>) =>
    api.post('/promotions/apply-promotions', payload),
  statistics: (yearId: number | string) =>
    api.get<Record<string, number>>(`/promotions/statistics/${yearId}`),
  students: (yearId: number | string, params?: ListParams) =>
    api.paginated<Record<string, unknown>>(`/promotions/students/${yearId}`, { params }),
  batches: (yearId: number | string, params?: ListParams) =>
    api.paginated<Record<string, unknown>>(`/promotions/batches/${yearId}`, { params }),
  batchProgress: (batchId: number | string) =>
    api.get<Record<string, unknown>>(`/promotions/batches/${batchId}/progress`),
  override: (promotionId: number | string, payload: Record<string, unknown>) =>
    api.post(`/promotions/${promotionId}/override`, payload),
};
