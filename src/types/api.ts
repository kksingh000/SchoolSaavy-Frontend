/* ---------------------------------------------------------------------------
   Types mirrored from the Laravel API resources
   (app/Http/Resources/*.php) and controller response envelopes.
--------------------------------------------------------------------------- */

export type UserType = 'super_admin' | 'school_admin' | 'teacher' | 'parent' | 'student';

/** BaseController::successResponse / errorResponse */
export interface ApiEnvelope<T> {
  status: 'success' | 'error';
  message: string;
  data: T;
  notification?: ApiNotification | null;
}

/** BaseController::paginatedSuccessResponse */
export interface PaginatedEnvelope<T> extends ApiEnvelope<T[]> {
  meta: PaginationMeta;
  links: PaginationLinks;
}

export interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  path: string;
  per_page: number;
  to: number | null;
  total: number;
}

export interface PaginationLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface ApiNotification {
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  action?: { text: string; url: string };
  dismissible?: boolean;
  persistent?: boolean;
  priority?: string;
}

/* ------------------------------- auth ---------------------------------- */

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  user_type: UserType;
  profile?: Record<string, unknown> | null;
}

export interface SchoolContext {
  id: number;
  name: string;
  code?: string;
  logo?: string | null;
  status?: string;
  [k: string]: unknown;
}

export interface LoginPayload {
  email: string;
  password: string;
  user_type: UserType;
}

export interface LoginResponse {
  message: string;
  user: AuthUser;
  token: string;
  expires_at: string;
  school?: SchoolContext;
  students?: StudentLite[];
  notification?: ApiNotification;
}

export interface TokenCheckResponse {
  valid: boolean;
  user: AuthUser;
  token_created_at: string;
  token_expires_at: string;
  expires_in_minutes: number;
  is_expired: boolean;
}

/* ------------------------------ domain --------------------------------- */

export interface StudentLite {
  id: number;
  first_name: string;
  last_name: string;
  admission_number: string;
  class_name?: string | null;
  profile_photo_url?: string | null;
}

export interface Student {
  id: number;
  admission_number: string;
  roll_number: number | null;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  admission_date: string;
  blood_group: string | null;
  profile_photo: string | null;
  profile_photo_url: string | null;
  address: string;
  phone: string | null;
  is_active: boolean;
  class_id: number | null;
  class_name: string | null;
  school?: School;
  created_at: string;
  updated_at: string;
}

export interface School {
  id: number;
  name: string;
  code?: string;
  email?: string;
  phone?: string;
  address?: string;
  logo?: string | null;
  status?: string;
  [k: string]: unknown;
}

