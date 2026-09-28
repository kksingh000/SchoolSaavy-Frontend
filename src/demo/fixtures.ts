/* ---------------------------------------------------------------------------
   Demo fixtures.

   Lets anyone open the deployed site and explore the whole app without an
   account and without the API being up. Entirely client-side: nothing here
   touches the network, and no real school data is involved.
--------------------------------------------------------------------------- */

import type {
  Assignment,
  ClassRoom,
  FeeInstallment,
  SchoolEvent,
  Student,
  Subject,
  Teacher,
  TimetableSlot,
  AdminDashboard,
  AppNotification,
} from '@/types/api';

const FIRST = ['Aarav','Diya','Ishaan','Kavya','Rohan','Saanvi','Vihaan','Anaya','Arjun','Meera','Advait','Myra','Reyansh','Aadhya','Kabir','Zara','Vivaan','Ira'];
const LAST  = ['Mehta','Sharma','Verma','Nair','Gupta','Rao','Joshi','Kulkarni','Pillai','Iyer','Desai','Bhat','Reddy','Chauhan','Menon','Khan','Sethi','Bose'];
const CLASS_NAMES = ['Class VI A','Class VI B','Class VII A','Class VIII A','Class VIII B','Class IX A','Class IX B','Class X A'];

export const DEMO_SCHOOL = { id: 4, name: 'Greenwood Public School', code: 'GPS-014' };

export const DEMO_USERS = {
  school_admin: { id: 1, name: 'Krishna Singh', email: 'admin@greenwood.edu', user_type: 'school_admin' as const },
  teacher: { id: 2, name: 'Kavya Iyer', email: 'kavya@greenwood.edu', user_type: 'teacher' as const },
  parent: { id: 3, name: 'Priya Mehta', email: 'priya.mehta@example.com', user_type: 'parent' as const },
};

export const students: Student[] = Array.from({ length: 18 }, (_, i) => ({
  id: i + 1,
  admission_number: `GPS/2024/0${118 + i}`,
  roll_number: (i % 12) + 1,
  first_name: FIRST[i],
  last_name: LAST[i],
  date_of_birth: `2012-0${(i % 9) + 1}-1${i % 9}`,
  gender: i % 3 === 0 ? 'female' : 'male',
  admission_date: '2024-04-12',
  blood_group: ['A+','B+','O+','AB+','O-'][i % 5],
  profile_photo: null,
  profile_photo_url: null,
  address: `${12 + i} Sector ${30 + (i % 20)}, Greater Noida, UP 201310`,
  phone: `98${String(10000000 + i * 137).slice(0, 8)}`,
  is_active: i !== 6,
  class_id: (i % 8) + 1,
  class_name: i === 6 ? null : CLASS_NAMES[i % 8],
  created_at: '2024-04-12T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
}));

export const teachers: Teacher[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  user_id: i + 1,
  employee_id: `EMP-0${20 + i}`,
  name: `${FIRST[(i + 3) % 18]} ${LAST[(i + 5) % 18]}`,
  email: `${FIRST[(i + 3) % 18].toLowerCase()}@greenwood.edu`,
  phone: `98${String(20000000 + i * 311).slice(0, 8)}`,
  date_of_birth: '1988-06-14',
  joining_date: `20${18 + (i % 7)}-06-01`,
  years_of_experience: 3 + i,
  gender: i % 2 ? 'female' : 'male',
  qualification: ['M.Sc. Mathematics, B.Ed.','M.A. English, B.Ed.','M.Sc. Physics, B.Ed.','B.Tech, B.Ed.','M.Com, B.Ed.'][i % 5],
  specializations: null,
  profile_photo: null,
  profile_photo_url: null,
  address: 'Greater Noida, UP',
  is_active: i !== 9,
  classes_count: (i % 4) + 1,
  created_at: '',
  updated_at: '',
}));

export const classes: ClassRoom[] = CLASS_NAMES.map((name, i) => ({
  id: i + 1,
  name: name.replace(/ [AB]$/, ''),
  grade_level: [6, 6, 7, 8, 8, 9, 9, 10][i],
  section: name.slice(-1),
  class_teacher: teachers[i],
  capacity: 40,
  description: null,
  is_active: true,
  promotes_to_class_id: null,
  students_count: [38, 34, 40, 29, 36, 41, 22, 33][i],
  created_at: '',
  updated_at: '',
}));

