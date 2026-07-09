import { Member, Payment, CashHandover, AdminUser } from "./admin-types";

export const MOCK_ADMIN_USERS: AdminUser[] = [
  {
    id: "admin_1",
    name: "Farhan",
    role: "president",
    phone: "9876543210",
    avatarInitials: "FA",
    canReceiveCash: true,
    canVerifyPayments: true,
    canManageMembers: true,
    canManageSettings: true,
    status: "active",
  },
  {
    id: "admin_2",
    name: "Shibili",
    role: "secretary",
    phone: "9876543211",
    avatarInitials: "SH",
    canReceiveCash: true,
    canVerifyPayments: false,
    canManageMembers: true,
    canManageSettings: true,
    status: "active",
  }
];

export const MOCK_MEMBERS: Member[] = [
  {
    id: "mem_1",
    memberId: "SSF-001",
    name: "Niyas C",
    phone: "9846012345",
    bloodGroup: "O+",
    isBloodDonor: true,
    donorAvailable: true,
    area: "Alparamba Center",
    status: "active",
    monthlyTier: "base",
    monthlyAmount: 50,
    pinStatus: "issued",
    lastPaidAt: "2026-06-15T10:30:00Z",
    duesPending: 0,
    createdAt: "2025-01-10T00:00:00Z",
    updatedAt: "2026-06-15T10:30:00Z",
  },
  {
    id: "mem_2",
    memberId: "SSF-002",
    name: "Afsal T",
    phone: "9447098765",
    bloodGroup: "B+",
    isBloodDonor: false,
    donorAvailable: false,
    area: "North Gate",
    status: "active",
    monthlyTier: "premium",
    monthlyAmount: 100,
    pinStatus: "not_issued",
    lastPaidAt: "2026-05-10T14:20:00Z",
    duesPending: 200,
    createdAt: "2025-02-15T00:00:00Z",
    updatedAt: "2026-05-10T14:20:00Z",
  },
  {
    id: "mem_3",
    memberId: "SSF-003",
    name: "Shihabuddin",
    phone: "9895011223",
    bloodGroup: "A-",
    isBloodDonor: true,
    donorAvailable: false,
    area: "South Block",
    status: "inactive",
    monthlyTier: "base",
    monthlyAmount: 50,
    pinStatus: "reset_required",
    lastPaidAt: "2025-12-01T09:15:00Z",
    duesPending: 350,
    createdAt: "2025-03-20T00:00:00Z",
    updatedAt: "2026-01-10T10:00:00Z",
  }
];

export const MOCK_PAYMENTS: Payment[] = [
  {
    id: "pay_1",
    receiptId: "REC-2026-07-001",
    memberId: "mem_1",
    payerName: "Niyas C",
    payerPhone: "9846012345",
    category: "monthly_dues",
    method: "upi",
    amount: 50,
    status: "confirmed",
    months: ["July 2026"],
    tier: "base",
    paidAt: "2026-07-01T08:30:00Z",
    recordedAt: "2026-07-01T08:30:00Z",
  },
  {
    id: "pay_2",
    receiptId: "REC-2026-07-002",
    memberId: "mem_2",
    payerName: "Afsal T",
    payerPhone: "9447098765",
    category: "special_event",
    method: "cash_handover",
    amount: 500,
    status: "pending",
    eventName: "Building Fund",
    collectedByAdminId: "admin_1",
    collectedByAdminName: "Farhan",
    paidAt: "2026-07-02T11:45:00Z",
    recordedAt: "2026-07-02T11:45:00Z",
  },
  {
    id: "pay_3",
    receiptId: "REC-2026-07-003",
    payerName: "Guest User",
    payerPhone: "9998887776",
    category: "special_event",
    method: "qr_code",
    amount: 1000,
    status: "confirmed",
    eventName: "Medical Aid",
    paidAt: "2026-07-03T16:20:00Z",
    recordedAt: "2026-07-03T16:20:00Z",
  }
];

export const MOCK_DASHBOARD_STATS = {
  totalCollected: 12450,
  monthlyDues: 8450,
  specialEvents: 4000,
  pendingAmount: 3200,
  paidMembers: 145,
  defaulters: 23,
  pendingCashHandovers: 5,
  availableDonors: 42,
  collectionTrend: [
    { month: "Jan", amount: 8000 },
    { month: "Feb", amount: 9500 },
    { month: "Mar", amount: 11000 },
    { month: "Apr", amount: 10500 },
    { month: "May", amount: 13000 },
    { month: "Jun", amount: 12450 },
  ],
  paymentMethodSplit: [
    { method: "UPI", percentage: 55, color: "bg-blue-500" },
    { method: "Cash", percentage: 30, color: "bg-emerald-500" },
    { method: "Admin", percentage: 15, color: "bg-amber-500" },
  ],
};

