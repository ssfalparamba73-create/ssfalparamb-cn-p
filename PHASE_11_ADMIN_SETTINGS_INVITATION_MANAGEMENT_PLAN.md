# Phase 11 Plan: Admin Settings, Invitations, and Member-to-Admin Management

## Status

Approved and implemented. Verification status is recorded in `BACKEND_PROGRESS.md`.

## Objective

Make member invitations and every existing Admin Settings surface truthful and
persistent without removing any approved page, card, field, button, label, or route.
Preserve the required architecture:

```text
UI / Route Handler -> Service -> Repository Interface -> Supabase Adapter -> Database
```

Payment behavior is not activated by this phase. Payment configuration may be stored
only after validation, and it must not affect dues, receipts, or payment status until
the payment source-of-truth phase explicitly consumes it.

## Confirmed Current State

| Surface | Current behavior | Finding |
|---|---|---|
| Settings dashboard | Links to all approved settings routes | Navigation works |
| Unit Settings | Hard-coded defaults, local logo preview, success toast only | Not persisted |
| Receipt Settings | Local preview and timer-based success toast | Not persisted |
| Admin Users | `MOCK_ADMIN_USERS`, hard-coded Super Admin assumption | Not real |
| Security Settings | Local state/toasts; runtime auth remains hard-coded | Not persisted or enforced |
| Payment Configuration | Hard-coded values and success toasts | Not persisted or consumed |
| Special Events | Local `INITIAL_EVENTS` | Not real |
| Support Contacts admin page | `MOCK_CONTACTS` and fake edit/delete | Not real |
| Public/member support reads | Real active `support_contacts` API | Real, but database currently has no contacts |
| Post-create member invitation | Real server-generated PIN and one-time dialog | Implemented |
| Member table resend action | Missing | Must be added |
| Invitation message | Hard-coded in UI | Must become a private setting |

Linked Supabase currently contains only four settings:

- `unit.name`
- `payment.monthly_due_base_amount`
- `payment.monthly_due_premium_amount`
- `receipt.receipt_theme`

There are currently no support-contact rows and no special-event rows. No mock rows
may be copied into Supabase as part of this work.

## Mandatory Negative Prompt / Do-Not-Change Rules

The implementer must treat every statement below as a hard prohibition:

1. Do **not** remove, rename, hide, reorder, or redesign any existing settings page,
   card, field, button, tab, route, Malayalam text, color, spacing, or layout.
2. Do **not** display a success toast until the server has committed the change.
3. Do **not** leave a button mutating only React state while claiming the change was
   saved. Until its backend slice is complete, keep it visible but disabled with a
   truthful pending explanation.
4. Do **not** call Supabase directly from UI components or Route Handlers.
5. Do **not** hard-delete members, admins, support contacts, events, settings, audit
   rows, or invitation history.
6. Do **not** recover or reuse an existing member/admin PIN. A resend always creates a
   new cryptographically secure code and revokes the old credential and sessions.
7. Do **not** store raw PINs/codes or rendered messages containing PINs in tables,
   audit logs, application logs, URLs, query strings, localStorage, or sessionStorage.
8. Do **not** claim a WhatsApp invitation was sent, opened, or delivered. Without a
   provider callback, the portal records only that a credential was generated; the
   WhatsApp link is handed to the user's browser without delivery tracking.
9. Do **not** expose invitation templates as public settings.
10. Do **not** seed fake admins, contacts, events, members, payment methods, UPI IDs,
    QR codes, or receipt records.
11. Do **not** overwrite existing `app_settings` values during migration. New defaults
    use `ON CONFLICT DO NOTHING`.
12. Do **not** auto-promote, auto-link, deactivate, or change roles for any existing
    member/admin during migration.
13. Do **not** deactivate or demote the last active Super Admin, and do not permit an
    admin to remove their own final management access.
14. Do **not** delete or modify the linked member when an admin account is deactivated.
15. Do **not** activate payment calculation, payment creation, receipt generation,
    defaulter calculation, or cash-entry behavior from saved settings in this phase.
16. Do **not** change PIN length, expiry, lockout, or biometric behavior merely by
    saving UI values; each rule must be consumed by the real authentication flow in
    the same reviewed slice.
17. Do **not** run destructive success-path tests against real unit records. Use a
    disposable local database or explicitly approved test identities.