export const subjects: Subject[] = ['Mathematics','Science','English','Social Studies','Hindi','Computer Science'].map((name, i) => ({
  id: i + 1,
  name,
  code: name.slice(0, 4).toUpperCase(),
  description: `${name} for grades VI–X`,
  is_active: true,
}));

export const assignments: Assignment[] = Array.from({ length: 14 }, (_, i) => ({
  id: i + 1,
  title: ['Chapter 4 — Quadratic equations','Photosynthesis lab report','Essay: The Last Lesson','Trigonometry worksheet 2','Periodic table quiz prep','Map work — Indian rivers','Algebra revision set','Poem analysis — Fire and Ice','Chemical reactions notes','History timeline project','Statistics problem set','Geometry constructions','Reading comprehension — Unit 3','Force and motion numericals'][i],
  description: null,
  instructions: null,
  type: ['homework','project','classwork','practice'][i % 4],
  status: i % 5 === 0 ? 'draft' : 'published',
  assigned_date: '2026-09-20',
  due_date: `2026-10-0${(i % 8) + 1}`,
  due_time: '23:59',
  max_marks: [20, 50, 25, 30][i % 4],
  attachments: null,
  allow_late_submission: i % 2 === 0,
  grading_criteria: null,
  is_active: true,
  is_overdue: i % 6 === 0,
  days_until_due: (i % 9) + 1,
  can_be_edited: true,
  can_be_deleted: true,
  can_accept_submissions: true,
  submission_stats: { total: 38, submitted: 20 + (i % 18), graded: 10 + (i % 12), pending: i % 9 },
  average_marks: 16 + (i % 6),
  class: { id: (i % 8) + 1, name: CLASS_NAMES[i % 8].replace(/ [AB]$/, ''), section: CLASS_NAMES[i % 8].slice(-1), grade_level: 8 },
  subject: { id: (i % 6) + 1, name: subjects[i % 6].name, code: subjects[i % 6].code },
  created_at: '2026-09-20 10:00:00',
  updated_at: '2026-09-20 10:00:00',
}));

export const events: SchoolEvent[] = Array.from({ length: 9 }, (_, i) => ({
  id: i + 1,
  title: ['Annual Sports Day','Parent–Teacher Meeting','Half-yearly exams begin','Gandhi Jayanti — Holiday','Science Exhibition','Inter-house Debate','Diwali Break begins','Class X Career Counselling','Annual Day rehearsal'][i],
  description: ['Track and field events across all houses. Students report in house colours by 7:45 AM.','Slot-wise meetings with subject teachers. Report cards handed over in person.','Timetable published on the notice board and shared with parents.','School remains closed.','Class VIII–X projects on display in the main hall. Parents welcome.','Two speakers per house. Topic shared one week in advance.','School reopens after the break. Holiday homework due on return.','Session with external counsellors on stream selection.','Full dress rehearsal — all participants must attend.'][i],
  type: (['sports','meeting','exam','holiday','academic','cultural','holiday','academic','cultural'] as const)[i],
  priority: (['high','urgent','medium','low','medium','low','medium','high','medium'] as const)[i],
  event_date: `2026-10-0${(i % 9) + 1}`,
  start_time: i % 3 ? '09:00' : null,
  end_time: i % 3 ? '14:00' : null,
  formatted_time: i % 3 ? '9:00 AM – 2:00 PM' : null,
  location: ['Main ground','Block B','All classrooms',null,'Main hall','Auditorium',null,'Library','Auditorium'][i],
  target_audience: ['all'],
  affected_classes: null,
  is_recurring: false,
  recurrence_type: null,
  recurrence_end_date: null,
  requires_acknowledgment: i % 3 === 0,
  is_published: true,
  published_at: null,
  attachments: null,
  is_upcoming: true,
  is_today: i === 0,
  days_until_event: i + 1,
  acknowledgment_rate: i % 3 === 0 ? 40 + i * 5 : undefined,
  is_acknowledged_by_current_user: i === 3,
  total_acknowledgments: 24,
  creator: { id: 1, name: 'Krishna Singh', email: 'admin@greenwood.edu' },
  created_at: '2026-09-01 10:00:00',
  updated_at: '2026-09-01 10:00:00',
}));

