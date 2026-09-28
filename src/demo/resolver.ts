/* ---------------------------------------------------------------------------
   Demo resolver.

   Answers the same URLs the Laravel API does, in the same envelope shapes, so
   every screen works unchanged with the backend switched off. Intercepted at
   the single chokepoint in lib/http.ts — no feature code is aware of it.
--------------------------------------------------------------------------- */

import * as fx from './fixtures';
import { demoRole, isDemo } from './session';

export { isDemo, demoRole };

/* ------------------------------ envelopes ------------------------------- */

const ok = (data: unknown) => ({ status: 'success', message: 'ok', data });

function paginate<T>(rows: T[], url: string, total = rows.length) {
  const perPage = Number(new URL(url, 'http://x').searchParams.get('per_page') ?? 15);
  const page = Number(new URL(url, 'http://x').searchParams.get('page') ?? 1);
  const slice = rows.slice((page - 1) * perPage, page * perPage);
  return {
    status: 'success',
    message: 'ok',
    data: slice,
    meta: {
      current_page: page,
      from: slice.length ? (page - 1) * perPage + 1 : null,
      last_page: Math.max(1, Math.ceil(total / perPage)),
      path: url.split('?')[0],
      per_page: perPage,
      to: slice.length ? (page - 1) * perPage + slice.length : null,
      total,
    },
    links: { first: null, last: null, prev: null, next: null },
  };
}

/** Applies the search/class filters the real endpoints support. */
function filterStudents(url: string) {
  const params = new URL(url, 'http://x').searchParams;
  const search = (params.get('search') ?? '').toLowerCase();
  const classId = params.get('class_id');
  const active = params.get('is_active');

  return fx.students.filter((s) => {
    if (search && !`${s.first_name} ${s.last_name} ${s.admission_number}`.toLowerCase().includes(search)) return false;
    if (classId && String(s.class_id) !== classId) return false;
    if (active === '1' && !s.is_active) return false;
    if (active === '0' && s.is_active) return false;
    return true;
  });
}

/* ------------------------------- resolver ------------------------------- */

/**
 * Returns the envelope for a GET, or undefined when nothing matches
 * (the caller then falls back to an empty list rather than throwing).
 */