18. Do **not** edit already-applied migrations `001` through `030`; use forward-only
    migrations beginning at `031`.

## Core Product Decisions

### Invitation resend

- Add `Invite / Resend` to every desktop member row and mobile member card without
  removing the existing View action.
- Require confirmation explaining that a new PIN will invalidate the previous PIN
  and revoke active member sessions.
- Generate the PIN on the server with `crypto.randomInt`.
- Show the shared one-time invitation dialog only after the transaction commits.
- Closing the dialog permanently removes the raw PIN from client memory.
- The member detail `Reset PIN` control remains. It is not removed or silently changed.

### Editable invitation template

- Store the template privately at:
  - namespace: `messaging`
  - key: `member_invitation_template`
- Required placeholders: `{phone}` and `{pin}`.
- Optional placeholders: `{name}`, `{memberCode}`, and `{unit}`.
- Plain text only, maximum 1,000 characters; reject unknown placeholders.
- Server-side rendering only. The Settings preview uses a masked example PIN.
- Default value preserves the current message meaning:
  `SSF Alparamba member login: Phone {phone}, PIN {pin}`.

### Invitation storage decision — no new invitation table

A new invitation table is not required for the requested resend behavior. Reuse:

- `members.pin_hash` for the bcrypt credential hash;
- `app_settings` for the private message template;
- append-only `audit_logs` for `member.invitation_generated` metadata;
- `auth_sessions` for targeted session revocation.

This is the lowest-side-effect design and avoids duplicating security history. Audit
rows may store member ID, actor, template version, and event time, but never the PIN,
rendered message, or WhatsApp URL. If a later requirement needs delivery-provider
callbacks or invitation analytics, that must be a separately approved table/phase.

### Existing member to admin

- Admin Users → Add New Admin keeps the existing form and adds a member-name search
  field above it.
- Search only active, non-left members, minimum two characters, maximum 20 results,
  deterministic ordering, and server-side debounce/pagination.
- Selecting a result fills the existing name and phone fields; those fields remain
  visible and become identity previews rather than being removed.
- The admin chooses the existing role field and confirms creation.
- Generate an admin login code on the server, store only its bcrypt hash, and show it
  once in a WhatsApp invitation dialog.
- Admin deactivation never changes the member record.

## Proposed Forward-Only Database Work

### `031_settings_and_invitation_foundation.sql`

- Add nullable `updated_by_admin_id` to `app_settings`.
- Seed the private member invitation template with `ON CONFLICT DO NOTHING`.
- Add an audit index suitable for per-member invitation cooldown checks if the current
  audit indexes do not already cover entity/action/date.
- Add the new `members.invite` permission and grant it to roles that already possess
  `members.update`, plus Super Admin.
- Add a service-role-only transactional invitation-preparation RPC that:
  - locks and validates an active member;
  - hashes the supplied server-generated PIN;
  - revokes active member sessions;
  - clears login lockout state;
  - writes a secret-free audit event with the template version;
  - returns only IDs/timestamps, never the hash.
- Require member status to be exactly `active`; tighten the existing PIN issue path,
  which currently excludes only `left` members.
- Serialize concurrent attempts on the member row and enforce a recommended cooldown
  of 30 seconds plus a maximum of five generations per hour.

### `032_member_admin_link_and_rbac_guards.sql`

- Add nullable unique `member_id` to `admin_users` with a foreign key to `members`.
- Keep existing standalone admins valid; no automatic backfill.
- Add `assigned_by_admin_id` and `created_at` to `admin_user_roles` if absent.
- Add `last_login_at` and `deactivated_at` to `admin_users` if absent.
- Add service-role-only transactional RPCs for:
  - promoting an active member to an admin;
  - changing roles/status;
  - issuing/resetting an admin login code;
  - soft-deactivating an admin and revoking sessions.
- Enforce in the database transaction:
  - unique member/admin linkage;
  - unique phone ownership;
  - maximum two active Super Admins, preserving the existing UI rule;
  - at least one active Super Admin;
  - no self-deactivation/self-demotion that causes lockout;
  - no secrets in audit before/after data.

### `033_support_contact_settings_hardening.sql`

- Extend `support_contacts` with `whatsapp_enabled`, `is_primary`, `sort_order`,
  `updated_at`, and nullable `deleted_at`.