export const dues: FeeInstallment[] = Array.from({ length: 14 }, (_, i) => ({
  id: i + 1,
  student_fee_plan_id: i + 1,
  student_id: i + 1,
  due_date: `2026-10-0${(i % 9) + 1}`,
  amount: [18000, 22000, 15500, 26000][i % 4],
  paid_amount: i % 3 === 0 ? 0 : [6000, 11000, 4500][i % 3],
  status: (['overdue','pending','partial','pending'] as const)[i % 4],
  student: {
    id: i + 1,
    first_name: FIRST[i],
    last_name: LAST[i],
    admission_number: `GPS/2024/0${118 + i}`,
    class_name: CLASS_NAMES[i % 8],
  },
}));

export const feePlans = students.slice(0, 12).map((s, i) => ({
  id: i + 1,
  student_id: s.id,
  fee_structure_id: 1,
  start_date: '2026-04-01',
  end_date: '2027-03-31',
  total_amount: 86000,
  paid_amount: [86000, 64000, 43000, 21500][i % 4],
  due_amount: [0, 22000, 43000, 64500][i % 4],
  student: { id: s.id, first_name: s.first_name, last_name: s.last_name, admission_number: s.admission_number, class_name: s.class_name },
  fee_structure: { id: 1, name: 'Standard — Grades VI to X', academic_year_id: 3, is_active: true },
}));

export const feeStructures = [
  { id: 1, name: 'Standard — Grades VI to X', academic_year_id: 3, total_amount: 86000, is_active: true, components: new Array(5) },
  { id: 2, name: 'Standard + Transport (Zone A)', academic_year_id: 3, total_amount: 104000, is_active: true, components: new Array(6) },
  { id: 3, name: 'Staff ward concession', academic_year_id: 3, total_amount: 43000, is_active: true, components: new Array(4) },
  { id: 4, name: 'Grades XI–XII Science', academic_year_id: 3, total_amount: 118000, is_active: false, components: new Array(7) },
];

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday'];
const PERIODS: [string, string][] = [['08:00','08:45'],['08:45','09:30'],['09:50','10:35'],['10:35','11:20'],['11:40','12:25'],['12:25','13:10']];

export const timetable: TimetableSlot[] = PERIODS.flatMap(([start, end], pi) =>
  DAYS.flatMap((day, di) => {
    if ((pi + di) % 7 === 5) return [];
    const subject = subjects[(pi + di) % 6];
    return [{
      id: pi * 10 + di,
      class_id: 4,
      subject_id: subject.id,
      teacher_id: ((pi + di) % 12) + 1,
      day_of_week: day,
      start_time: start,
      end_time: end,
      room: `R-${20 + ((pi + di) % 6)}`,
      subject,
      teacher: teachers[(pi + di) % 12],
      class: classes[3],
    } as TimetableSlot];
  }),
);

export const notifications: AppNotification[] = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  title: ['Half-yearly datesheet published','Fee reminder — October installment','Sports Day: house colours','PTM slots now open','Library books due','Winter uniform from 1 Nov','Bus route 4 timing change','Science Exhibition entries'][i],
  message: ['The datesheet for Classes VI–X is on the notice board and in the parent portal.','The October installment is due on the 5th. Pay via the portal or at the office.','Students must report in house colours by 7:45 AM on 1 October.','Book a slot with your child’s class teacher for the 11 October meeting.','All issued books must be returned before the exams begin.','Winter uniform becomes compulsory from 1 November for all grades.','Route 4 now departs 10 minutes earlier from the first stop.','Entries close 30 September. Speak to your science teacher to register.'][i],
  type: ['academic','fee','event','event','library','general','transport','academic'][i],
  priority: (['high','urgent','medium','medium','low','low','medium','medium'] as const)[i],
  is_read: i > 2,
  read_at: null,
  created_at: `2026-09-${String(28 - i).padStart(2, '0')}T09:${String(10 + i).padStart(2, '0')}:00Z`,
}));

