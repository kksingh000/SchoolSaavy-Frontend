import { api, tokenStore } from '@/lib/http';
import type { AuthUser, LoginPayload, LoginResponse, TokenCheckResponse } from '@/types/api';

export const authService = {
  login: (payload: LoginPayload) => api.post<LoginResponse>('/auth/login', payload),

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      tokenStore.clear();
    }
  },

  me: () => api.get<{ user: AuthUser }>('/auth/me').then((r) => r.user),

  check: () => api.get<TokenCheckResponse>('/auth/check'),

  refresh: () => api.post<LoginResponse & { access_token: string }>('/auth/refresh'),

  sendResetOtp: (email: string, user_type: string) =>
    api.post<{ message: string }>('/auth/password/send-otp', { email, user_type }),

  verifyOtp: (email: string, otp: string) =>
    api.post<{ message: string; token?: string }>('/auth/password/verify-otp', { email, otp }),

  resetPassword: (payload: {
    email: string;
    otp: string;
    password: string;
    password_confirmation: string;
  }) => api.post<{ message: string }>('/auth/password/reset', payload),
};

export const profileService = {
  show: () => api.get<Record<string, unknown>>('/profile'),
  update: (payload: Record<string, unknown>) => api.put('/profile', payload),
  changePassword: (payload: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) => api.put('/profile/password', payload),
  statistics: () => api.get<Record<string, number>>('/profile/statistics'),
  uploadPhoto: (file: File) => {
    const form = new FormData();
    form.append('photo', file);
    return api.post<{ profile_photo_url: string }>('/profile/photo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