export const MOCK_SPECIAL_EVENTS = [
  {
    id: "evt_1",
    name: "Rabeeyul Awwal Special",
    status: "active",
    minAmount: 100,
    month: "Aug 2026",
    theme: "Amber Theme",
  },
  {
    id: "evt_2",
    name: "Ramadan Relief Fund",
    status: "inactive",
    minAmount: 200,
    month: "Mar 2026",
    theme: "",
  },
];

export const MOCK_AUDIT = [
  { id: "LOG-001", time: "2026-07-08 10:30 AM", actor: "Farhan M", action: "update", entity: "Member", target: "Safwan", summary: "Updated phone number", severity: "info", ip: "192.168.1.42", device: "Chrome / Windows 11", changes: { field: "Phone Number", before: "+919876543210", after: "9876543210" } },
  { id: "LOG-002", time: "2026-07-08 11:15 AM", actor: "Shibili N", action: "create", entity: "Payment", target: "Cash Receipt REC-0012", summary: "Recorded cash handover", severity: "info", ip: "192.168.1.15", device: "Safari / iPhone 14", changes: { field: "Status", before: "Pending", after: "Confirmed" } },
  { id: "LOG-003", time: "2026-07-07 04:20 PM", actor: "Farhan M", action: "delete", entity: "Support Contact", target: "Fawas", summary: "Removed support contact", severity: "warning", ip: "192.168.1.42", device: "Chrome / Windows 11", changes: { field: "Access", before: "Granted", after: "Revoked" } },
  { id: "LOG-004", time: "2026-07-06 09:10 AM", actor: "System", action: "alert", entity: "Security", target: "Admin Login", summary: "Multiple failed login attempts", severity: "error", ip: "45.22.19.102", device: "Unknown Device", changes: { field: "IP Address", before: "Unknown", after: "Blocked" } },
];

export const MOCK_CONTACTS = [
  { id: "1", name: "Farhan M", role: "President", phone: "9876543210", whatsappEnabled: true, isActive: true },
  { id: "2", name: "Shibili N", role: "Secretary", phone: "8765432109", whatsappEnabled: true, isActive: true },
  { id: "3", name: "Safwan", role: "Treasurer", phone: "7654321098", whatsappEnabled: false, isActive: true },
  { id: "4", name: "Fawas", role: "Collector", phone: "6543210987", whatsappEnabled: true, isActive: false },
];

export const MOCK_CASH_HANDOVERS = [
  { id: "HO-101", admin: "Shibili N", amount: 4500, date: "Today, 10:30 AM", status: "pending" },
  { id: "HO-100", admin: "Mishab", amount: 2100, date: "Yesterday, 04:15 PM", status: "verified" },
];

export const MOCK_BLOOD_DONORS = [
  { id: "1", name: "Safwan", phone: "9876543210", bloodGroup: "O+", area: "Alparamba Center", isAvailable: true, lastDonated: "2025-10-15" },
  { id: "2", name: "Fawas", phone: "8765432109", bloodGroup: "B+", area: "North Zone", isAvailable: false, lastDonated: "2026-06-10" },
  { id: "3", name: "Shibili N", phone: "7654321098", bloodGroup: "A-", area: "South Zone", isAvailable: true, lastDonated: "2025-01-22" },
];

export const MOCK_DEFAULTERS = [
  { id: "1", name: "Fawas", phone: "9876543210", area: "Alparamba Center", dueMonths: 4, amount: 200, category: "long_overdue", lastPaid: "Feb 2026", lastReminded: null, reminderCount: 0 },
  { id: "2", name: "Safwan", phone: "8765432109", area: "North Zone", dueMonths: 1, amount: 50, category: "current_due", lastPaid: "May 2026", lastReminded: "2 days ago", reminderCount: 1 },
  { id: "3", name: "Shibili N", phone: "7654321098", area: "South Zone", dueMonths: 6, amount: 300, category: "long_overdue", lastPaid: "Dec 2025", lastReminded: "1 week ago", reminderCount: 2 },
];
