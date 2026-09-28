import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ApiEnvelope, PaginatedEnvelope, Paginated } from '@/types/api';

export const TOKEN_KEY = 'schoolsaavy.token';
export const TOKEN_EXPIRY_KEY = 'schoolsaavy.token_expires_at';
export const USER_KEY = 'schoolsaavy.user';
export const SCHOOL_KEY = 'schoolsaavy.school';

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, '') ?? '/api';

/* ------------------------------- storage -------------------------------- */

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set(token: string, expiresAt?: string) {
    localStorage.setItem(TOKEN_KEY, token);
    if (expiresAt) localStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt);
  },
  expiresAt: () => localStorage.getItem(TOKEN_EXPIRY_KEY),
  clear() {
    [TOKEN_KEY, TOKEN_EXPIRY_KEY, USER_KEY, SCHOOL_KEY].forEach((k) => localStorage.removeItem(k));
  },
};

/* ------------------------------- errors --------------------------------- */

export class ApiError extends Error {
  status: number;
  /** Laravel 422 validation bag: { field: [messages] } */
  errors?: Record<string, string[]>;
  code?: string;

  constructor(message: string, status: number, errors?: Record<string, string[]>, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
    this.code = code;
  }

  /** First validation message for a field, if any. */
  fieldError(field: string): string | undefined {
    return this.errors?.[field]?.[0];
  }
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  const axiosError = error as AxiosError<{
    message?: string;
    error?: string;
    errors?: Record<string, string[]>;
    code?: string;
  }>;

  if (axiosError?.isAxiosError) {
    const status = axiosError.response?.status ?? 0;
    const body = axiosError.response?.data;

    if (status === 0 || axiosError.code === 'ERR_NETWORK') {
      return new ApiError(
        'Cannot reach the server. Check your connection or the API URL.',
        0,
        undefined,
        'NETWORK',
      );
    }

    const message =
      body?.message ??
      body?.error ??
      (status === 401
        ? 'Your session has expired. Please sign in again.'
        : status === 403
          ? 'You do not have permission to do that.'
          : status === 404
            ? 'Not found.'
            : status >= 500
              ? 'The server ran into a problem. Try again in a moment.'
              : 'Something went wrong.');

    return new ApiError(message, status, body?.errors, body?.code);
  }

  return new ApiError((error as Error)?.message ?? 'Unexpected error', 0);
}

/* ------------------------------- client --------------------------------- */

type OnUnauthorized = () => void;
let onUnauthorized: OnUnauthorized = () => {};
export function setUnauthorizedHandler(fn: OnUnauthorized) {
  onUnauthorized = fn;
}

export const http: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45_000,
  headers: { Accept: 'application/json' },
});

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.get();
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  // Laravel's ForceJsonResponse middleware keys off this header.
  config.headers.set('X-Requested-With', 'XMLHttpRequest');
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const url = error.config?.url ?? '';
    // A failed login is a form error, not a dead session — don't bounce the user.
    const isAuthAttempt = url.includes('auth/login') || url.includes('auth/refresh');

    if (status === 401 && !isAuthAttempt) {
      tokenStore.clear();
      onUnauthorized();
    }
    return Promise.reject(toApiError(error));
  },
);

/* ----------------------------- unwrapping ------------------------------- */

/**
 * The API is inconsistent about envelopes: some controllers return
 * `{ status, message, data }`, some return the payload at the top level
 * (auth/login, auth/me), some return `{ data, status, message }`.
 * `unwrap` handles all three without lying about the type.
 */
function unwrap<T>(body: unknown): T {
  if (body && typeof body === 'object' && 'data' in (body as Record<string, unknown>)) {
    const envelope = body as ApiEnvelope<T>;
    if (envelope.status === 'error') {
      throw new ApiError(envelope.message || 'Request failed', 400);
    }
    return envelope.data;
  }
  return body as T;
}

export const api = {
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await http.get(url, config);
    return unwrap<T>(data);
  },
  async post<T>(url: string, payload?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await http.post(url, payload, config);
    return unwrap<T>(data);
  },
  async put<T>(url: string, payload?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await http.put(url, payload, config);
    return unwrap<T>(data);
  },
  async patch<T>(url: string, payload?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await http.patch(url, payload, config);
    return unwrap<T>(data);
  },
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await http.delete(url, config);
    return unwrap<T>(data);
  },

  /** Keeps `meta` alongside the rows for paginated endpoints. */
  async paginated<T>(url: string, config?: AxiosRequestConfig): Promise<Paginated<T>> {
    const { data } = await http.get<PaginatedEnvelope<T>>(url, config);
    const items = Array.isArray(data?.data) ? data.data : [];
    return {
      items,
      meta:
        data?.meta ??
        {
          current_page: 1,
          from: items.length ? 1 : null,
          last_page: 1,
          path: url,
          per_page: items.length,
          to: items.length || null,
          total: items.length,
        },
    };
  },

  /** Raw access for the few endpoints that return an ad-hoc shape. */
  raw: http,
};

/** Reads the `notification` block Laravel attaches to some responses. */
export async function getWithNotification<T>(url: string, config?: AxiosRequestConfig) {
  const { data } = await http.get<ApiEnvelope<T>>(url, config);
  return { data: unwrap<T>(data), notification: data?.notification ?? null };
}
