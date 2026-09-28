/* ---------------------------------------------------------------------------
   Demo session state.

   Kept separate from the resolver so the auth context can read it without
   pulling in the whole fixture bundle.
--------------------------------------------------------------------------- */

import type { UserType } from '@/types/api';

export const DEMO_KEY = 'schoolsaavy.demo';
export const DEMO_TOKEN = 'demo-mode-no-backend';

/** Roles a visitor can explore the demo as. */
export const DEMO_ROLES: { role: UserType; label: string; blurb: string }[] = [
  { role: 'school_admin', label: 'Administrator', blurb: 'The whole school — people, fees, analytics' },
  { role: 'teacher', label: 'Teacher', blurb: 'Classes, attendance, assignments' },
  { role: 'parent', label: 'Parent', blurb: 'Two children, fees and notices' },
];

export function demoRole(): UserType | null {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    return raw ? (raw as UserType) : null;
  } catch {
    return null;
  }
}

export function isDemo(): boolean {
  return demoRole() !== null;
}

export function startDemo(role: UserType) {
  try {
    localStorage.setItem(DEMO_KEY, role);
  } catch {
    /* private mode — demo simply won't persist across reloads */
  }
}

export function stopDemo() {
  try {
    localStorage.removeItem(DEMO_KEY);
  } catch {
    /* ignore */
  }
}