- Preserve all existing rows; do not seed mock contacts.
- Enforce at most one active primary contact transactionally.
- Use soft delete/deactivation only.

### Included in `033_non_payment_settings_support_events.sql`

- Extend `special_events` with `receipt_theme` and nullable `deleted_at` if required by
  the existing form.
- Preserve event/payment foreign-key history; Delete means deactivate/soft delete.
- Seed missing unit, security, receipt, and payment keys only when absent.
- Existing remote values always win.

### Deferred auth-settings enforcement — gated high-risk slice

Apply only when the matching member PIN-change UI/API is ready in the same release.

- Add `pin_issued_at` / `pin_changed_at` metadata required for expiry enforcement.
- Make login attempts and lockout duration read validated private security settings.
- Make PIN generator and validators consume the same configured PIN length.
- A PIN-length change requires a separate impact confirmation and atomic session/PIN
  invalidation. It must never occur as an unnoticed settings save.
- `Force PIN change` requires a real authenticated change-PIN route and page.
- Biometric settings must gate a real WebAuthn/device-auth flow or be explicitly
  described as a preference; a boolean alone must not claim biometric security.

## Backend Layers to Add

### Contracts and DTOs

- `settings.contract.ts`, `settings.dto.ts`
- `invitation.contract.ts`, `invitation.dto.ts`
- Extend admin contracts with candidate search and admin-access mutations.
- Support-contact and event admin DTOs must exclude internal/audit-only fields.

### Validation

- Namespace-specific settings schemas; no unrestricted JSON settings write.
- Invitation placeholder allow-list and required-placeholder validation.
- Phone, role, status, UUID, search length, pagination, file type/size, dates, and
  positive-amount validation.
- Reject unknown fields on privileged mutations.

### Services

- `settingsService.getNamespace/updateNamespace`
- `invitationService.prepareMemberInvitation`
- `adminUserService.list/searchCandidates/promote/update/deactivate/issueCode`
- `supportAdminService.list/create/update/reorder/deactivate`
- `eventAdminService.list/create/update/deactivate`
- Storage service for unit logo, payment QR, and receipt background.

### Repositories and adapters

- Supabase repositories implement the interfaces; UI and Route Handlers never import
  the Supabase client.
- Privileged multi-table mutations use transactional RPCs.
- Reads propagate database errors instead of converting them to empty successful data.

## Proposed API Surface

### Invitations

- `POST /api/v1/admin/members/[id]/invitation`

It requires an authenticated admin and `members.invite`. The response may return the
raw PIN and rendered message once; response headers must remain private, no-store,
and no-referrer. The WhatsApp link is a client-side handoff and must not be recorded
as sent or delivered.

### Settings

- `GET /api/v1/admin/settings/[namespace]` → `settings.view`
- `PATCH /api/v1/admin/settings/[namespace]` → `settings.update`

Allowed namespaces are explicit: `unit`, `messaging`, `security`, `receipt`, and
`payment`. Public reads require a separate field-level allow-list.

### Admin users

- `GET /api/v1/admin/admin-users`
- `GET /api/v1/admin/admin-users/candidates?search=`
- `POST /api/v1/admin/admin-users`
- `PATCH /api/v1/admin/admin-users/[id]`
- `DELETE /api/v1/admin/admin-users/[id]` (soft-deactivate semantics)
- `POST /api/v1/admin/admin-users/[id]/code`

All mutations require `admin_users.manage`; last-Super-Admin rules are also enforced
inside the database transaction.

### Dedicated settings resources

- `/api/v1/admin/support-contacts`
- `/api/v1/admin/support-contacts/[id]`
- `/api/v1/admin/events`
- `/api/v1/admin/events/[id]`
- `/api/v1/admin/settings/assets/[kind]`

## UI Wiring Order — Nothing Removed

1. Add real loading/error/permission states to all settings pages.
2. Keep unfinished controls visible but disabled until their API is complete.
3. Add invitation-template card to Security & PIN Rules without removing existing
   cards.
4. Add Invite/Resend actions to desktop member rows and mobile member cards while
   preserving View Details.
5. Reuse one invitation dialog for post-create, row resend, and detail Reset PIN.
6. Replace Admin Users mock rows with real admins; add member-name search while
   retaining name, phone, role, and status fields.
