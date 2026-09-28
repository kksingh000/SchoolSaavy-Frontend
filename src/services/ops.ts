import { api } from '@/lib/http';
import { getWithNotification } from '@/lib/http';
import type {
  ActivityLog,
  AdminDashboard,
  AppNotification,
  Module,
  ParentDashboard,
  TeacherDashboard,
} from '@/types/api';
import type { ListParams } from './people';

/* ------------------------------ dashboards ------------------------------ */

export const dashboardService = {
  /** Shape depends on user_type — the caller narrows it. */
  admin: () => getWithNotification<AdminDashboard>('/dashboard'),
  teacher: () => api.get<TeacherDashboard>('/dashboard'),
  parent: () => api.get<ParentDashboard>('/dashboard'),

  attendanceGraph: () => api.get<Record<string, unknown>>('/dashboard/attendance-graph'),
  feeAnalytics: () => api.get<Record<string, unknown>>('/dashboard/fee-analytics'),
  performance: () => api.get<Record<string, unknown>>('/dashboard/performance-analytics'),
  classDistribution: () => api.get<Record<string, unknown>>('/dashboard/class-distribution'),
  assignmentStats: () => api.get<Record<string, unknown>>('/dashboard/assignment-statistics'),

  teacherStats: () => api.get<Record<string, number>>('/teacher/dashboard-stats'),
};

/* ----------------------------- notifications ---------------------------- */

export const notificationService = {
  /** Admin view — everything the school has sent. */
  list: (params: ListParams = {}) => api.paginated<AppNotification>('/notifications', { params }),
  get: (id: number | string) => api.get<AppNotification>(`/notifications/${id}`),
  send: (payload: {
    title: string;
    message: string;
    type: string;
    priority: string;
    target_type: string;
    target_ids?: number[];
  }) => api.post('/notifications/send', payload),
  stats: () => api.get<Record<string, number>>('/notifications/stats'),
  schoolMembers: () => api.get<Record<string, unknown>>('/notifications/school-members'),
  types: () => api.get<string[]>('/notifications/config/types'),
  targetTypes: () => api.get<string[]>('/notifications/config/target-types'),
  priorities: () => api.get<string[]>('/notifications/config/priorities'),
  retry: (id: number | string) => api.post(`/notifications/${id}/retry`),
  remove: (id: number | string) => api.delete(`/notifications/${id}`),

  /** Parent inbox. */
  mine: (params: ListParams = {}) =>
    api.paginated<AppNotification>('/parent/notifications', { params }),
  unreadCount: () => api.get<{ count: number }>('/parent/notifications/unread-count'),
  markRead: (id: number | string) => api.patch(`/parent/notifications/${id}/read`),
  markAllRead: () => api.patch('/parent/notifications/mark-all-read'),
  acknowledge: (id: number | string) => api.patch(`/parent/notifications/${id}/acknowledge`),
};

/* ------------------------------- modules -------------------------------- */

export const moduleService = {
  schoolModules: () => api.get<Module[]>('/modules/school'),
  all: () => api.get<Module[]>('/modules'),
  pricing: () => api.get<Record<string, number>>('/modules/pricing'),
  activate: (moduleId: number | string) => api.post(`/modules/${moduleId}/activate`),
  deactivate: (moduleId: number | string) => api.post(`/modules/${moduleId}/deactivate`),
};

/* ------------------------------- settings ------------------------------- */

export const settingsService = {
  list: () => api.get<Record<string, unknown>[]>('/school-settings'),
  byCategory: (category: string) =>
    api.get<Record<string, unknown>[]>(`/school-settings/category/${category}`),
  get: (key: string) => api.get<Record<string, unknown>>(`/school-settings/${key}`),
  set: (key: string, value: unknown) => api.put(`/school-settings/${key}`, { value }),
  create: (payload: { key: string; value: unknown; type?: string; category?: string }) =>
    api.post('/school-settings', payload),
  bulk: (settings: { key: string; value: unknown }[]) =>
    api.post('/school-settings/bulk', { settings }),
};

/* ----------------------------- activity logs ---------------------------- */

export const activityService = {
  list: (params: ListParams = {}) => api.paginated<ActivityLog>('/activity-logs', { params }),
  mine: (params: ListParams = {}) =>
    api.paginated<ActivityLog>('/activity-logs/my-activity', { params }),
  statistics: () => api.get<Record<string, number>>('/activity-logs/statistics'),
};

/* -------------------------------- uploads ------------------------------- */

export const uploadService = {
  /** Returns the S3 path string the create/update endpoints expect. */
  async single(file: File, folder?: string) {
    const form = new FormData();
    form.append('file', file);
    if (folder) form.append('folder', folder);
    return api.post<{ path: string; url: string; name: string; size: number }>(
      '/uploads/single',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },
  async multiple(files: File[], folder?: string) {
    const form = new FormData();
    files.forEach((f) => form.append('files[]', f));
    if (folder) form.append('folder', folder);
    return api.post<{ path: string; url: string; name: string }[]>('/uploads/multiple', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  remove: (path: string) => api.delete('/uploads/file', { data: { path } }),
};

/* -------------------------------- gallery ------------------------------- */

export const galleryService = {
  albums: (params: ListParams = {}) =>
    api.paginated<Record<string, unknown>>('/gallery', { params }),
  album: (id: number | string) => api.get<Record<string, unknown>>(`/gallery/${id}`),
  createAlbum: (payload: Record<string, unknown>) => api.post('/gallery', payload),
  removeAlbum: (id: number | string) => api.delete(`/gallery/${id}`),
  media: (albumId: number | string) =>
    api.get<Record<string, unknown>[]>(`/gallery/${albumId}/media`),
  addMedia: (albumId: number | string, payload: Record<string, unknown>) =>
    api.post(`/gallery/${albumId}/media`, payload),
  removeMedia: (albumId: number | string, mediaId: number | string) =>
    api.delete(`/gallery/${albumId}/media/${mediaId}`),
  filterOptions: () => api.get<Record<string, unknown>>('/gallery/filter-options'),
  stats: () => api.get<Record<string, number>>('/gallery/stats'),
};

/* --------------------------------- parent ------------------------------- */

export const parentPortalService = {
  children: () => api.get<Record<string, unknown>[]>('/parent/children'),
  statistics: (student_id: number | string) =>
    api.post<Record<string, unknown>>('/parent/student/statistics', { student_id }),
  attendance: (payload: { student_id: number | string; month?: string; year?: string }) =>
    api.post<Record<string, unknown>>('/parent/student/attendance', payload),
  assignments: (payload: { student_id: number | string; status?: string }) =>
    api.post<Record<string, unknown>>('/parent/student/assignments', payload),
  assignmentDetails: (payload: { student_id: number | string; assignment_id: number | string }) =>
    api.post<Record<string, unknown>>('/parent/student/assignment/details', payload),
  galleryAlbums: (student_id: number | string) =>
    api.post<Record<string, unknown>[]>('/parent/student/gallery/albums', { student_id }),
  cameras: () => api.get<Record<string, unknown>[]>('/parent/cameras/accessible'),
};
