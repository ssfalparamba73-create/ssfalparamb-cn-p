import { fetchApi } from './httpClient';
import type { MemberDashboardDTO, MemberDirectoryItemDTO, MemberProfileDTO } from '../backend/dto/member.dto';
import type { UpdateMemberProfileInput } from '../backend/contracts/member.contract';
import type { PaginatedResult } from '../backend/contracts/common.contract';
import type { MemberPaymentHistoryItemDTO } from '../backend/dto/payment.dto';

export const memberClient = {
  getDashboard: () =>
    fetchApi<MemberDashboardDTO>('/member/dashboard', {
      method: 'GET',
    }),

  getProfile: () =>
    fetchApi<MemberProfileDTO>('/member/profile', {
      method: 'GET',
    }),

  updateProfile: (input: UpdateMemberProfileInput) =>
    fetchApi<MemberProfileDTO>('/member/profile', {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  listDirectory: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi<PaginatedResult<MemberDirectoryItemDTO>>(`/member/directory?${query}`, {
      method: 'GET',
    });
  },

  listPayments: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi<PaginatedResult<MemberPaymentHistoryItemDTO>>(`/member/payments?${query}`, {
      method: 'GET',
    });
  },
};