7. Wire Support Contacts to real rows and preserve edit/delete/toggle/reorder controls.
8. Wire Unit Settings text fields to `app_settings`; keep logo storage visible but
   disabled until its reviewed storage slice is implemented.
9. Wire Events to `special_events` without inserting sample campaigns.
10. Keep Receipt Settings preview local and disable save/upload claims until the
    reviewed receipt-storage and payment source-of-truth phase.
11. Keep Payment Configuration visible but disabled until payment implementation.
12. Implement Security settings only together with real enforcement and recovery.

## Settings-Specific Truth Rules

- **Unit:** Save text and logo only after API/storage commit; revoke preview object URLs.
- **Receipt:** Preview can remain local; “Saved” means metadata and asset are persisted.
- **Admin Users:** Session-derived permissions replace `isCurrentUserSuperAdmin = true`.
- **Security:** No setting is marked saved unless login/PIN behavior consumes it.
- **Payment:** Persisting values must not recalculate existing dues or payments.
- **Events:** Delete deactivates; linked payment history is preserved.
- **Support Contacts:** Public/member APIs show only active, non-deleted contacts in
  persisted sort order.

## Side-Effect Isolation Strategy

1. Capture pre-migration row counts, active Super Admin count, migration ledger, and
   database lint output.
2. Dry-run each migration and require it to be the sole pending version.
3. Apply schema-only/additive migrations before any UI mutation is enabled.
4. Seed only absent keys; never update existing values in migrations.
5. Put each privileged workflow in one transaction and lock affected identity rows.
6. Revoke sessions only for the member/admin whose credential changed.
7. Feature slices are enabled only after their API, permissions, audit, and UI states
   pass together.
8. Payment/security settings remain non-consuming until their dependency gates pass.
9. Use forward fixes for deployed migrations; never rewrite history.

## Verification Matrix

### Static and build

- `npx tsc --noEmit`
- Targeted ESLint for every touched file
- Production build
- `git diff --check`
- Scan for settings/admin/contact/event/invitation mocks in wired paths
- Scan for direct Supabase imports in UI and Route Handlers

### Database

- Migration dry-run and local/remote ledger parity
- Linked database lint has no warnings/errors
- Anonymous/authenticated direct RPC calls are denied
- RLS/default-deny checks for private settings and admin users
- No raw PIN/message/session values exist in tables or audit logs

### Invitation

- Create active member → one-time invitation dialog
- Resend → old PIN fails, old sessions revoked, new PIN succeeds
- Cancel confirmation → no PIN/session/data changes
- Template update → only future dialogs use the new template
- Invalid/missing/unknown placeholders rejected
- WhatsApp action records `opened`, never `sent`

### Admin management

- Search returns only eligible active members
- Promotion is idempotent under concurrent requests
- Duplicate phone/member linkage rejected cleanly
- Correct role permissions available after login
- Deactivation revokes only that admin's sessions and does not alter the member
- Last active Super Admin and unsafe self-demotion are rejected
- Raw admin code is shown once and never persisted or audited

### Settings

- Reload after save returns exact committed values
- Unauthorized viewers receive `403`; missing sessions receive `401`
- Support reorder/primary/deactivate persists and public reads match
- Event deactivation preserves linked history
- Asset type/size/path checks and rollback on failed upload/metadata write
- Existing payment/dues/member/session values remain unchanged by ordinary settings
  saves unless the UI explicitly confirms a documented security transition

### Visual regression

- Desktop/mobile snapshots for every existing settings page
- Confirm all current cards, fields, buttons, routes, copy, layout, colors, and spacing
  remain present
- Only additive search, status, confirmation, loading, error, and invitation elements
  are permitted

## Implementation Sequence and Approval Gates

1. **Phase 11A:** settings foundation + invitation template/history + member row resend.
2. **Phase 11B:** real Admin Users + member search/promotion + admin code flow.
3. **Phase 11C:** support contacts + unit settings/assets.
4. **Phase 11D:** events + receipt persistence/assets.
5. **Phase 11E:** security settings with full PIN-change/recovery enforcement.
6. **Phase 11F:** payment settings consumption only inside the approved payment phase.

Each slice must pass its own migration, permission, audit, API, UI, and regression
checks before the next slice begins. A later slice must not be used to excuse a fake
success state in an earlier one.
