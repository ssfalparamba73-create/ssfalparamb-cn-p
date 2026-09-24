# Supabase Backend Architecture Plan

## Authority And Usage

This document is the approved backend implementation blueprint for the SSF Alparamba Digital Varisankhya Collection Portal.

All agents and developers must follow this plan before implementing backend logic, Supabase schema, RLS policies, API/server actions, authentication, storage, reporting, exports, or mock-data replacement.

This file must be used together with:

1. `UI_PLAN_V2.md`
2. `Architecture_Plan.md`
3. `Admin_UI_Architecture_Plan.md`

Backend implementation must not redesign, rename, or visually alter existing public, member, or admin UI screens. The frontend visual baseline is already approved.

## A. Frontend Data Flow Analysis

The current app is a Next.js App Router frontend with public, member, and admin surfaces. Most business data is currently mock/local state.

Public flow:

- `/pay` collects member phone/member ID, selected contribution category, pending months, dues tier, event amount, payment method, UPI option, and cash receiving admin.
- `/success` and `/receipt/[id]` currently render receipt data from URL search params such as `method`, `admin`, `phone`, `amount`, `category`, and `source`.
- This must be replaced with server-created payment records and tokenized receipt access. The client must never be trusted for amount, status, receipt ID, collected-by admin, or payment confirmation.

Member flow:

- `/login` and the landing inline login form collect phone number and then use a 4-digit admin-issued PIN style flow.
- `/otp-verification` still contains mock OTP behavior.
- `/member/dashboard` uses mock due amount and mock member identity.
- `/member/payments` uses mock transaction history.
- `/member/profile` stores editable profile data locally, including name, age, blood group, phone, WhatsApp, address, unit, sector, joined year, occupation, and biometric preference.
- `/member/directory` and blood donor filtering require privacy-aware member directory APIs.

Admin flow:

- Admin auth is currently mocked through `src/lib/admin/AuthContext.tsx`.
- `src/lib/admin/api.ts` is already a useful service-like boundary that returns mock data.
- Admin modules need real backend support for members, payments, cash entry, payment approval/rejection/cancellation, defaulters, reminders, reports, audit logs, settings, admin users, support contacts, events, and blood donors.

Shared layer:

- `src/lib/admin/admin-types.ts` and `src/lib/admin/mock-data.ts` are the current field references for the first backend contract.
- Backend integration must preserve current DTO shapes where possible so the UI remains visually unchanged.

## B. Required Supabase Tables & Schema

### `members`

Stores app-level member identity. Do not use Supabase Auth UID as the business primary key.

Fields:

- `id uuid primary key`
- `member_code text unique not null`
- `name text not null`
- `phone text unique not null`
- `alternate_phone text`
- `whatsapp text`
- `age integer`
- `blood_group blood_group`
- `address text`
- `area text`
- `unit text`
- `sector text`
- `occupation text`
- `status member_status not null default 'active'`
- `monthly_tier monthly_tier not null default 'flexible'`
- `monthly_amount numeric(12,2) not null default 50`
- `pin_status pin_status not null default 'not_issued'`
- `pin_hash text`
- `pin_updated_at timestamptz`
- `force_pin_reset boolean not null default false`
- `last_login_at timestamptz`
- `last_paid_at timestamptz`
- `dues_pending numeric(12,2) not null default 0`
- `last_reminded_at timestamptz`
- `reminder_count integer not null default 0`
- `photo_bucket text`
- `photo_path text`
- `metadata jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `deleted_at timestamptz`

### `member_profiles`

Stores member-facing editable profile and preferences.

Fields:

- `id uuid primary key`
- `member_id uuid not null references members(id)`
- `initials text`
- `joined_year text`
- `bio text`
- `biometric_enabled boolean not null default false`
- `public_directory_visible boolean not null default true`
- `payment_percentage_visible boolean not null default true`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `deleted_at timestamptz`

### `family_members`

Fields:

- `id uuid primary key`
- `member_id uuid not null references members(id)`
- `name text not null`
- `relationship text not null`
- `age integer`
- `blood_group blood_group`
- `is_blood_donor boolean not null default false`
- `phone text`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `deleted_at timestamptz`

### `payments`

Unified ledger for monthly dues, special events, UPI, QR, cash handover, admin cash entry, member payments, and guest payments.

Fields:

- `id uuid primary key`
- `receipt_id text unique not null`
- `member_id uuid references members(id)`
- `payer_name text`
- `payer_phone text not null`
- `category payment_category not null`
- `method payment_method not null`
- `amount numeric(12,2) not null check (amount > 0)`
- `currency text not null default 'INR'`
- `status payment_status not null default 'pending'`
- `tier monthly_tier`
- `event_id uuid references special_events(id)`
- `event_name_snapshot text`
- `reference_id text`
- `gateway_provider text`
- `gateway_order_id text`
- `gateway_payment_id text`
- `gateway_signature text`
- `collected_by_admin_id uuid references admin_users(id)`
- `recorded_by_admin_id uuid references admin_users(id)`
- `verified_by_admin_id uuid references admin_users(id)`
- `cancelled_by_admin_id uuid references admin_users(id)`
- `notes text`
- `paid_at timestamptz`
- `recorded_at timestamptz not null default now()`
- `verified_at timestamptz`
- `cancelled_at timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `deleted_at timestamptz`

### `payment_months`

Normalizes selected dues months.

Fields:

- `id uuid primary key`
- `payment_id uuid not null references payments(id)`
- `member_id uuid not null references members(id)`
- `month_key text not null`
- `label text not null`
- `amount numeric(12,2) not null`
- `created_at timestamptz not null default now()`

### `payment_receipts`

Stores receipt access and rendering metadata.

Fields:

- `id uuid primary key`
- `payment_id uuid unique not null references payments(id)`
- `receipt_id text unique not null`
- `public_token_hash text unique not null`
- `token_expires_at timestamptz`
- `receipt_theme text not null default 'default'`
- `background_bucket text`
- `background_path text`
- `download_count integer not null default 0`
- `last_viewed_at timestamptz`
- `issued_at timestamptz not null default now()`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `deleted_at timestamptz`

### `payment_methods`

Configurable payment rails.

Fields:

- `id uuid primary key`
- `code text unique not null`
- `label text not null`
- `type text not null`
- `is_active boolean not null default true`
- `upi_id text`
- `qr_bucket text`
- `qr_path text`
- `config jsonb not null default '{}'::jsonb`
- `sort_order integer not null default 0`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `deleted_at timestamptz`

### `cash_entries`

Cash-specific workflow table.

Fields:

- `id uuid primary key`
- `payment_id uuid not null references payments(id)`
- `member_id uuid references members(id)`
- `payer_phone text not null`
- `amount numeric(12,2) not null`
- `category payment_category not null`
- `event_id uuid references special_events(id)`
- `received_by_admin_id uuid not null references admin_users(id)`
- `recorded_by_admin_id uuid references admin_users(id)`
- `verified_by_admin_id uuid references admin_users(id)`
- `status cash_status not null default 'received'`
- `received_at timestamptz not null default now()`
- `recorded_at timestamptz`
- `verified_at timestamptz`
- `notes text`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `deleted_at timestamptz`

### `special_events`

Fields:

