import {
  MOCK_MEMBERS,
  MOCK_PAYMENTS,
  MOCK_DASHBOARD_STATS,
  MOCK_SPECIAL_EVENTS,
  MOCK_AUDIT,
  MOCK_CONTACTS,
  MOCK_CASH_HANDOVERS,
  MOCK_ADMIN_USERS
} from './mock-data';
import { getAllAdminBloodDonors } from '../api/memberClient';

/**
 * Admin API Service Layer
 *
 * This file serves as the single source of truth for all data fetching in the admin panel.
 * Currently, it returns mock data. When the real backend is ready, we will replace the
 * internals of these functions with actual fetch/Supabase calls.
 */

// --- Members ---
export async function getMembers() {
  return MOCK_MEMBERS;
}

export async function getMemberById(id: string) {
  return MOCK_MEMBERS.find(m => m.id === id) || null;
}

export async function getDefaulters() {
  return MOCK_MEMBERS.filter(m => m.duesPending > 0);
}

// --- Payments ---
export async function getPayments() {
  return MOCK_PAYMENTS;
}

export async function getPaymentById(id: string) {
  return MOCK_PAYMENTS.find(p => p.id === id) || null;
}

export async function getCashHandovers() {
  return MOCK_CASH_HANDOVERS;
}

// --- Dashboard & Analytics ---
export async function getDashboardStats() {
  return MOCK_DASHBOARD_STATS;
}

// --- Events ---
export async function getSpecialEvents() {
  return MOCK_SPECIAL_EVENTS;
}

// --- Audit & Logs ---
export async function getAuditLogs() {
  return MOCK_AUDIT;
}

// --- Blood Donors ---
export async function getBloodDonors() {
  return getAllAdminBloodDonors();
}

// --- Settings & Config ---
export async function getSupportContacts() {
  return MOCK_CONTACTS;
}

export async function getAdminUsers() {
  return MOCK_ADMIN_USERS;
}
