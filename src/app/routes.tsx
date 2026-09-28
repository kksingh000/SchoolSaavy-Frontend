import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './auth-context';
import { AppShell } from '@/components/layout/AppShell';
import { PageLoader } from '@/components/ui/Feedback';
import { LoginPage } from '@/features/auth/LoginPage';
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { StudentsPage } from '@/features/students/StudentsPage';
import { StudentDetailPage } from '@/features/students/StudentDetailPage';
import { TeachersPage } from '@/features/teachers/TeachersPage';
import { ClassesPage } from '@/features/classes/ClassesPage';
import { AttendancePage } from '@/features/attendance/AttendancePage';
import { AssignmentsPage } from '@/features/assignments/AssignmentsPage';
import { AssessmentsPage } from '@/features/assessments/AssessmentsPage';
import { TimetablePage } from '@/features/timetable/TimetablePage';
import { EventsPage } from '@/features/events/EventsPage';
import { FeesPage } from '@/features/fees/FeesPage';
import { NotificationsPage } from '@/features/notifications/NotificationsPage';
import { ProfilePage } from '@/features/profile/ProfilePage';
import {
  AcademicYearsPage,
  ActivityLogPage,
  GalleryPage,
  NotFoundPage,
  ParentsPage,
  SettingsPage,
  SubjectsPage,
} from '@/features/admin/AdminPages';
import type { UserType } from '@/types/api';

/** Blocks unauthenticated access and remembers where the user was heading. */
function RequireAuth({ children }: { children: ReactNode }) {
  const { user, bootstrapping } = useAuth();
  const location = useLocation();

  if (bootstrapping) return <PageLoader label="Restoring your session" />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return <>{children}</>;
}

/** Route-level role guard, mirroring the backend's user.type middleware. */
function RequireRole({ roles, children }: { roles: UserType[]; children: ReactNode }) {
  const { role } = useAuth();
  if (!role) return null;
  if (!roles.includes(role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const STAFF: UserType[] = ['school_admin', 'teacher'];
const ADMIN: UserType[] = ['school_admin'];

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />

        <Route
          path="students"
          element={
            <RequireRole roles={STAFF}>
              <StudentsPage />
            </RequireRole>
          }
        />
        <Route
          path="students/:id"
          element={
            <RequireRole roles={STAFF}>
              <StudentDetailPage />
            </RequireRole>
          }
        />
        <Route
          path="teachers"
          element={
            <RequireRole roles={ADMIN}>
              <TeachersPage />
            </RequireRole>
          }
        />
        <Route
          path="parents"
          element={
            <RequireRole roles={ADMIN}>
              <ParentsPage />
            </RequireRole>
          }
        />
        <Route
          path="classes"
          element={
            <RequireRole roles={STAFF}>
              <ClassesPage />
            </RequireRole>
          }
        />
        <Route
          path="subjects"
          element={
            <RequireRole roles={ADMIN}>
              <SubjectsPage />
            </RequireRole>
          }
        />
        <Route
          path="attendance"
          element={
            <RequireRole roles={STAFF}>
              <AttendancePage />
            </RequireRole>
          }
        />
        <Route path="timetable" element={<TimetablePage />} />
        <Route path="assignments" element={<AssignmentsPage />} />
        <Route path="assignments/new" element={<AssignmentsPage />} />
        <Route
          path="assessments"
          element={
            <RequireRole roles={STAFF}>
              <AssessmentsPage />
            </RequireRole>
          }
        />
        <Route path="events" element={<EventsPage />} />
        <Route
          path="fees"
          element={
            <RequireRole roles={['school_admin', 'parent']}>
              <FeesPage />
            </RequireRole>
          }
        />
        <Route path="gallery" element={<GalleryPage />} />
        <Route
          path="academic-years"
          element={
            <RequireRole roles={ADMIN}>
              <AcademicYearsPage />
            </RequireRole>
          }
        />
        <Route
          path="activity"
          element={
            <RequireRole roles={ADMIN}>
              <ActivityLogPage />
            </RequireRole>
          }
        />
        <Route
          path="settings"
          element={
            <RequireRole roles={ADMIN}>
              <SettingsPage />
            </RequireRole>
          }
        />

        {/* Parent portal reuses the dashboard's children cards. */}
        <Route path="children" element={<DashboardPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
