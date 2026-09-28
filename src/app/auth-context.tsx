import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth';
import { SCHOOL_KEY, USER_KEY, setUnauthorizedHandler, tokenStore } from '@/lib/http';
import type { AuthUser, LoginPayload, SchoolContext, UserType } from '@/types/api';

interface AuthState {
  user: AuthUser | null;
  school: SchoolContext | null;
  /** True until the stored token has been validated against /auth/me. */
  bootstrapping: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  logout: () => Promise<void>;
  role: UserType | null;
  isRole: (...roles: UserType[]) => boolean;
}

const AuthContext = createContext<AuthState | null>(null);

function readCached<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(() => readCached<AuthUser>(USER_KEY));
  const [school, setSchool] = useState<SchoolContext | null>(() =>
    readCached<SchoolContext>(SCHOOL_KEY),
  );
  const [bootstrapping, setBootstrapping] = useState(() => Boolean(tokenStore.get()));

  const clearSession = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setSchool(null);
    queryClient.clear();
  }, [queryClient]);

  // Any 401 from anywhere in the app drops the session.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setSchool(null);
      queryClient.clear();
    });
  }, [queryClient]);

  // Validate the stored token once on load — a cached user is not proof of a live session.
  useEffect(() => {
    let cancelled = false;
    if (!tokenStore.get()) {
      setBootstrapping(false);
      return;
    }
    authService
      .me()
      .then((fresh) => {
        if (cancelled) return;
        setUser(fresh);
        localStorage.setItem(USER_KEY, JSON.stringify(fresh));
      })
      .catch(() => {
        if (!cancelled) clearSession();
      })
      .finally(() => {
        if (!cancelled) setBootstrapping(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  const login = useCallback(async (payload: LoginPayload) => {
    const result = await authService.login(payload);
    tokenStore.set(result.token, result.expires_at);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    if (result.school) localStorage.setItem(SCHOOL_KEY, JSON.stringify(result.school));
    setUser(result.user);
    setSchool(result.school ?? null);
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout().catch(() => {});
    clearSession();
  }, [clearSession]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      school,
      bootstrapping,
      login,
      logout,
      role: user?.user_type ?? null,
      isRole: (...roles: UserType[]) => Boolean(user && roles.includes(user.user_type)),
    }),
    [user, school, bootstrapping, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