export interface Teacher {
  id: number;
  user_id: number;
  employee_id: string;
  name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  joining_date: string | null;
  years_of_experience: number | null;
  gender: 'male' | 'female' | 'other' | null;
  qualification: string | null;
  specializations: string[] | null;
  profile_photo: string | null;
  profile_photo_url: string | null;
  address: string | null;
  is_active: boolean;
  classes?: ClassRoom[];
  classes_count?: number;
  statistics?: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export interface TodaysAttendance {
  date: string;
  total_students: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  excused_count: number;
  leave_count: number;
  attendance_percentage: number;
  records: {
    student_id: number;
    student_name: string | null;
    admission_number: string | null;
    status: AttendanceStatus;
    check_in_time: string | null;
    check_out_time: string | null;
    remarks: string | null;
  }[];
}

export interface ClassRoom {
  id: number;
  name: string;
  grade_level: number;
  section: string | null;
  class_teacher?: Teacher;
  capacity: number;
  description: string | null;
  is_active: boolean;
  promotes_to_class_id: number | null;
  promotes_to?: ClassRoom;
  students_count?: number;
  students?: Student[];
  todays_attendance?: TodaysAttendance;
  subjects?: Subject[];
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  is_active?: boolean;
  [k: string]: unknown;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | 'leave';

export interface AttendanceRecord {
  id: number;
  student?: Student;
  class?: ClassRoom;
  date: string;
  status: AttendanceStatus;
  remarks: string | null;
  marked_by?: { id: number; name: string; email: string; user_type: UserType };
  created_at: string;
  updated_at: string;
}

export interface BulkAttendancePayload {
  class_id: number;
  date: string;
  attendances: { student_id: number; status: AttendanceStatus; remarks?: string | null }[];
}

export type AssignmentType = 'homework' | 'project' | 'classwork' | 'practice' | string;

export interface Assignment {
  id: number;
  title: string;
  description: string | null;
  instructions: string | null;
  type: AssignmentType;
  status: string;
  assigned_date: string;
  due_date: string;
  due_time: string | null;
  max_marks: number | null;
  attachments: { name: string; url: string; size?: number }[] | null;
  allow_late_submission: boolean;
  grading_criteria: string | null;
  is_active: boolean;
  is_overdue: boolean;
  days_until_due: number;
  can_be_edited: boolean;
  can_be_deleted: boolean;
  can_accept_submissions: boolean;
  submission_stats: {
    total?: number;
    submitted?: number;
    graded?: number;
    pending?: number;
    [k: string]: number | undefined;
  } | null;
  average_marks: number | null;
  teacher?: { id: number; name: string; email: string };
  class?: { id: number; name: string; section: string | null; grade_level: number };
  subject?: { id: number; name: string; code: string };
  created_at: string;
  updated_at: string;
}

export interface AssignmentSubmission {
  id: number;
  assignment_id: number;
  student_id: number;
  student?: StudentLite;
  status: string;
  submitted_at: string | null;
  marks_obtained: number | null;
  feedback: string | null;
  attachments: { name: string; url: string }[] | null;
  is_late?: boolean;
  [k: string]: unknown;
}

export type EventType =
  | 'announcement'
  | 'holiday'
  | 'exam'
  | 'meeting'
  | 'sports'
  | 'cultural'
  | 'academic'
  | 'emergency'
  | 'other';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface SchoolEvent {
  id: number;
  title: string;
  description: string | null;
  type: EventType;
  priority: Priority;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  formatted_time: string | null;
  location: string | null;
  target_audience: string[];
  affected_classes: number[] | null;
  is_recurring: boolean;
  recurrence_type: string | null;
  recurrence_end_date: string | null;
  requires_acknowledgment: boolean;
  is_published: boolean;
  published_at: string | null;
  attachments: unknown[] | null;
  is_upcoming: boolean;
  is_today: boolean;
  days_until_event: number;
  acknowledgment_rate?: number;
  is_acknowledged_by_current_user?: boolean;
  total_acknowledgments?: number;
  creator: { id: number | null; name: string; email: string | null };
  created_at: string | null;
  updated_at: string | null;
}

export interface TimetableSlot {
  id: number;
  class_id: number;
  subject_id: number;
  teacher_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room?: string | null;
  class?: ClassRoom;
  subject?: Subject;
  teacher?: Teacher;
  [k: string]: unknown;
}

export interface AcademicYear {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  status?: string;
  [k: string]: unknown;
}

export interface Assessment {
  id: number;
  title: string;
  description?: string | null;
  assessment_type_id: number;
  class_id: number;
  subject_id: number;
  assessment_date: string;
  max_marks: number;
  passing_marks?: number;
  status: string;
  results_published?: boolean;
  class?: ClassRoom;
  subject?: Subject;
  assessment_type?: AssessmentType;
  [k: string]: unknown;
}

export interface AssessmentType {
  id: number;
  name: string;
  code?: string;
  weightage?: number;
  is_active: boolean;
  [k: string]: unknown;
}

export interface AssessmentResult {
  id: number;
  assessment_id: number;
  student_id: number;
  marks_obtained: number;
  grade?: string | null;
  remarks?: string | null;
  is_published?: boolean;
  student?: StudentLite;
  [k: string]: unknown;
}

/* -------------------------------- fees ---------------------------------- */

export interface MasterFeeComponent {
  id: number;
  name: string;
  code?: string;
  description?: string | null;
  is_active: boolean;
  [k: string]: unknown;
}

export interface FeeStructureComponent {
  id: number;
  master_fee_component_id?: number;
  name: string;
  amount: number;
  frequency?: string;
  is_required?: boolean;
  [k: string]: unknown;
}

export interface FeeStructure {
  id: number;
  name: string;
  academic_year_id: number;
  class_id?: number | null;
  total_amount?: number;
  is_active: boolean;
  components?: FeeStructureComponent[];
  [k: string]: unknown;
}

export interface StudentFeePlan {
  id: number;
  student_id: number;
  fee_structure_id: number;
  start_date: string | null;
  end_date: string | null;
  total_amount?: number;
  paid_amount?: number;
  due_amount?: number;
  student?: StudentLite;
  fee_structure?: FeeStructure;
  [k: string]: unknown;
}

export interface FeeInstallment {
  id: number;
  student_fee_plan_id: number;
  student_id?: number;
  due_date: string;
  amount: number;
  paid_amount?: number;
  status: 'pending' | 'partial' | 'paid' | 'overdue' | string;
  student?: StudentLite;
  [k: string]: unknown;
}

export interface FeePayment {
  id: number;
  student_id: number;
  amount: number;
  payment_date: string;
  payment_mode: string;
  reference_number?: string | null;
  receipt_number?: string | null;
  remarks?: string | null;
  student?: StudentLite;
  [k: string]: unknown;
}

export interface StudentFeeSummary {
  student?: StudentLite;
  total_fee?: number;
  total_paid?: number;
  total_due?: number;
  overdue_amount?: number;
  next_due_date?: string | null;
  [k: string]: unknown;
}

/* ---------------------------- notifications ----------------------------- */

export interface AppNotification {
  id: number;
  title: string;
  message: string;
  type: string;
  priority: Priority;
  target_type?: string;
  is_read?: boolean;
  read_at?: string | null;
  created_at: string;
  [k: string]: unknown;
}

/* ------------------------------ dashboards ------------------------------ */

export interface ChartSeries {
  labels?: string[];
  data?: number[];
  colors?: string[];
}

export interface AdminDashboard {
  school_info: {
    name: string;
    code: string;
    total_students: number;
    total_teachers: number;
    total_classes: number;
    active_modules: number;
  };
  quick_stats: {
    present_today: number;
    absent_today: number;
    pending_fees: number;
    active_modules: number;
  };
  upcoming_events: SchoolEvent[];
  analytics: {
    attendance_graph: {
      chart_data: { dates: string[]; present: number[]; absent: number[] };
      summary: Record<string, number | string>;
    };
    fee_collection: {
      chart_data: { months: string[]; collected: number[]; pending: number[] };
      summary: Record<string, number | string>;
    };
    performance_analytics: {
      class_performance: ChartSeries;
      subject_performance: ChartSeries;
      summary: Record<string, number | string>;
    };
    class_distribution: ChartSeries;
    assignment_statistics: {
      assignment_status: ChartSeries;
      submission_status: ChartSeries;
      summary: Record<string, number | string>;
    };
  };
}

export interface TeacherDashboard {
  teacher_info: { name: string; employee_id: string; classes_assigned: number };
  dashboard_metrics: Record<string, number>;
  today_schedule: TimetableSlot[];
  class_attendance: unknown[];
  pending_tasks: unknown[];
}

export interface ParentDashboard {
  [k: string]: unknown;
}

export interface Module {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  status?: 'active' | 'inactive';
  price?: number;
  [k: string]: unknown;
}

export interface ActivityLog {
  id: number;
  user_id: number | null;
  user_name?: string | null;
  action: string;
  entity_type?: string | null;
  entity_id?: number | null;
  description?: string | null;
  ip_address?: string | null;
  created_at: string;
  [k: string]: unknown;
}
