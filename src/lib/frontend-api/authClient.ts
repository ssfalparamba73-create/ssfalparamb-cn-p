import { fetchApi } from './httpClient';
import type { AdminUserDTO } from '../backend/dto/admin.dto';
import type { SessionDTO } from '../backend/dto/auth.dto';

export const authClient = {
  memberLogin: (phone: string, pin: string) =>
    fetchApi<SessionDTO>('/auth/member/login', {
      method: 'POST',
      body: JSON.stringify({ phone, pin }),
    }),

  adminLogin: (phone: string, pin: string) =>
    fetchApi<SessionDTO>('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ phone, code: pin }),
    }),

  logout: () =>
    fetchApi<{ success: boolean }>('/auth/logout', {
      method: 'POST',
    }),

  getSession: () =>
    fetchApi<SessionDTO>('/auth/session', {
      method: 'GET',
    }),
};