export function resolveDemoGet(rawUrl: string): unknown {
  const url = rawUrl.replace(/^https?:\/\/[^/]+/, '');
  const path = url.split('?')[0];
  const role = demoRole() ?? 'school_admin';

  /* auth + chrome */
  if (path.endsWith('/auth/me')) return { user: fx.DEMO_USERS[role as keyof typeof fx.DEMO_USERS] ?? fx.DEMO_USERS.school_admin };
  if (path.endsWith('/auth/check')) return { valid: true, user: fx.DEMO_USERS.school_admin, is_expired: false, expires_in_minutes: 999 };
  if (path.includes('/modules/school') || path.endsWith('/modules')) return ok(fx.modules);
  if (path.includes('academic-years/get-current')) return ok(fx.academicYear);
  if (path.endsWith('/academic-years')) return paginate(fx.academicYears, url);
  if (path.includes('academic-year-check')) return ok({ has_academic_year: true });

  /* dashboards */
  if (path.endsWith('/dashboard')) {
    if (role === 'teacher') return ok(fx.teacherDashboard);
    return ok(fx.dashboard);
  }
  if (path.includes('/teacher/dashboard-stats')) return ok(fx.teacherDashboard.dashboard_metrics);

  /* people */
  if (/\/students\/\d+\/parents$/.test(path)) return ok(fx.parents.slice(0, 2));
  if (/\/students\/\d+\/attendance$/.test(path)) return ok({ present: 168, absent: 9, late: 4, excused: 2, attendance_percentage: 91.8 });
  if (/\/students\/\d+\/fees$/.test(path)) return ok({ total_due: 22000, total_paid: 64000 });
  if (/\/students\/\d+$/.test(path)) {
    const id = Number(path.split('/').pop());
    return ok(fx.students.find((s) => s.id === id) ?? fx.students[0]);
  }
  if (path.endsWith('/students')) {
    const rows = filterStudents(url);
    return paginate(rows, url, rows.length);
  }
  if (/\/teachers\/\d+$/.test(path)) return ok(fx.teachers[0]);
  if (path.endsWith('/teachers')) return paginate(fx.teachers, url, fx.teachers.length);
  if (path.endsWith('/parents')) return paginate(fx.parents, url, fx.parents.length);

  /* classes + subjects */
  if (path.includes('/classes/simple') || path.includes('my-classes-simple') || path.includes('teachers-classes') || path.includes('my-classes')) return ok(fx.classes);
  if (/\/classes\/\d+\/students$/.test(path)) {
    const id = Number(path.split('/')[path.split('/').length - 2]);
    const rows = fx.students.filter((s) => s.class_id === id);
    return paginate(rows.length ? rows : fx.students.slice(0, 12), url, rows.length || 12);
  }
  if (/\/classes\/\d+\/subjects$/.test(path)) return ok(fx.subjects);
  if (/\/classes\/\d+$/.test(path)) return ok(fx.classes[0]);
  if (path.endsWith('/classes')) return paginate(fx.classes, url, fx.classes.length);
  if (/\/subjects\/class\/\d+$/.test(path)) return ok(fx.subjects);
  if (path.endsWith('/subjects')) return paginate(fx.subjects, url, fx.subjects.length);

  /* attendance */
  if (path.includes('/attendance/class/') && path.endsWith('/date')) {
    return ok({ class_id: 4, date: new Date().toISOString().slice(0, 10), records: fx.attendanceRecords });
  }
  if (path.includes('/attendance/class/') && path.endsWith('/report')) {
    return ok({ present: 682, absent: 41, late: 18, excused: 9, attendance_percentage: 90.6 });
  }
  if (path.endsWith('/attendance')) return paginate([], url, 0);

  /* academics */
  if (/\/assignments\/student\/\d+$/.test(path)) return ok(fx.assignments.slice(0, 6));
  if (path.endsWith('/assignments') || path.includes('/assignments/class/')) return paginate(fx.assignments, url, fx.assignments.length);
  if (path.endsWith('/assessments')) return paginate([], url, 0);
  if (path.includes('/timetable/class/') || path.includes('my-schedule')) return ok(fx.timetable);
  if (path.endsWith('/timetable')) return paginate(fx.timetable, url, fx.timetable.length);

  /* school */
  if (path.endsWith('/events/upcoming') || path.endsWith('/events/todays')) return ok(fx.events.slice(0, 5));
  if (path.endsWith('/events')) return paginate(fx.events, url, fx.events.length);
  if (path.endsWith('/gallery')) return paginate([], url, 0);

  /* fees */
  if (path.includes('due-installments')) return paginate(fx.dues, url, fx.dues.length);
  if (path.includes('fee-management/student-plans')) return paginate(fx.feePlans, url, fx.feePlans.length);
  if (path.includes('fee-management/structures')) return paginate(fx.feeStructures, url, fx.feeStructures.length);
  if (path.includes('/summary')) return ok({ total_fee: 86000, total_paid: 64000, total_due: 22000, next_due_date: '2026-10-05' });
  if (path.includes('/payments')) return paginate([], url, 0);

  /* notifications */
  if (path.includes('unread-count')) return ok({ count: fx.notifications.filter((n) => !n.is_read).length });
  if (path.includes('notifications/config/types')) return ok(['general','academic','fee','event']);
  if (path.includes('notifications/config/target-types')) return ok(['all','parents','teachers','class']);
  if (path.includes('notifications/config/priorities')) return ok(['low','medium','high','urgent']);
  if (path.includes('/notifications')) return paginate(fx.notifications, url, fx.notifications.length);

  /* admin */
  if (path.includes('/activity-logs')) return paginate(fx.activityLogs, url, fx.activityLogs.length);
  if (path.includes('/school-settings')) {
    return ok([
      { key: 'school_name', value: fx.DEMO_SCHOOL.name },
      { key: 'academic_year', value: '2026–27' },
      { key: 'attendance_lock_after_days', value: '3' },
      { key: 'fee_late_fee_percent', value: '2' },
      { key: 'admission_number_prefix', value: 'GPS' },
    ]);
  }
  if (path.endsWith('/profile')) {
    const u = fx.DEMO_USERS[role as keyof typeof fx.DEMO_USERS] ?? fx.DEMO_USERS.school_admin;
    return ok({ name: u.name, email: u.email, phone: '98xxxxxx21', employee_id: 'EMP-020', joining_date: '2021-06-01' });
  }

  /* parent portal */
  if (path.includes('parent/children')) return ok(fx.parentChildren);

  return ok([]);
}

/** Demo mode is read-only; writes report that rather than pretending. */
export const DEMO_WRITE_MESSAGE = 'This is the demo — changes are not saved.';