- `id uuid primary key`
- `name text not null`
- `description text`
- `suggested_amount numeric(12,2)`
- `minimum_amount numeric(12,2) not null default 30`
- `is_active boolean not null default true`
- `receipt_theme text not null default 'default'`
- `starts_at timestamptz`
- `ends_at timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `deleted_at timestamptz`

### `event_member_statuses`

Created/updated for active members when special events are created.

Fields:

- `id uuid primary key`
- `event_id uuid not null references special_events(id)`
- `member_id uuid not null references members(id)`
- `status event_payment_status not null default 'pending'`
- `amount_paid numeric(12,2) not null default 0`
- `payment_id uuid references payments(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Unique constraint:

- `(event_id, member_id)`

### `blood_donors`

Can be synced from member data, but kept as a table for auditability and fast filtering.

Fields:

- `id uuid primary key`
- `member_id uuid references members(id)`
- `name_snapshot text not null`
- `phone_snapshot text not null`
- `blood_group blood_group not null`
- `area text`
- `is_available boolean not null default true`
- `last_donated_date date`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `deleted_at timestamptz`

### `admin_users`

App-level admin identity.

Fields:

- `id uuid primary key`
- `auth_user_id uuid unique`
- `name text not null`
- `phone text unique not null`
- `avatar_initials text`
- `status admin_status not null default 'active'`
- `can_receive_cash boolean not null default false`
- `can_verify_payments boolean not null default false`
- `can_manage_members boolean not null default false`
- `can_manage_settings boolean not null default false`
- `last_login_at timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `deleted_at timestamptz`

### `roles`, `permissions`, `role_permissions`, `admin_user_roles`

`roles`:

- `id uuid primary key`
- `code text unique not null`
- `name text not null`
- `description text`
- `is_system boolean not null default true`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

`permissions`:

- `id uuid primary key`
- `code text unique not null`
- `description text`
- `created_at timestamptz not null default now()`

`role_permissions`:

- `role_id uuid references roles(id)`
- `permission_id uuid references permissions(id)`
- composite primary key `(role_id, permission_id)`

`admin_user_roles`:

- `admin_user_id uuid references admin_users(id)`
- `role_id uuid references roles(id)`
- `assigned_by_admin_id uuid references admin_users(id)`
- `created_at timestamptz not null default now()`
- composite primary key `(admin_user_id, role_id)`

### `audit_logs`

Backend-generated only. Admins must not manually insert custom audit records.

Fields:

- `id uuid primary key`
- `actor_admin_id uuid references admin_users(id)`
- `actor_member_id uuid references members(id)`
- `actor_name text`
- `action text not null`
- `entity_type audit_entity_type not null`
- `entity_id text not null`
- `summary text not null`
- `severity text not null default 'info'`
- `ip inet`
- `device text`
- `before jsonb`
- `after jsonb`
- `created_at timestamptz not null default now()`

### `support_contacts`

Fields:

- `id uuid primary key`
- `name text not null`
- `role text not null`
- `phone text not null`
- `whatsapp_enabled boolean not null default true`
- `is_primary boolean not null default false`
- `sort_order integer not null default 0`
- `is_active boolean not null default true`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `deleted_at timestamptz`

### `support_requests`

Fields:

- `id uuid primary key`
- `member_id uuid references members(id)`
- `name text`
- `phone text not null`
- `subject text`
- `message text not null`
- `status text not null default 'open'`
- `handled_by_admin_id uuid references admin_users(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `deleted_at timestamptz`

### `notifications`

Fields:

- `id uuid primary key`
- `member_id uuid references members(id)`
- `channel notification_channel not null`
- `type text not null`
- `title text`
- `body text not null`
- `status text not null default 'pending'`
- `provider_message_id text`
- `sent_at timestamptz`
- `read_at timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `app_settings`

Fields:

- `id uuid primary key`
- `namespace text not null`
- `key text not null`
- `value jsonb not null`
- `updated_by_admin_id uuid references admin_users(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Unique constraint:

- `(namespace, key)`

### `otp_sessions`

Use only if true OTP is implemented.

Fields:

- `id uuid primary key`
- `phone text not null`
- `purpose text not null`
- `otp_hash text not null`
- `expires_at timestamptz not null`
- `attempt_count integer not null default 0`
- `consumed_at timestamptz`
- `ip inet`
- `created_at timestamptz not null default now()`

### `storage_files`

Portable file registry. Do not hardcode Supabase public URLs in business tables.

Fields:

- `id uuid primary key`
- `owner_type text not null`
- `owner_id uuid`
- `bucket text not null`
- `path text not null`
- `mime_type text`
- `size_bytes bigint`
- `checksum text`
- `metadata jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `deleted_at timestamptz`

## C. Table-by-table field mapping from frontend

- `members.member_code` maps to `memberId` and profile IDs like `SSF-ALP-104`.
- `members.name`, `phone`, `alternate_phone`, `age`, `blood_group`, `address`, `area`, `occupation`, `status`, `monthly_tier`, `monthly_amount`, `pin_status`, `last_paid_at`, and `dues_pending` map directly from admin member types and member forms.
- `members.last_reminded_at` and `members.reminder_count` support defaulter reminder tracking.
- `member_profiles.whatsapp`, `unit`, `sector`, `joined_year`, `biometric_enabled`, and directory visibility support member profile screens.
- `family_members` maps to the dynamic family member section in admin member forms.
- `payments` maps to admin payment ledger, member payment history, public payment result, receipt page, and cash entry confirmation.
- `payment_months` maps to selected pending months on `/pay` and admin cash entry month coverage.
- `payment_receipts` replaces query-param based receipt trust.
- `special_events` maps to event settings and special event payment tabs.
- `event_member_statuses` supports the rule that new active events are tracked for all active members.
- `cash_entries` maps to cash handover, admin cash entry, and verification workflows.
- `admin_users`, `roles`, `permissions`, and `admin_user_roles` map to admin login, sidebar permissions, settings/admin users, and super admin rules.
- `audit_logs` maps to the admin audit log table.
- `support_contacts` maps to member profile contact admins drawer and support settings.
- `blood_donors` maps to admin blood donor module and member directory blood filters.
- `app_settings` maps to unit, payment, security, receipt, event, and dues-frequency settings.

## D. Relationships & Enums

Relationships:

- `members.id` to `member_profiles.member_id`
- `members.id` to `family_members.member_id`
- `members.id` to `payments.member_id`
- `payments.id` to `payment_receipts.payment_id`
- `payments.id` to `payment_months.payment_id`
- `special_events.id` to `payments.event_id`
- `special_events.id` to `event_member_statuses.event_id`
- `members.id` to `event_member_statuses.member_id`
- `payments.id` to `cash_entries.payment_id`
- `admin_users.id` to payment admin columns
- `admin_users.id` to `audit_logs.actor_admin_id`
- `roles.id` to `admin_user_roles.role_id`
- `permissions.id` to `role_permissions.permission_id`

Enums:

- `member_status`: `active`, `inactive`, `blocked`, `left`
- `blood_group`: `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`
- `monthly_tier`: `base`, `premium`, `custom`, `flexible`
- `pin_status`: `not_issued`, `issued`, `reset_required`
- `payment_category`: `monthly_dues`, `special_event`
- `payment_method`: `upi`, `qr_code`, `cash_handover`, `admin_cash_entry`
- `payment_status`: `pending`, `confirmed`, `failed`, `refunded`, `cancelled`, `rejected`
- `cash_status`: `received`, `recorded`, `verified`, `disputed`
- `admin_role`: `super_admin`, `president`, `secretary`, `treasurer`, `collector`, `viewer`
- `admin_status`: `active`, `inactive`
- `event_payment_status`: `pending`, `partial`, `paid`, `waived`
- `notification_channel`: `app`, `whatsapp`, `sms`
- `audit_entity_type`: `member`, `payment`, `cash_handover`, `event`, `support_contact`, `admin_user`, `settings`, `blood_donor`, `notification`

Required indexes:

- `members(phone)`
- `members(member_code)`
- `members(status, area)`
- `members(monthly_tier)`
- `payments(member_id, paid_at desc)`
- `payments(status, category)`
- `payments(receipt_id)`
- `payments(payer_phone)`
- `payment_receipts(public_token_hash)`
- `audit_logs(created_at desc)`
- `audit_logs(entity_type, entity_id)`
- `blood_donors(blood_group, is_available, area)`
- `support_contacts(is_active, sort_order)`
- `event_member_statuses(event_id, member_id)` unique

## E. RLS Policy Plan

Enable RLS on all tables.

Public users:

- Can read active `support_contacts`.
- Can create `support_requests`.
- Can read receipt DTOs only through a valid tokenized server endpoint or secure RPC.
- Cannot read raw members, payments, admin users, audit logs, settings, or private donor/member fields.

Members:

- Can read their own member row, profile, family members, payments, receipts, and notifications.
- Can update limited profile fields only.
- Can read directory-safe member fields only.
- Cannot update dues, payment status, receipt IDs, admin metadata, settings, roles, or audit logs.

Admins:

- Must be active in `admin_users`.
- Access must be permission-based.
- `collector`: record cash and read limited member/payment data.
- `treasurer`: verify payments, view/export ledger.
- `secretary` and `president`: manage members/support/events according to permissions.
- `viewer`: read-only dashboards/reports.
- `super_admin`: full access, permanent delete, audit purge, RBAC management.

Audit:

- Insert only through trusted backend functions/triggers.
- Admin users can read audit logs only with permission.
- Super admin can purge old audit logs through a controlled server function. This purge should not recursively create another audit log.

Receipt token strategy:

- `receipt_id` remains human-readable.
- Generate an opaque random receipt token.
- Store only a hash of the token.
- Public receipt endpoint returns a receipt DTO only, never raw joined table data.
- Regenerate/revoke token when suspicious activity, cancellation, or correction occurs.

## F. Auth Architecture (with portability analysis)

Use Supabase Auth for sessions only if useful, but keep app identity in `members.id` and `admin_users.id`.

Member auth:

- Current UX is phone plus 4-digit admin-issued PIN.
- Store only `pin_hash`, never raw PIN.
- Server verifies phone/PIN with rate limiting and lockout.
- PIN reset must be admin-audited.
- `otp_sessions` should be used only if true SMS OTP is introduced later.

Admin auth:

- Admin auth should be stronger than member PIN.
- Recommended: Supabase Auth phone OTP/email/passwordless mapped to `admin_users.auth_user_id`.
- Every admin route/action must verify active admin status and permissions server-side.

Portability:

- Do not use Supabase Auth UID as business FK.
- Store app-level IDs everywhere.
- If migrating away from Supabase Auth, recreate provider users and remap `auth_user_id` while preserving app UUIDs.

## G. API / Server Actions Layer

Frontend components must never call Supabase directly.

Required services:

- `memberService.getCurrentMemberProfile()`
- `memberService.updateProfile(input)`
- `memberService.listDirectory(filters)`
- `memberService.getDueSummary(memberId)`
- `paymentService.createPaymentIntent(input)`
- `paymentService.recordCashEntry(input)`
- `paymentService.getReceiptByToken(receiptId, token)`
- `paymentService.listMemberPayments(memberId, pagination)`
- `adminMemberService.listMembers(filters, pagination)`
- `adminMemberService.createMember(input)`
- `adminMemberService.updateMember(id, input)`
- `adminMemberService.softDeleteMember(id)`
- `adminPaymentService.listPayments(filters, pagination)`
- `adminPaymentService.approvePayment(id)`
- `adminPaymentService.rejectPayment(id)`
- `adminPaymentService.cancelPayment(id)`
- `defaulterService.listDefaulters(filters)`
- `defaulterService.sendReminder(memberId)`
- `settingsService.getNamespace(namespace)`
- `settingsService.updateNamespace(namespace, input)`
- `reportService.getDashboardStats(filters)`
- `reportService.exportPaymentsCsv(filters)`
- `auditService.listAuditLogs(filters, pagination)`
- `donorService.listDonors(filters)`
- `donorService.updateAvailability(id, input)`
- `supportService.listContacts()`
- `supportService.updateContacts(input)`
- `supportService.createSupportRequest(input)`

Sensitive operations that must be server-side:

- Payment amount calculation
- Pending month calculation
- Event minimum validation
- Receipt ID creation
- Payment status transitions
- Exports
- Admin role changes
- PIN reset
- Deletes
- Audit writes

Standard response shape:

```ts
type BackendResult<T> = {
  data: T | null;
  error: null | {
    code: string;
    message: string;
    field?: string;
    retryable?: boolean;
  };
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    requestId?: string;
  };
};
```

## H. Admin, Member & Public Backend Flows

Public payment:

1. User searches by phone/member code.
2. Server returns safe due summary and active events.
3. User selects months, tier, event, amount, and method.
4. Server recalculates amount and validates all business rules.
5. Server creates pending payment.
6. Payment is confirmed by gateway callback, admin verification, or trusted server action.
7. Server generates receipt and token.
8. UI redirects to success/receipt using receipt ID/token.

Cash handover:

1. User chooses cash and receiving admin.
2. Server creates pending payment and `cash_entries` row.
3. Admin verifies from dashboard/payment ledger.
4. Server updates payment, receipt, member dues, and audit log.

Admin cash entry:

1. Admin selects member or guest.
2. Server checks `payments.record_cash`.
3. Server creates payment, cash entry, receipt, payment months or event status.
4. Audit log is generated.

Member dashboard:

- Server returns due summary, recent activity, and recent payments.
- Dues must be calculated from settings and payments, not hardcoded.

Defaulters/reminders:

- Server calculates current due and long overdue using dues frequency settings.
- Reminder action creates notification row, updates reminder counters, and writes audit log.

Settings:

- Unit, payment, security, receipt, event, and support settings are persisted in `app_settings` or dedicated tables.

Reports:

- Use server-side aggregation.
- Exports must be paginated/filter-aware and audited.

## I. Mock-to-Supabase Migration Plan

1. Create backend contracts and DTOs matching current frontend expectations.
2. Keep mock implementations behind repository interfaces.
3. Create Supabase migrations, RLS helpers, roles, permissions, and seed data.
4. Replace admin read APIs one module at a time.
5. Replace member profile, dashboard, payments, and directory reads.
6. Replace public payment and receipt query-param flow.
7. Replace write flows: member create/edit, cash entry, payment approval, reminders, settings, admin users.
8. Keep mock data until each equivalent Supabase flow is tested.
9. Remove mock data only after parity approval.

## J. Audit Log & Security Risks Plan

Current risks:

- Receipt details can be spoofed through URL query params.
- Admin auth defaults to a hardcoded mock user.
- Member PIN/OTP is mocked.
- Payment success can appear without backend confirmation.
- Role/delete restrictions are not yet enforced server-side.
- Directory and donor data can expose private member information if not filtered.

Required controls:

- Server-generated receipt IDs.
- Tokenized receipt access.
- PIN hashing and login rate limits.
- Server-side RBAC.
- RLS on all tables.
- Audit every write/update/delete/status transition.
- Super admin-only permanent deletes.
- Soft deletes by default.
- Server-side payment validation.
- Gateway/webhook signature verification.
- No service role key in client.
- Store storage bucket/path, not public URLs.

## K. Implementation Phases (Step-by-step)

1. Contracts and DTOs.
2. Supabase schema migrations.
3. RLS policies and helper functions.
4. Seed roles, permissions, settings, and sample data.
5. Repository and service layer.
6. Supabase adapters.
7. Read-only data replacement.
8. Auth and middleware/session guards.
9. Payment creation, verification, cancellation, and receipt tokenization.
10. Settings, storage, and receipt background management.
11. Notifications and reminders.
12. Reports and exports.
13. RLS/security tests.
14. Mock cleanup after approval.

## L. Files likely to change later vs. Files that must remain visually unchanged

Likely to change later:

- `src/lib/admin/api.ts`
- `src/lib/admin/mock-data.ts`
- `src/lib/admin/AuthContext.tsx`
- `src/lib/admin/admin-types.ts`
- `src/lib/backend/**`
- `src/app/api/**`
- `src/middleware.ts`
- `supabase/migrations/**`

Must remain visually unchanged unless product owner explicitly approves:

- `src/app/page.tsx`
- `src/app/pay/page.tsx`
- `src/app/success/page.tsx`
- `src/app/receipt/[id]/page.tsx`
- `src/components/receipt/PremiumReceiptCard.tsx`
- `src/app/login/page.tsx`
- `src/components/auth/InlineLoginForm.tsx`
- `src/app/member/**`
- `src/app/admin/**`
- `src/components/ui/**`
- `src/app/globals.css`

Backend implementation may change data fetching, submit handlers, DTO mapping, loading states, and error states. It must not change approved visual design, route names, colors, typography, spacing, Malayalam text, or layout hierarchy.

## M. Final Backend Readiness Checklist

- Frontend field mapping is complete.
- Tables cover public, member, admin, settings, donor, reminder, event, receipt, report, and audit flows.
- RLS plan covers public, member, admin, and super admin.
- Receipt access is tokenized.
- Payment amount/status is server-authoritative.
- Admin permissions are server-enforced.
- Audit logs are backend-generated.
- Service role key is server-only.
- Supabase-specific code is isolated.
- Migrations are version-controlled.
- Storage stores bucket/path metadata only.
- Business identity is independent from Supabase Auth UID.
- Pagination and filters are planned.
- Export/import and rollback strategy are planned.
- Mock removal waits for tested parity.
- UI remains visually unchanged.

## N. Backend Portability & Migration Strategy

Migration-safe architecture:

```text
UI Pages / Components
  -> Feature hooks / Server actions
    -> Services
      -> Repository interfaces
        -> Supabase adapters
          -> Supabase DB/Auth/Storage
```

Recommended folder structure:

```text
src/lib/backend/
  contracts/
    common.contract.ts
    member.contract.ts
    payment.contract.ts
    admin.contract.ts
    settings.contract.ts
  dto/
    member.dto.ts
    payment.dto.ts
    receipt.dto.ts
    admin.dto.ts
  services/
    memberService.ts
    paymentService.ts
    adminMemberService.ts
    adminPaymentService.ts
    settingsService.ts
    reportService.ts
    authService.ts
  repositories/
    MemberRepository.ts
    PaymentRepository.ts
    SettingsRepository.ts
    AuditRepository.ts
    AuthRepository.ts
    StorageRepository.ts
  adapters/
    supabase/
      client.server.ts
      client.browser.ts
      memberRepository.supabase.ts
      paymentRepository.supabase.ts
      settingsRepository.supabase.ts
      auditRepository.supabase.ts
      authRepository.supabase.ts
      storageRepository.supabase.ts
  supabase/
    mappers.ts
    rls.sql
    seed.ts
  migration/
    exportData.ts
    importData.ts
    dryRunImport.ts
    duplicateDetection.ts
  errors/
    BackendError.ts
    errorCodes.ts
  validation/
    memberSchemas.ts
    paymentSchemas.ts
    settingsSchemas.ts
```

Repository/service/adapter rules:

- Services own business logic.
- Repositories define generic data contracts.
- Supabase adapters implement repositories.
- Components never import Supabase clients.
- DTO mappers preserve frontend-compatible shapes.

Supabase lock-in risks:

- Auth UID lock-in: reduced by app-level member/admin IDs.
- Storage URL lock-in: reduced by bucket/path registry.
- RLS/function lock-in: reduced by versioned migrations and service-level tests.
- Realtime lock-in: avoid unless clearly needed.
- Edge function lock-in: prefer Next.js route handlers unless Supabase-specific execution is required.

Data migration:

- Export members, profiles, payments, receipts, audit logs, roles, settings, support contacts, donors, and events as CSV/JSON.
- Keep SQL dumps for complete Supabase-to-Supabase migration.
- Use duplicate detection by phone, member code, receipt ID, gateway ID, and file checksum.
- Always support dry-run import before write import.

Storage migration:

- Export by `storage_files.bucket` and `storage_files.path`.
- Verify checksum.
- Upload to target storage.
- Update only bucket/path metadata if provider changes.

Auth migration:

- Export app identities and auth mapping.
- Recreate provider users in target auth system.
- Preserve `members.id` and `admin_users.id`.
- Remap `auth_user_id` only.

Multi-Supabase migration:

1. Freeze writes or enter maintenance mode.
2. Apply migrations to target project.
3. Export source DB and storage.
4. Import schema seed, data, and files.
5. Recreate auth users and mappings.
6. Run count/hash reconciliation.
7. Switch environment variables.
8. Smoke test public, member, and admin flows.
9. Keep old project read-only during rollback window.

Rollback and testing:

- Every migration must have rollback notes.
- Test RLS with public, member, collector, treasurer, viewer, and super admin.
- Test payment status transitions.
- Test receipt token access and invalid token denial.
- Test import dry runs against staging.
- Test visual parity after replacing mocks.

Cost-control:

- Use pagination everywhere.
- Avoid broad realtime subscriptions.
- Cache public support contacts and public settings.
- Index payment/member/report filters.
- Archive old audit logs when needed.
- Generate reports on demand with date ranges.
- Track DB size, storage, egress, API volume, auth users, slow queries, and failed requests.

Future custom-backend roadmap:

- Keep contracts and DTOs stable.
- Replace only adapters when moving away from Supabase.
- Preserve app-level UUIDs.
- Move SQL-heavy business logic into backend services gradually.
- Keep UI changes minimal and visually invisible.

## O. End-to-End Data Flow & Request Routing Map

This section is the canonical route-level data flow map. Every future backend integration must preserve the existing UI while routing data through the approved backend layers.

Base request pattern:

```text
UI Component
  -> Form/Input state
    -> Client-side validation for immediate feedback
      -> Server action or route handler
        -> Service layer
          -> Repository interface
            -> Backend adapter
              -> Supabase Auth / Database / Storage
                -> Database table or storage bucket
              <- Adapter result
            <- Repository result
          <- Service DTO + BackendResult
        <- API response
      <- UI state update / toast / redirect
```

### Public Journey: Guest Payment

Routes:

- `/pay`
- `/success`
- `/receipt/[id]`

Flow:

```text
Payment page UI
  -> member phone/member ID input, category tab, month selection, tier, amount, method, receiving admin
    -> validate phone/member query, selected months, minimum amount, selected cash admin
      -> paymentService.createPaymentIntent(input)
        -> PaymentRepository.createPendingPayment()
        -> PaymentRepository.createPaymentMonths()
        -> CashEntryRepository.createCashEntry() when method is cash
        -> ReceiptRepository.reserveReceiptId()
          -> Supabase adapter
            -> members
            -> payments
            -> payment_months
            -> cash_entries
            -> payment_receipts
            -> special_events
            -> event_member_statuses
            -> admin_users
          <- pending/confirmed payment DTO
        -> auditService.recordPaymentEvent()
      <- BackendResult<PaymentIntentDTO>
    -> success redirect or error state
```

Tables involved:

- `members`
- `payments`
- `payment_months`
- `payment_receipts`
- `payment_methods`
- `cash_entries`
- `special_events`
- `event_member_statuses`
- `admin_users`
- `audit_logs`

Storage buckets involved:

- Public QR/logo bucket if payment QR or logo is loaded from storage.
- Receipt template bucket if receipt background is managed through storage.

Auth checks:

- Public payment lookup must be safe and limited.
- Public user cannot directly read raw member/payment tables.
- Server recalculates amount and validates event minimums.

RLS policies:

- Public cannot select raw `payments`.
- Public cannot select private `members`.
- Public can use only safe server action/RPC response.
- Service role or server-side privileged action writes pending payment after validation.

Audit log triggers:

- Payment intent created.
- Cash handover selected.
- Payment confirmed, rejected, cancelled, or failed.

Notification triggers:

- Optional receipt notification after confirmed payment.
- Optional admin notification for pending cash handover.

Success flow:

```text
Payment confirmed
  -> receipt token generated
    -> redirect to /success or /receipt/[id]?token=...
      -> receiptService.getReceiptByToken()
        -> UI renders existing PremiumReceiptCard
```

Error flow:

```text
Validation/payment error
  -> BackendResult.error
    -> existing form/toast/error pattern
      -> no layout or visual redesign
```

Redirect flow:

- Successful UPI/QR payment: `/success?receiptId=...&token=...` or server-controlled equivalent.
- Successful cash record: `/success` with server-issued receipt only after allowed state.
- Invalid receipt token: safe not-found/error state.

### Public Journey: Receipt View

Route:

- `/receipt/[id]`

Flow:

```text
Receipt page
  -> receipt ID + token
    -> receiptService.getReceiptByToken(receiptId, token)
      -> ReceiptRepository.findByReceiptIdAndTokenHash()
      -> PaymentRepository.getReceiptPaymentSnapshot()
        -> Supabase adapter
          -> payment_receipts
          -> payments
          -> payment_months
          -> members
          -> special_events
          -> admin_users
          -> storage_files
        <- receipt DTO
      -> ReceiptRepository.incrementViewCount()
    <- BackendResult<ReceiptDTO>
  -> PremiumReceiptCard receives DTO-compatible props
```

Tables involved:

- `payment_receipts`
- `payments`
- `payment_months`
- `members`
- `special_events`
- `admin_users`
- `storage_files`

Storage buckets involved:

- Receipt template/background bucket.
- Logo bucket if moved from public assets to storage.

Auth checks:

- Public receipt access requires valid token.
- Member receipt access can also be allowed through authenticated member ownership.
- Admin receipt access requires payment view permission.

RLS policies:

- Public cannot browse receipts.
- Receipt reads must be token-gated through server action/RPC.

Audit log triggers:

- Invalid token attempts may be logged as security events.
- Receipt regeneration/token rotation is audited.

Success flow:

- Existing receipt UI renders unchanged.
- Download/share remains client-side visual behavior.

Error flow:

- Invalid token, cancelled payment, missing receipt, or expired receipt token returns safe error DTO.

### Public Journey: Support Request

Route:

- `/support`

Flow:

```text
Support page UI
  -> name/phone/subject/message input
    -> validate required fields and phone format
      -> supportService.createSupportRequest(input)
        -> SupportRepository.create()
          -> Supabase adapter
            -> support_requests
            -> support_contacts
          <- support request DTO
        -> notificationService.notifyAdmins()
        -> auditService.recordSupportEvent() when handled by admin later
      <- BackendResult<SupportRequestDTO>
    -> existing success/error UI state
```

Tables involved:

- `support_requests`
- `support_contacts`
- `notifications`

Auth checks:

- Public can create support requests with rate limiting.
- Member-authenticated support request may attach `member_id`.

RLS policies:

- Public insert allowed only for validated support request path.
- Public read allowed only for active support contacts.

Notification triggers:

- Notify admins or configured support contacts.

### Member Journey: Member Login / PIN Verification

Routes:

- `/`
- `/login`
- `/otp-verification`
- `/member/dashboard`

Flow:

```text
InlineLoginForm or LoginPage
  -> phone input
    -> sanitize phone
      -> authService.startMemberLogin(phone)
        -> AuthRepository.findMemberByPhone()
          -> Supabase adapter
            -> members
            -> member_profiles
          <- member login challenge DTO
      <- BackendResult<LoginChallengeDTO>
  -> PIN input
    -> validate PIN length/numeric
      -> authService.verifyMemberPin(phone, pin)
        -> AuthRepository.getMemberAuthRecord()
        -> AuthRepository.incrementAttemptOrReset()
        -> AuthRepository.createSession()
          -> Supabase Auth when used
          -> members
          -> otp_sessions if true OTP is enabled
        -> auditService.recordLogin()
      <- BackendResult<AuthSessionDTO>
    -> redirect to /member/dashboard
```

Tables involved:

- `members`
- `member_profiles`
- `otp_sessions` if true OTP is enabled
- `audit_logs`

Auth checks:

- Active member only.
- Blocked/inactive member denied.
- PIN hash check server-side.
- Rate limiting required.

RLS policies:

- Member session maps to app-level `members.id`.
- Member can read own row only.

Audit log triggers:

- Login success.
- Login failure.
- Lockout.
- PIN reset.

Success flow:

- Existing login form visual behavior remains.
- Redirect to `/member/dashboard`.

Error flow:

- Invalid PIN, inactive account, rate limit, session failure use common `BackendResult` error shape.

### Member Journey: Dashboard

Route:

- `/member/dashboard`

Flow:

```text
MemberDashboardPage
  -> session/member lookup
    -> memberService.getDashboard(memberId)
      -> MemberRepository.getById()
      -> PaymentRepository.getDueSummary()
      -> PaymentRepository.getRecentPayments()
      -> NotificationRepository.getRecentForMember()
        -> Supabase adapter
          -> members
          -> member_profiles
          -> payments
          -> payment_months
          -> special_events
          -> event_member_statuses
          -> notifications
        <- dashboard DTO
    <- BackendResult<MemberDashboardDTO>
  -> DueStatusCard and RecentActivityCard receive existing-compatible props
```

Tables involved:

- `members`
- `member_profiles`
- `payments`
- `payment_months`
- `special_events`
- `event_member_statuses`
- `notifications`
- `app_settings`

Auth checks:

- Member must be authenticated.
- Member can only read own dashboard.

RLS policies:

- Member select own member/profile/payments/notifications.
- Settings exposed only as safe DTO values.

### Member Journey: Profile View and Update

Route:

- `/member/profile`

Flow:

```text
ProfilePage
  -> memberService.getCurrentMemberProfile()
    -> MemberRepository.getProfile()
      -> members
      -> member_profiles
      -> family_members
      -> support_contacts
      -> storage_files
    <- MemberProfileDTO
  -> EditProfileDrawer form input
    -> validate editable fields
      -> memberService.updateProfile(input)
        -> MemberRepository.updateAllowedProfileFields()
        -> StorageRepository.saveProfilePhoto() if file upload exists
        -> auditService.recordMemberProfileUpdate()
      <- BackendResult<MemberProfileDTO>
  -> update existing UI state and toast
```

Tables involved:

- `members`
- `member_profiles`
- `family_members`
- `support_contacts`
- `storage_files`
- `audit_logs`

Storage buckets involved:

- Member profile photo bucket.

Auth checks:

- Member can update only own allowed profile fields.
- Member cannot update dues, status, tier, PIN status, or payment metadata.

RLS policies:

- Member update limited by policy and server validation.

File uploads:

- Validate file type and size.
- Store bucket/path/checksum in `storage_files` and member photo fields.
- Generate signed URL at runtime.

### Member Journey: Payment History

Route:

- `/member/payments`

Flow:

```text
PaymentsPage
  -> paymentService.listMemberPayments(memberId, pagination)
    -> PaymentRepository.listByMember()
      -> Supabase adapter
        -> payments
        -> payment_months
        -> payment_receipts
        -> special_events
      <- payment history DTO
  -> TransactionCard list updates
```

Tables involved:

- `payments`
- `payment_months`
- `payment_receipts`
- `special_events`

Auth checks:

- Member can read own payments only.

RLS policies:

- Member-owned payment rows only.

Redirect flow:

- Receipt button routes to `/receipt/[id]` with secure token or authenticated member receipt access.

### Member Journey: Directory and Blood Donor Search

Route:

- `/member/directory`

Flow:

```text
Directory page
  -> search/filter/blood group input
    -> memberService.listDirectory(filters)
      -> MemberRepository.listDirectorySafeMembers()
      -> DonorRepository.listAvailableDonors()
        -> Supabase adapter
          -> members
          -> member_profiles
          -> blood_donors
          -> payments only through aggregate-safe view if needed
        <- directory-safe DTO
  -> member cards/donor filters update
```

Tables involved:

- `members`
- `member_profiles`
- `blood_donors`
- Optional aggregate view for payment percentage.

Auth checks:

- Member must be authenticated.
- Directory data must be privacy-filtered.

RLS policies:

- Members can read only directory-safe fields.
- Exact dues/payment balances are not exposed to other members.

### Admin Journey: Admin Login

Route:

- `/admin/login`

Flow:

```text
AdminLoginPage
  -> phone/auth credential input
    -> authService.startAdminLogin()
    -> authService.verifyAdminLogin()
      -> AuthRepository.getAdminByPhoneOrAuthUser()
      -> AdminRepository.getRolesAndPermissions()
        -> Supabase Auth
        -> admin_users
        -> admin_user_roles
        -> roles
        -> role_permissions
        -> permissions
      -> auditService.recordAdminLogin()
    <- BackendResult<AdminSessionDTO>
  -> redirect to /admin/dashboard
```

Tables involved:

- `admin_users`
- `admin_user_roles`
- `roles`
- `role_permissions`
- `permissions`
- `audit_logs`

Auth checks:

- Active admin only.
- Role/permission load required before admin access.

RLS policies:

- Admin session must map to `admin_users.id`.

### Admin Journey: Dashboard

Route:

- `/admin/dashboard`

Flow:

```text
AdminDashboardPage
  -> reportService.getDashboardStats(filters)
    -> ReportRepository.getCollectionStats()
    -> PaymentRepository.getRecentPayments()
    -> CashEntryRepository.getPendingHandovers()
      -> Supabase adapter
        -> payments
        -> cash_entries
        -> members
        -> blood_donors
        -> audit_logs
      <- dashboard stats DTO
  -> stats cards, charts, recent payments, handover cards update
```

Tables involved:

- `payments`
- `cash_entries`
- `members`
- `blood_donors`
- `audit_logs`

Auth checks:

- Admin must have dashboard view permission.

RLS policies:

- Admin read based on permission.

### Admin Journey: Member Management

Routes:

- `/admin/members`
- `/admin/members/new`
- `/admin/members/[id]`
- `/admin/members/[id]/edit`

Flow:

```text
Members list/detail/form UI
  -> filters/search/form inputs
    -> validate member fields and phone
      -> adminMemberService.listMembers/createMember/updateMember/softDeleteMember()
        -> MemberRepository.list/create/update/softDelete()
        -> FamilyRepository.upsertFamilyMembers()
        -> DonorRepository.syncDonorProfile()
        -> StorageRepository.saveMemberPhoto() if uploaded
        -> auditService.recordMemberChange()
          -> Supabase adapter
            -> members
            -> member_profiles
            -> family_members
            -> blood_donors
            -> storage_files
            -> audit_logs
          <- member DTO
      <- BackendResult
    -> table/card/detail UI updates
```

Tables involved:

- `members`
- `member_profiles`
- `family_members`
- `blood_donors`
- `storage_files`
- `audit_logs`

Storage buckets involved:

- Member profile photos.

Auth checks:

- `members.view` for list/detail.
- `members.create` for new member.
- `members.update` for edit.
- `members.delete` or super admin permission for delete.

RLS policies:

- Admin permissions enforced server-side and by RLS helpers.

Audit log triggers:

- Create, update, block, unblock, soft delete, permanent delete.
- PIN issue/reset.

### Admin Journey: Payments Ledger and Payment Detail

Routes:

- `/admin/payments`
- `/admin/payments/[id]`

Flow:

```text
Payments table/detail UI
  -> filters/search/status action
    -> adminPaymentService.listPayments()
      -> PaymentRepository.listForAdmin()
        -> payments
        -> payment_months
        -> payment_receipts
        -> cash_entries
        -> members
        -> special_events
        -> admin_users
    -> adminPaymentService.approvePayment/rejectPayment/cancelPayment()
      -> validate permission and status transition
      -> PaymentRepository.updateStatus()
      -> ReceiptRepository.createOrUpdateReceipt()
      -> MemberRepository.recalculateDues()
      -> EventRepository.updateMemberEventStatus()
      -> auditService.recordPaymentStatusChange()
    <- BackendResult<PaymentDTO>
  -> ledger/detail UI updates
```

Tables involved:

- `payments`
- `payment_months`
- `payment_receipts`
- `cash_entries`
- `members`
- `special_events`
- `event_member_statuses`
- `admin_users`
- `audit_logs`

Auth checks:

- `payments.view`
- `payments.verify`
- `payments.cancel`
- `reports.export` for export actions.

Audit log triggers:

- Approve, reject, cancel, refund, edit notes, export.

Notification triggers:

- Optional member receipt notification after confirmation.
- Optional admin alert after disputed cash handover.

### Admin Journey: Cash Entry

Route:

- `/admin/cash-entry`

Flow:

```text
CashEntryForm
  -> member/guest selection, category, months/event, amount, received-by admin, notes
    -> validate member or guest fields, amount, category, selected months/event
      -> cashEntryService.recordCashEntry(input)
        -> PaymentRepository.create()
        -> CashEntryRepository.create()
        -> PaymentMonthRepository.createMany()
        -> ReceiptRepository.create()
        -> MemberRepository.recalculateDues()
        -> EventRepository.updateMemberEventStatus()
        -> auditService.recordCashEntry()
          -> Supabase adapter
            -> payments
            -> cash_entries
            -> payment_months
            -> payment_receipts
            -> members
            -> special_events
            -> event_member_statuses
            -> admin_users
            -> audit_logs
          <- cash entry success DTO
      <- BackendResult<CashEntryResultDTO>
    -> existing success receipt UI or error state
```

Tables involved:

- `payments`
- `cash_entries`
- `payment_months`
- `payment_receipts`
- `members`
- `special_events`
- `event_member_statuses`
- `admin_users`
- `audit_logs`

Auth checks:

- Admin must have `payments.record_cash`.
- Selected received-by admin must be valid and allowed to receive cash.

Success flow:

- Existing success state renders `PremiumReceiptCard`.

### Admin Journey: Defaulters and Reminder

Route:

- `/admin/defaulters`

Flow:

```text
DefaultersManager
  -> tab/filter/reminder action
    -> defaulterService.listDefaulters(filters)
      -> MemberRepository.listDefaulters()
      -> PaymentRepository.getDueStatus()
        -> members
        -> payments
        -> payment_months
        -> app_settings
    -> defaulterService.sendReminder(memberId)
      -> NotificationRepository.create()
      -> MemberRepository.incrementReminderCount()
      -> auditService.recordReminder()
        -> notifications
        -> members
        -> audit_logs
  -> table/card updates and toast
```

Tables involved:

- `members`
- `payments`
- `payment_months`
- `app_settings`
- `notifications`
- `audit_logs`

Auth checks:

- Admin must have member/payment view permission.
- Reminder action requires reminder/send notification permission.

Notification triggers:

- WhatsApp/SMS/app reminder through `notificationService`.

### Admin Journey: Reports and Exports

Route:

- `/admin/reports`

Flow:

```text
ReportsDashboard
  -> date range/filter/export input
    -> reportService.getReports(filters)
      -> ReportRepository.getAggregates()
        -> payments
        -> payment_months
        -> cash_entries
        -> members
        -> special_events
    -> reportService.exportPaymentsCsv(filters)
      -> ReportRepository.createExport()
      -> StorageRepository.saveExportFile()
      -> auditService.recordExport()
        -> storage_files
        -> audit_logs
  -> chart/table/export UI updates
```

Tables involved:

- `payments`
- `payment_months`
- `cash_entries`
- `members`
- `special_events`
- `storage_files`
- `audit_logs`

Storage buckets involved:

- Private exports bucket.

Auth checks:

- `reports.view`
- `reports.export`

RLS policies:

- Export generation server-only.
- Export download signed URL requires permission.

### Admin Journey: Audit Log

Route:

- `/admin/audit-log`

Flow:

```text
AuditLogTable
  -> filters/pagination/detail drawer
    -> auditService.listAuditLogs(filters, pagination)
      -> AuditRepository.list()
        -> audit_logs
        -> admin_users
        -> members
      <- audit log DTO
  -> table/detail drawer updates
```

Tables involved:

- `audit_logs`
- `admin_users`
- `members`

Auth checks:

- Admin must have `audit.view`.
- Audit purge requires super admin.

RLS policies:

- Audit insert disallowed from normal clients.

### Admin Journey: Settings

Routes:

- `/admin/settings`
- `/admin/settings/unit`
- `/admin/settings/payments`
- `/admin/settings/security`
- `/admin/settings/receipt`
- `/admin/settings/events`
- `/admin/settings/support-contacts`
- `/admin/settings/admins`

Flow:

```text
Settings UI
  -> namespace-specific form input
    -> validate setting schema
      -> settingsService.updateNamespace(namespace, input)
        -> SettingsRepository.update()
        -> StorageRepository.saveFile() for logo/QR/receipt background
        -> AdminRepository.updateRoles() for admin settings
        -> EventRepository.createOrUpdateEvent() for event settings
        -> SupportRepository.updateContacts() for support settings
        -> auditService.recordSettingsChange()
          -> app_settings
          -> storage_files
          -> payment_methods
          -> special_events
          -> support_contacts
          -> admin_users
          -> roles
          -> permissions
          -> admin_user_roles
          -> role_permissions
          -> audit_logs
  -> existing settings UI updates
```

Tables involved:

- `app_settings`
- `storage_files`
- `payment_methods`
- `special_events`
- `event_member_statuses`
- `support_contacts`
- `admin_users`
- `roles`
- `permissions`
- `admin_user_roles`
- `role_permissions`
- `audit_logs`

Storage buckets involved:

- Unit logo bucket.
- Payment QR bucket.
- Receipt template bucket.

Auth checks:

- `settings.view`
- `settings.update`
- `admins.manage`
- Super admin required for critical admin/role/delete operations.

File uploads:

- Unit logo.
- QR code image.
- Receipt background image.

### Admin Journey: Blood Donors

Route:

- `/admin/blood-donors`

Flow:

```text
BloodDonorsManager
  -> blood group/availability filters or availability toggle
    -> donorService.listDonors(filters)
      -> DonorRepository.list()
        -> blood_donors
        -> members
    -> donorService.updateAvailability(id, input)
      -> DonorRepository.updateAvailability()
      -> auditService.recordDonorUpdate()
        -> blood_donors
        -> members
        -> audit_logs
  -> donor table/card updates
```

Tables involved:

- `blood_donors`
- `members`
- `audit_logs`

Auth checks:

- `donors.view`
- `donors.update`

RLS policies:

- Admin permission required for updates.
- Member directory receives only safe donor DTO.

### Reusable Data Flows

Authentication flow:

```text
UI credential input
  -> authService
    -> AuthRepository
      -> Supabase Auth + app identity table
        -> session DTO
```

Mutation with audit flow:

```text
UI form
  -> validation
    -> service mutation
      -> repository write
        -> auditService.record()
          -> audit_logs
      <- updated DTO
```

File upload flow:

```text
UI file input
  -> validate size/type
    -> storageService.upload()
      -> StorageRepository.saveObject()
      -> StorageRepository.createStorageFileRecord()
        -> storage bucket
        -> storage_files
      <- runtime URL or file DTO
```

Receipt generation flow:

```text
Payment confirmed
  -> receiptService.generateReceipt()
    -> receipt ID + random token
      -> store token hash
        -> payment_receipts
      -> return receipt URL/token once
```

Notification flow:

```text
Business event
  -> notificationService.createAndSend()
    -> NotificationRepository.create()
    -> Provider adapter sends WhatsApp/SMS/app notification
    -> NotificationRepository.updateStatus()
      -> notifications
```

Export flow:

```text
Admin export action
  -> reportService.export()
    -> permission check
      -> query filtered data
        -> generate CSV/JSON
          -> storageService.upload()
            -> storage_files
          -> auditService.recordExport()
```

Common backend services:

- `authService`
- `memberService`
- `paymentService`
- `receiptService`
- `adminMemberService`
- `adminPaymentService`
- `cashEntryService`
- `defaulterService`
- `donorService`
- `settingsService`
- `reportService`
- `auditService`
- `supportService`
- `notificationService`
- `storageService`

## P. Architecture Plan Addendum / Operational Readiness

This section incorporates the operational readiness addendum into the canonical backend plan so that agents do not need to choose between multiple backend planning files.

### P.A. UI/UX Preservation Contract

Backend integration must happen entirely behind the existing UI. The current public, member, and admin visual presentation is protected and must remain 100% identical unless the product owner explicitly approves a visual change.

Non-negotiable rules:

- Do not redesign the UI.
- Do not change layout, colors, spacing, typography, icons, shadows, borders, radius, card styles, table styles, or form styles.
- Do not change Malayalam text.
- Do not remove existing pages or routes.
- Do not rename routes.
- Do not change responsive behavior.
- Do not modify landing page visuals.
- Do not modify public, member, or admin visual design.
- Do not replace approved cards, tables, forms, drawers, modals, receipt visuals, navigation, or dashboard composition.
- Do not change the visual behavior of `/`, `/pay`, `/success`, `/receipt/[id]`, `/login`, `/otp-verification`, `/member/*`, or `/admin/*`.

Allowed backend-safe changes:

- Add logical backend files.
- Add services, repositories, adapters, DTOs, validation schemas, migration files, and tests.
- Replace mock data internals behind existing service boundaries.
- Add submit handlers, server actions, route handlers, and data-fetching functions.
- Add non-visual loading/error state wiring only if it reuses existing visual primitives and does not alter layout.
- Remove unused mock code only after equivalent backend flow is fully tested and approved.

Implementation contract:

```text
Existing UI components stay visually fixed
  -> backend integration happens through services/actions
    -> DTOs preserve current component data shape
      -> UI receives same or compatible props
        -> visual output remains unchanged
```

Any backend task that requires a visual change must stop and ask the product owner first.

### P.B. Source of Truth & Error Handling Standard

Source of truth rules:

- Supabase database is the source of truth for persistent business data after migration.
- Frontend mock data is temporary scaffolding only.
- React local state is only the source of truth for in-progress form input before submission.
- URL query params must never be the source of truth for payment amount, payment status, receipt data, member identity, or admin identity.
- Cache is never source of truth. Cache may improve speed but must be invalidated after mutations.
- Storage bucket/path metadata is source of truth for files, not generated public URLs.
- App-level IDs are source of truth for members/admins, not Supabase Auth UID.

Data ownership map:

| Data Type | Source of Truth | Notes |
|---|---|---|
| Member identity | `members` | `member_code`, phone, status, tier, dues |
| Member profile | `member_profiles` | Editable member-facing profile and preferences |
| Family members | `family_members` | Linked to `members.id` |
| Admin identity | `admin_users` | Supabase Auth UID only maps session provider |
| Roles/permissions | `roles`, `permissions`, `admin_user_roles`, `role_permissions` | Server-enforced |
| Payments | `payments` | Client must not decide amount/status |
| Payment months | `payment_months` | Normalized dues coverage |
| Receipts | `payment_receipts` | Tokenized receipt access |
| Cash handovers | `cash_entries` | Verification workflow |
| Events | `special_events`, `event_member_statuses` | Active event collection status |
| Donors | `blood_donors` or synced member-derived donor table | Directory-safe DTO only |
| Support contacts | `support_contacts` | Public/member safe read |
| Support requests | `support_requests` | Public/member writes |
| Notifications/reminders | `notifications` plus member reminder fields | Provider IDs stored, not trusted |
| Settings | `app_settings` | Namespaced config |
| Files | `storage_files` | Bucket/path/checksum metadata |
| Audit | `audit_logs` | Backend-generated only |

Common backend response format:

```ts
type BackendResult<T> = {
  ok: boolean;
  data: T | null;
  error: BackendError | null;
  meta?: {
    requestId: string;
    page?: number;
    pageSize?: number;
    total?: number;
    hasMore?: boolean;
    cacheStatus?: "hit" | "miss" | "bypass";
  };
};

type BackendError = {
  code: string;
  type:
    | "validation"
    | "auth"
    | "permission"
    | "not_found"
    | "conflict"
    | "rate_limit"
    | "payment"
    | "storage"
    | "server";
  message: string;
  field?: string;
  details?: Record<string, unknown>;
  retryable: boolean;
};
```

Required error categories:

| Error Type | Example Codes | UI Handling |
|---|---|---|
| `validation` | `INVALID_PHONE`, `AMOUNT_TOO_LOW`, `MISSING_MONTH` | Show field-level or form-level error |
| `auth` | `LOGIN_REQUIRED`, `INVALID_PIN`, `SESSION_EXPIRED` | Redirect/login prompt, preserve route |
| `permission` | `ADMIN_PERMISSION_DENIED`, `SUPER_ADMIN_REQUIRED` | Show existing error/toast pattern |
| `not_found` | `MEMBER_NOT_FOUND`, `RECEIPT_NOT_FOUND` | Existing empty/not-found state |
| `conflict` | `DUPLICATE_PHONE`, `PAYMENT_ALREADY_VERIFIED` | Explain next action |
| `rate_limit` | `TOO_MANY_ATTEMPTS` | Cooldown message |
| `payment` | `PAYMENT_VERIFICATION_FAILED`, `INVALID_RECEIPT_TOKEN` | Payment-specific error |
| `storage` | `UPLOAD_TOO_LARGE`, `UNSUPPORTED_FILE_TYPE` | File input error |
| `server` | `INTERNAL_ERROR`, `DATABASE_ERROR` | Generic safe message, log request ID |

Error handling rules:

- Do not expose raw Supabase errors to the UI.
- Every service must normalize errors into `BackendResult`.
- Every mutation must return either confirmed data or a predictable error.
- Server logs may contain technical details; UI messages must be safe and user-friendly.
- Payment and auth errors must include request IDs for traceability.
- Validation must run before repository calls where possible.
- Database constraints remain the final safety net.

### P.C. Backend Portability & Migration Strategy

#### Migration-safe Folder Structure (`src/lib/backend/...`)

Recommended structure:

```text
src/lib/backend/
  contracts/
    common.contract.ts
    member.contract.ts
    payment.contract.ts
    receipt.contract.ts
    admin.contract.ts
    settings.contract.ts
    report.contract.ts
    support.contract.ts
    notification.contract.ts

  dto/
    member.dto.ts
    payment.dto.ts
    receipt.dto.ts
    admin.dto.ts
    dashboard.dto.ts
    settings.dto.ts
    donor.dto.ts
    support.dto.ts

  services/
    authService.ts
    memberService.ts
    paymentService.ts
    receiptService.ts
    adminMemberService.ts
    adminPaymentService.ts
    cashEntryService.ts
    defaulterService.ts
    donorService.ts
    settingsService.ts
    reportService.ts
    auditService.ts
    supportService.ts
    notificationService.ts
    storageService.ts

  repositories/
    AuthRepository.ts
    MemberRepository.ts
    PaymentRepository.ts
    ReceiptRepository.ts
    AdminRepository.ts
    SettingsRepository.ts
    AuditRepository.ts
    StorageRepository.ts
    NotificationRepository.ts
    ReportRepository.ts
    SupportRepository.ts

  adapters/
    supabase/
      client.server.ts
      client.browser.ts
      authRepository.supabase.ts
      memberRepository.supabase.ts
      paymentRepository.supabase.ts
      receiptRepository.supabase.ts
      adminRepository.supabase.ts
      settingsRepository.supabase.ts
      auditRepository.supabase.ts
      storageRepository.supabase.ts
      notificationRepository.supabase.ts
      reportRepository.supabase.ts
      supportRepository.supabase.ts

  validation/
    authSchemas.ts
    memberSchemas.ts
    paymentSchemas.ts
    settingsSchemas.ts
    supportSchemas.ts
    fileSchemas.ts

  errors/
    BackendError.ts
    errorCodes.ts
    mapSupabaseError.ts

  migration/
    exportData.ts
    importData.ts
    dryRunImport.ts
    duplicateDetection.ts
    storageExport.ts
    storageImport.ts
    checksum.ts

  supabase/
    mappers.ts
    rls.sql
    seed.ts
    generated-types.ts
```

#### Repository/Service/Adapter Design

Layer responsibilities:

```text
UI Component
  -> calls feature hook/server action
    -> service validates input and enforces business rules
      -> repository interface describes needed data operation
        -> Supabase adapter implements repository
          -> Supabase DB/Auth/Storage
```

Rules:

- UI components never import Supabase clients.
- UI components never know table names.
- Services own business decisions.
- Repositories own generic persistence contracts.
- Adapters own Supabase-specific syntax.
- DTO mappers preserve current frontend-friendly shapes.
- Validation schemas run before writes.
- All mutation services must trigger audit logging where required.
- All public/member/admin data must pass through dedicated DTOs.

Example service responsibilities:

- `paymentService`: amount calculation, event minimum validation, receipt creation request.
- `receiptService`: token verification, receipt DTO, download count updates.
- `authService`: member PIN verification, admin session mapping, login attempts.
- `adminPaymentService`: approve, reject, cancel, undo workflows.
- `settingsService`: validate config and prevent invalid payment/security settings.
- `storageService`: upload files, store bucket/path, generate runtime URLs.

#### Vendor Lock-in Reduction & Storage Portability

Supabase isolation rules:

- Supabase client files live only under `src/lib/backend/adapters/supabase/`.
- No component, page, or UI utility may call `createClient`, `.from()`, `.auth`, or `.storage` directly.
- Database table names must not leak into UI components.
- Supabase Auth UID must not be used as primary business identity.
- Business references must use `members.id` and `admin_users.id`.
- Edge functions should not be required unless the project has a specific reason.

Storage portability:

- Never store hardcoded Supabase public file URLs in business tables.
- Store:
  - `bucket`
  - `path`
  - `mime_type`
  - `size_bytes`
  - `checksum`
  - `metadata`
- Generate signed/public URLs at runtime through `storageService`.
- Receipt backgrounds, member photos, unit logo, QR image, exports, and attachments must all use storage metadata.
- File access policy must be decided by owner type:
  - Public safe assets: unit logo, active receipt template if intended public.
  - Token/private assets: receipts, profile photos, exports.
  - Admin-only assets: report exports, imported files, sensitive attachments.

Environment separation:

Use environment variables only. No hardcoded project refs, URLs, bucket names, or keys.

Required env groups:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_PROJECT_REF
SUPABASE_DB_URL
SUPABASE_STORAGE_PUBLIC_BUCKET
SUPABASE_STORAGE_PRIVATE_BUCKET
SUPABASE_STORAGE_EXPORT_BUCKET
APP_ENV
APP_BASE_URL
RECEIPT_TOKEN_SECRET
AUTH_SESSION_SECRET
PAYMENT_WEBHOOK_SECRET
NOTIFICATION_PROVIDER_KEY
BACKUP_ENCRYPTION_KEY
```

Environment stages:

- `local`: local Supabase or isolated dev project.
- `dev`: shared internal development project.
- `staging`: production-like data shape, no live payment credentials unless explicitly configured.
- `production`: locked-down credentials, RLS enforced, backups enabled.

#### Export/Import & Multi-Supabase Migration Plan

Data export coverage:

- `members`
- `member_profiles`
- `family_members`
- `payments`
- `payment_months`
- `payment_receipts`
- `payment_methods`
- `cash_entries`
- `special_events`
- `event_member_statuses`
- `blood_donors`
- `admin_users`
- `roles`
- `permissions`
- `role_permissions`
- `admin_user_roles`
- `audit_logs`
- `support_contacts`
- `support_requests`
- `notifications`
- `app_settings`
- `otp_sessions` where needed
- `storage_files`

Export formats:

- CSV for admin-readable exports.
- JSON for structured backup/import.
- SQL dump for full project migration.
- Storage archive with manifest and checksums.

Import rules:

- Always support dry-run import.
- Detect duplicates by:
  - `member_code`
  - phone
  - receipt ID
  - payment gateway IDs
  - admin phone
  - file checksum/path
- Validate enums before write.
- Validate foreign keys before write.
- Import in dependency order:
  1. roles/permissions/settings
  2. admins/members
  3. profiles/family/donors/events
  4. payments/cash entries/receipts/months
  5. notifications/support/audit
  6. storage files
- Produce import report with created, updated, skipped, failed counts.

Multi-Supabase migration:

1. Freeze writes or enter maintenance mode.
2. Apply migrations to target project.
3. Seed roles, permissions, and required settings.
4. Export source DB.
5. Export storage files and manifest.
6. Recreate/migrate auth users and map `auth_user_id`.
7. Import data in dependency order.
8. Upload storage files.
9. Recalculate checksums and row counts.
10. Switch environment variables.
11. Smoke test public, member, and admin flows.
12. Keep old Supabase project read-only during rollback window.
13. Roll back by switching env vars back if reconciliation fails.

### P.D. Audit, Logging & Compliance Plan

Audit principles:

- Audit logs are backend-generated only.
- Admins cannot manually create audit records.
- Audit records must answer: who changed what, when, from where, before value, after value, and why if provided.
- Payment edits and auth/security events require stronger logging than normal reads.
- Audit logs should be append-only except super admin purge policy.

Audit events to log:

- Member create/update/block/unblock/soft delete.
- Member PIN issue/reset/force reset.
- Profile update by member.
- Admin login success/failure.
- Admin logout where trackable.
- Admin role assignment/removal.
- Admin user create/update/deactivate/delete.
- Payment create/approve/reject/cancel/refund.
- Cash entry create/verify/dispute.
- Receipt token generation/regeneration.
- Receipt access failure caused by invalid token.
- Settings update.
- Support contact create/update/delete.
- Support request status update.
- Donor availability update.
- Event create/update/delete/status change.
- Reminder sent.
- Export generated.
- Audit purge by super admin, if project later chooses to log it externally; current core rule says audit purge itself should not recursively create DB audit entries.

Audit payload:

```ts
type AuditEvent = {
  actorAdminId?: string;
  actorMemberId?: string;
  actorName?: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  severity: "info" | "warning" | "error" | "critical";
  before?: unknown;
  after?: unknown;
  ip?: string;
  device?: string;
  requestId: string;
};
```

Operational logs:

- Application logs should include request ID, route/action, service name, duration, status, and sanitized error code.
- Do not log raw PINs, OTPs, service role key, payment secrets, receipt tokens, or full sensitive payloads.
- Payment webhook logs should include provider ID, signature verification result, status transition, and request ID.
- Auth logs should track attempt count and lockouts without exposing secrets.

Compliance posture:

- Store minimal personal data needed for the community finance workflow.
- Keep soft delete by default.
- Restrict phone number exposure in member directory DTOs.
- Export actions must require admin permission and be audited.
- Admin access must be least privilege.
- Service role usage must be server-only and minimized.

### P.E. Backup & Disaster Recovery Plan

Backup strategy:

- Daily automated database backups for production.
- Weekly full database export retained separately.
- Monthly long-term archive for business records.
- Storage manifest backup with file checksums.
- Export `app_settings`, roles, permissions, and RLS/migration versions with every backup.
- Keep backups encrypted and access-controlled.

Backup contents:

- Database dump.
- Storage file archive or provider-native snapshot.
- Storage manifest from `storage_files`.
- Migration version history.
- Environment variable inventory without secret values.
- Restore instructions.

Restore testing:

- Test restore into staging at least monthly.
- Verify:
  - row counts
  - key relationship counts
  - sample member profile
  - sample payment
  - sample receipt token flow
  - admin login
  - RLS policies
  - storage file access
  - reports/dashboard aggregates
- Record restore duration and any failed checks.

Disaster recovery targets:

- RPO: maximum acceptable data loss should be defined before production; recommended initial target is 24 hours.
- RTO: maximum acceptable downtime should be defined before production; recommended initial target is 4 to 8 hours for early production.
- Payment recovery should prioritize ledger consistency and receipt correctness over speed.

Rollback plan:

- Every migration must include rollback notes.
- Before major migrations, take a fresh backup.
- For risky schema changes:
  - deploy additive migration first
  - backfill data
  - switch service layer
  - remove old columns only after approval
- Maintain previous deployment artifact and environment snapshot.
- If production issue occurs, rollback app first, then database only if required.

Data correction plan:

- Payment corrections must create audit logs.
- Prefer cancellation/reversal records over destructive edits.
- Receipt regeneration must preserve original audit trail.
- Manual DB edits in production should be forbidden except emergency recovery, and must be documented.

### P.F. Testing Strategy

Testing layers:

- Unit tests for validation schemas, DTO mappers, amount calculations, dues calculations, and error mapping.
- Service tests for business rules.
- Repository adapter tests against local/staging Supabase.
- RLS tests for public, member, collector, treasurer, viewer, president/secretary, and super admin.
- Integration tests for public/member/admin journeys.
- Smoke tests before production release.

Auth tests:

- Member valid PIN login.
- Member invalid PIN.
- Rate limit after repeated failures.
- Force PIN reset.
- Blocked/inactive member denied.
- Admin valid login.
- Admin inactive denied.
- Admin permission denied by role.
- Session expiry handling.

Payment tests:

- Guest monthly dues payment intent.
- Member monthly dues payment intent.
- Special event minimum amount validation.
- Cash handover pending state.
- Admin cash entry.
- Approve payment.
- Reject payment.
- Cancel confirmed payment.
- Duplicate payment prevention.
- Receipt token generation.
- Invalid receipt token denial.
- Payment webhook signature verification.

RLS tests:

- Public cannot read raw members/payments/admins/audit/settings.
- Public can read active support contacts.
- Public can create support request.
- Member can read own data only.
- Member cannot edit payment/admin fields.
- Admin collector cannot verify payments.
- Treasurer can verify payments.
- Viewer cannot mutate data.
- Super admin can manage roles and permanent delete where allowed.
- Audit logs cannot be manually inserted by normal users/admin clients.

Form validation tests:

- Phone sanitization and validation.
- Member required fields.
- Duplicate phone/member code.
- Payment amount minimums.
- File size/type limits.
- Event start/end validation.
- Settings schema validation.
- PIN length and numeric rules.

Visual regression rule:

- Backend integration tests must confirm data changes do not alter visual layout.
- Any screenshot diffs caused by backend work must be reviewed.
- UI text, spacing, colors, and responsive behavior must remain unchanged.

Production smoke tests:

- Landing page loads.
- Member login works.
- Member dashboard loads real due data.
- Public payment creates pending/confirmed payment as expected.
- Receipt view works by token.
- Admin login works.
- Admin members list loads.
- Cash entry creates payment and audit log.
- Reports load.
- Donor filter works.
- Support request creates row.
- RLS denial paths work.

### P.G. Final Production Launch Checklist

Environment:

- `APP_ENV=production` set.
- Production Supabase URL and anon key set.
- Service role key exists only in server environment.
- No hardcoded Supabase project details.
- Payment webhook secrets configured.
- Receipt token secret configured.
- Auth/session secrets configured.
- Notification provider credentials configured only server-side.
- Backup encryption key configured.

Database:

- All migrations applied.
- Migration version recorded.
- RLS enabled on all protected tables.
- RLS policies tested.
- Required indexes created.
- Required enums created.
- Seed roles and permissions inserted.
- Super admin account exists.
- At least one active admin exists.
- At least one super admin exists.
- No test/demo PINs remain.
- Mock seed data removed from production unless explicitly approved.

Security:

- Service role key not exposed to client bundle.
- Components do not import Supabase client directly.
- Public receipt uses tokenized access.
- Raw payment/member/admin tables are not public-readable.
- Admin actions enforce permissions server-side.
- PIN/OTP stored hashed only.
- Login rate limits enabled.
- File upload validation enabled.
- Payment webhook signature verification enabled.
- Audit logging enabled for all write/status-changing actions.
- Export endpoints permission-protected and audited.

Storage:

- Buckets created.
- Bucket policies reviewed.
- Public/private bucket separation confirmed.
- Unit logo, QR, receipt background, profile photos, and exports use bucket/path metadata.
- Signed/public URL generation tested.
- Storage backup manifest tested.

Payments and receipts:

- Server calculates amount.
- Client query params not trusted.
- Payment status transitions tested.
- Cash entry verification tested.
- Receipt ID generation tested.
- Receipt token generation tested.
- Cancelled/rejected payment receipt behavior defined.
- Duplicate payment handling tested.

Operations:

- Daily backup enabled.
- Weekly export process documented.
- Restore test completed in staging.
- Rollback plan documented.
- Monitoring/logging enabled.
- Error request IDs visible in logs.
- Slow query review completed.
- Data export/import dry run completed.
- Cost monitoring baseline captured.

Frontend protection:

- Landing page visuals unchanged.
- Public payment visuals unchanged.
- Receipt visuals unchanged.
- Login/member visuals unchanged.
- Admin visuals unchanged.
- Malayalam text unchanged.
- Routes unchanged.
- Responsive behavior unchanged.
- Existing cards/tables/forms unchanged.

Approval gate:

- Product owner approves backend addendum.
- Product owner approves production env readiness.
- Product owner approves mock removal timing.
- No implementation begins until this addendum is approved.


## L. Important Note on Supabase Data API Grants (Oct 30, 2026)

Starting October 30, 2026, Supabase will no longer automatically grant Data API access to new tables created in the public schema. Any new migration that creates a table MUST explicitly include GRANT statements for anon, authenticated, and service_role, or the table will be unreachable via the API. 

Example:
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.new_table TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.new_table TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.new_table TO service_role;
```
