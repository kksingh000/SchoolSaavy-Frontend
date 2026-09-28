import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  BellRing,
  BookOpen,
  CalendarDays,
  CalendarRange,
  ClipboardCheck,
  ClipboardList,
  GraduationCap,
  Images,
  LayoutDashboard,
  Layers,
  Receipt,
  Settings,
  ShieldCheck,
  Users,
  UserSquare2,
} from 'lucide-react';
import type { UserType } from '@/types/api';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  roles: UserType[];
  /** Backend module slug — hidden when the school hasn't activated it. */
  module?: string;
}

export interface NavSection {
  heading: string;
  items: NavItem[];
}

const ADMIN: UserType[] = ['school_admin'];
const STAFF: UserType[] = ['school_admin', 'teacher'];
const ALL: UserType[] = ['school_admin', 'teacher', 'parent'];

export const navigation: NavSection[] = [
  {
    heading: 'Overview',
    items: [
      { label: 'Dashboard', to: '/', icon: LayoutDashboard, roles: ALL },
      { label: 'Notifications', to: '/notifications', icon: BellRing, roles: ALL },
    ],
  },
  {
    heading: 'People',
    items: [
      { label: 'Students', to: '/students', icon: GraduationCap, roles: STAFF },
      { label: 'Teachers', to: '/teachers', icon: UserSquare2, roles: ADMIN },
      { label: 'Parents', to: '/parents', icon: Users, roles: ADMIN },
      { label: 'My children', to: '/children', icon: Users, roles: ['parent'] },
    ],
  },
  {
    heading: 'Academics',
    items: [
      { label: 'Classes', to: '/classes', icon: Layers, roles: STAFF },
      { label: 'Subjects', to: '/subjects', icon: BookOpen, roles: ADMIN },
      { label: 'Attendance', to: '/attendance', icon: ClipboardCheck, roles: STAFF, module: 'attendance' },
      { label: 'Timetable', to: '/timetable', icon: CalendarRange, roles: ALL, module: 'timetable' },
      { label: 'Assignments', to: '/assignments', icon: ClipboardList, roles: ALL, module: 'assignments' },
      { label: 'Assessments', to: '/assessments', icon: BarChart3, roles: STAFF, module: 'assessments' },
    ],
  },
  {
    heading: 'School',
    items: [
      { label: 'Events', to: '/events', icon: CalendarDays, roles: ALL, module: 'events' },
      { label: 'Fees', to: '/fees', icon: Receipt, roles: ['school_admin', 'parent'], module: 'fee_management' },
      { label: 'Gallery', to: '/gallery', icon: Images, roles: ALL, module: 'gallery' },
    ],
  },
  {
    heading: 'Administration',
    items: [
      { label: 'Academic years', to: '/academic-years', icon: CalendarRange, roles: ADMIN },
      { label: 'Activity log', to: '/activity', icon: ShieldCheck, roles: ADMIN },
      { label: 'Settings', to: '/settings', icon: Settings, roles: ADMIN },
    ],
  },
];

export function visibleNavigation(role: UserType | null, activeModules?: Set<string>) {
  if (!role) return [];
  return navigation
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (!item.roles.includes(role)) return false;
        // Modules gate features per school; if we haven't loaded them yet, show everything.
        if (item.module && activeModules && activeModules.size > 0) {
          return activeModules.has(item.module);
        }
        return true;
      }),
    }))
    .filter((section) => section.items.length > 0);
}
