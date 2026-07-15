import { fetchApi } from './httpClient';
import type { AdminDashboardStatsDTO, AuditLogDTO } from '../backend/dto/admin.dto';
import type { MemberDTO, MemberProfileDTO } from '../backend/dto/member.dto';
import type { PaymentDTO, CashEntryDTO } from '../backend/dto/payment.dto';
import type { PaginatedResult } from '../backend/contracts/common.contract';
import type { CreateMemberInput, UpdateMemberInput } from '../backend/contracts/member.contract';
import type { RecordCashEntryInput, PaymentStatusTransitionInput } from '../backend/contracts/payment.contract';

export const adminClient = {
  getDashboard: () =>
    fetchApi<AdminDashboardStatsDTO>('/admin/dashboard', {
      method: 'GET',
    }),

  listMembers: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi<PaginatedResult<MemberDTO>>(`/admin/members?${query}`, {
      method: 'GET',
    });
  },

  getMemberDetail: (id: string) =>
    fetchApi<MemberDTO>(`/admin/members/${id}`, {
      method: 'GET',
    }),

  createMember: (input: CreateMemberInput) =>
    fetchApi<MemberDTO>('/admin/members', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  updateMember: (id: string, input: UpdateMemberInput) =>
    fetchApi<MemberDTO>(`/admin/members/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  resetMemberPin: (id: string, pin: string, forceReset = false) =>
    fetchApi<MemberDTO>(`/admin/members/${id}/pin-reset`, {
      method: 'POST',
      body: JSON.stringify({ pin, forceReset }),
    }),

  listPayments: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi<PaginatedResult<PaymentDTO>>(`/admin/payments?${query}`, {
      method: 'GET',
    });
  },

  approvePayment: (id: string, input?: { notes?: string }) =>
    fetchApi<PaymentDTO>(`/admin/payments/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify(input || {}),
    }),

  rejectPayment: (id: string, input?: { reason?: string }) =>
    fetchApi<PaymentDTO>(`/admin/payments/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify(input || {}),
    }),

  cancelPayment: (id: string, input?: { reason?: string }) =>
    fetchApi<PaymentDTO>(`/admin/payments/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify(input || {}),
    }),

  recordCashEntry: (input: RecordCashEntryInput) =>
    fetchApi<CashEntryDTO>('/admin/cash-entry', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  listAuditLogs: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi<PaginatedResult<AuditLogDTO>>(`/admin/audit-log?${query}`, {
      method: 'GET',
    });
  },
};