export const dashboard: AdminDashboard = {
  school_info: { name: DEMO_SCHOOL.name, code: DEMO_SCHOOL.code, total_students: 1284, total_teachers: 68, total_classes: 42, active_modules: 11 },
  quick_stats: { present_today: 1142, absent_today: 96, pending_fees: 1847500, active_modules: 11 },
  upcoming_events: events.slice(0, 5),
  analytics: {
    attendance_graph: {
      chart_data: {
        dates: Array.from({ length: 14 }, (_, i) => `2026-09-${String(i + 14).padStart(2, '0')}`),
        present: [1090,1121,1104,1150,1132,1098,1160,1143,1155,1120,1138,1166,1142,1151],
        absent: [194,163,180,134,152,186,124,141,129,164,146,118,142,133],
      },
      summary: {},
    },
    fee_collection: {
      chart_data: {
        months: ['Apr','May','Jun','Jul','Aug','Sep'],
        collected: [1820000,1640000,1910000,1755000,2040000,1680000],
        pending: [420000,560000,310000,480000,295000,610000],
      },
      summary: {},
    },
    performance_analytics: {
      class_performance: { labels: ['VI A','VI B','VII A','VIII A','VIII B','IX A','IX B','X A'], data: [78,72,81,69,84,76,80,74] },
      subject_performance: { labels: [], data: [] },
      summary: {},
    },
    class_distribution: {
      labels: ['Class VI','Class VII','Class VIII','Class IX','Class X','Class XI'],
      data: [248,236,221,198,204,177],
      colors: [],
    },
    assignment_statistics: {
      assignment_status: { labels: [], data: [] },
      submission_status: { labels: [], data: [] },
      summary: {},
    },
  },
};

export const teacherDashboard = {
  teacher_info: { name: DEMO_USERS.teacher.name, employee_id: 'EMP-022', classes_assigned: 4 },
  dashboard_metrics: { total_classes: 4, total_students: 137, total_assignments: 12, pending_submissions: 23 },
  today_schedule: timetable.filter((s) => s.day_of_week === 'monday').slice(0, 6),
  class_attendance: [],
  pending_tasks: [],
};

/** The two children shown in the parent portal. */
export const parentChildren = students.slice(0, 2).map((s) => ({ ...s }));

/** Attendance already recorded for the demo register, so it opens populated. */
export const attendanceRecords = [
  { student_id: 1, status: 'present' },
  { student_id: 2, status: 'present' },
  { student_id: 3, status: 'absent' },
  { student_id: 4, status: 'present' },
  { student_id: 5, status: 'late' },
  { student_id: 6, status: 'present' },
  { student_id: 8, status: 'excused' },
  { student_id: 9, status: 'present' },
  { student_id: 10, status: 'present' },
  { student_id: 11, status: 'present' },
  { student_id: 12, status: 'absent' },
];

export const academicYear = {
  id: 3, name: '2026–27', start_date: '2026-04-01', end_date: '2027-03-31', is_current: true, status: 'active',
};

export const academicYears = [
  academicYear,
  { id: 2, name: '2025–26', start_date: '2025-04-01', end_date: '2026-03-31', is_current: false, status: 'completed' },
  { id: 1, name: '2024–25', start_date: '2024-04-01', end_date: '2025-03-31', is_current: false, status: 'completed' },
];

export const modules = [
  ['Attendance','attendance'],['Fee Management','fee_management'],['Assignments','assignments'],
  ['Assessments','assessments'],['Timetable','timetable'],['Events','events'],['Gallery','gallery'],
].map(([name, slug], i) => ({ id: i + 1, name, slug, status: 'active' as const }));

export const parents = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  name: `${FIRST[(i + 7) % 18]} ${LAST[i % 18]}`,
  email: `${FIRST[(i + 7) % 18].toLowerCase()}.${LAST[i % 18].toLowerCase()}@example.com`,
  phone: `97${String(30000000 + i * 521).slice(0, 8)}`,
  occupation: ['Engineer','Doctor','Teacher','Business','Civil Services','Architect'][i % 6],
  students_count: (i % 2) + 1,
}));

export const activityLogs = Array.from({ length: 16 }, (_, i) => ({
  id: i + 1,
  user_id: 1,
  user_name: ['Krishna Singh','Kavya Iyer','Rohan Desai','Meera Bhat'][i % 4],
  action: ['created','updated','deleted','viewed','exported'][i % 5],
  entity_type: ['student','attendance','fee_payment','assignment','class'][i % 5],
  entity_id: 100 + i,
  description: ['Added a new student to Class VIII A','Marked attendance for Class IX B','Recorded a fee payment of ₹18,000','Published an assignment','Updated class capacity'][i % 5],
  ip_address: '203.0.113.' + (10 + i),
  created_at: `2026-09-28T${String(9 + (i % 8)).padStart(2, '0')}:${String(10 + i).padStart(2, '0')}:00Z`,
}));
