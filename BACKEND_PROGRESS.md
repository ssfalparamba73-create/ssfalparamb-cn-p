# Backend Development Progress Log

This file is a shared development log for Gemini and Codex.

**CRITICAL RULE:**
Every time either AI agent (Gemini or Codex) completes a backend task, creates a database schema, writes an API, or updates a service, it **MUST** be logged here. Before starting a new task, both agents must read this file to understand the current state and prevent duplicating work or causing conflicts.

## Guidelines for Logging
- **Date/Time:** Note the date and time.
- **Agent:** Specify who did the work (Gemini or Codex).
- **Task Completed:** Briefly describe what was built, changed, or fixed.
- **Files Touched:** List the specific files that were created or modified.
- **Notes/Next Steps:** Any hand-off notes for the other agent or pending work.

---

## Log Entries

### 2026-07-10
- **Agent:** Codex
- **Task:** Completed Phase 1 backend foundation for common results/errors, primary DTOs, and Repository/Service contracts for Members, Payments, and Admin.
- **Files Touched:** `src/lib/backend/errors/errorCodes.ts`, `src/lib/backend/errors/BackendError.ts`, `src/lib/backend/contracts/common.contract.ts`, `src/lib/backend/contracts/member.contract.ts`, `src/lib/backend/contracts/payment.contract.ts`, `src/lib/backend/contracts/admin.contract.ts`, `src/lib/backend/dto/member.dto.ts`, `src/lib/backend/dto/payment.dto.ts`, `src/lib/backend/dto/admin.dto.ts`, `BACKEND_PROGRESS.md`
- **Notes:** Added type-only backend foundation following `Backend_Architecture_Supabase_Plan.md`. No UI files, Supabase adapters, server actions, or runtime wiring were changed. Verified with `npx.cmd tsc --noEmit`.

### 2026-07-09
- **Agent:** Codex
- **Task:** Acknowledged and adopted the shared backend coordination workflow.
- **Files Touched:** `BACKEND_PROGRESS.md`
- **Notes:** Before any future backend task, Codex will read `Backend_Architecture_Supabase_Plan.md` and `BACKEND_PROGRESS.md`, follow the Repository -> Service -> Adapter contract, preserve the UI completely, and update this log after each completed backend task with files touched and hand-off notes.

### 2026-07-09
- **Agent:** Gemini
- **Task:** Initialized the `BACKEND_PROGRESS.md` shared log.
- **Files Touched:** `BACKEND_PROGRESS.md`
- **Notes:** Ready to begin backend development. Awaiting first task assignment.

### 2026-07-10
- **Agent:** Gemini
- **Task:** Implemented Phase 2 backend validation schemas and standardized result/error helper utilities.
- **Files Touched:** `src/lib/backend/errors/createBackendError.ts`, `src/lib/backend/errors/resultHelpers.ts`, `src/lib/backend/validation/commonSchemas.ts`, `src/lib/backend/validation/memberSchemas.ts`, `src/lib/backend/validation/paymentSchemas.ts`, `src/lib/backend/validation/adminSchemas.ts`, `BACKEND_PROGRESS.md`
- **Notes:** Added pure TypeScript validation helpers and BackendResult/error helper factories. No UI files, Supabase adapters, server actions, or runtime wiring changed. Verified with `npx.cmd tsc --noEmit`.

### 2026-07-10 (Revision)
- **Agent:** Gemini
- **Task:** Updated Phase 2 payment validation schemas to support configurable minimum amounts.
- **Files Touched:** `src/lib/backend/validation/paymentSchemas.ts`, `BACKEND_PROGRESS.md`
- **Notes:** Special event and cash entry minimum amounts are now configurable options accepted by validation functions, rather than hardcoded constants. Verified with `npx.cmd tsc --noEmit`.

### 2026-07-10 (Architecture Fix)
- **Agent:** Gemini
- **Task:** Addressed Codex review - removed hardcoded fallbacks from payment validation options.
- **Files Touched:** `src/lib/backend/validation/paymentSchemas.ts`, `BACKEND_PROGRESS.md`
- **Notes:** Validation functions now enforce that minimum amounts are explicitly provided by the service layer, eliminating architecture-wise hardcoded fallbacks.

## Gemini - Phase 3 Service Layer Implementation - 2026-07-10

Completed:
- Created pure TypeScript service implementations under `src/lib/backend/services/`.
- Wired services to Phase 1 repository/service contracts.
- Reused Phase 2 validation schemas for all service inputs.
- Preserved Repository -> Service -> Adapter architecture.
- Added injected minimum amount providers for payment validation.
- Confirmed no Supabase, Next.js, React, or UI imports were added.

Files created:
- `src/lib/backend/services/memberService.ts`
- `src/lib/backend/services/paymentService.ts`
- `src/lib/backend/services/adminAuthService.ts`
- `src/lib/backend/services/adminMemberService.ts`
- `src/lib/backend/services/adminPaymentService.ts`
- `src/lib/backend/services/adminDashboardService.ts`
- `src/lib/backend/services/auditService.ts`

Verification:
- `npx.cmd tsc --noEmit`

## Codex - Backend AI Handoff Plan - 2026-07-10

Completed:
- Created a portable backend handoff and continuation document for use in another system/workspace.
- Captured the current Codex/Gemini collaboration model, completed phases, strict UI preservation rules, backend architecture, and Phase 4 direction.
- Documented the current backend folder state and review checklist so future agents can continue without confusion.

Files created:
- `BACKEND_AI_HANDOFF_PLAN.md`

Files modified:
- `BACKEND_PROGRESS.md`

Notes:
- This is a coordination/documentation artifact only. No implementation code, UI files, service files, adapter files, or contracts were changed.

## Gemini - Phase 4 Supabase Adapters - 2026-07-13

Completed:
- Created Supabase adapter folder under `src/lib/backend/adapters/supabase/`.
- Implemented repository adapters for members, payments, receipts, admin, audit, and dashboard stats.
- Added DTO mapper files for member, payment, and admin data.
- Kept Supabase imports isolated to adapter folder only.
- Preserved Repository -> Service -> Adapter architecture.

Files created:
- `src/lib/backend/adapters/supabase/client.ts`
- `src/lib/backend/adapters/supabase/mappers/member.mapper.ts`
- `src/lib/backend/adapters/supabase/mappers/payment.mapper.ts`
- `src/lib/backend/adapters/supabase/mappers/admin.mapper.ts`
- `src/lib/backend/adapters/supabase/repositories/supabaseMemberRepository.ts`
- `src/lib/backend/adapters/supabase/repositories/supabasePaymentRepository.ts`
- `src/lib/backend/adapters/supabase/repositories/supabaseReceiptRepository.ts`
- `src/lib/backend/adapters/supabase/repositories/supabaseAdminRepository.ts`
- `src/lib/backend/adapters/supabase/repositories/supabaseAuditRepository.ts`
- `src/lib/backend/adapters/supabase/repositories/supabaseAdminDashboardRepository.ts`
- `src/lib/backend/adapters/supabase/index.ts`

Verification:
- `npx.cmd tsc --noEmit` passed.

## Gemini - Phase 4 Fix Pass - 2026-07-13

Completed:
- Fixed payment amount resolution to prevent accidental zero-amount payment inserts.
- Removed fake dashboard zero fallback behavior.
- Improved storage portability by avoiding direct stored public URL mapping.
- Fixed audit actor name handling.
- Replaced timestamp-only receipt IDs with safer unique receipt ID generation.
- Preserved Supabase adapter isolation and Repository -> Service -> Adapter architecture.

Files modified:
- `src/lib/backend/adapters/supabase/repositories/supabasePaymentRepository.ts`
- `src/lib/backend/adapters/supabase/repositories/supabaseAdminDashboardRepository.ts`
- `src/lib/backend/adapters/supabase/mappers/payment.mapper.ts`
- `src/lib/backend/adapters/supabase/repositories/supabaseAuditRepository.ts`
- `src/lib/backend/adapters/supabase/repositories/supabaseReceiptRepository.ts`
- `BACKEND_PROGRESS.md`

Verification:
- `npx.cmd tsc --noEmit` passed.

## Gemini - Phase 5 Supabase Schema, RLS, RPC, Storage - 2026-07-13

Completed:
- Created Supabase migration folder and SQL migration files.
- Added database enums, tables, constraints, indexes, RLS helpers, RLS policies, RPC functions, storage buckets, and seed data.
- Added .env.example without secrets.
- Aligned adapter table names with canonical backend schema where required.
- Preserved separate-Supabase-per-unit deployment model.
- Preserved UI with no visual or Malayalam text changes.

Files created:
- supabase/README.md
- supabase/migrations/001_extensions_and_enums.sql
- supabase/migrations/002_core_identity_tables.sql
- supabase/migrations/003_member_tables.sql
- supabase/migrations/004_payment_tables.sql
- supabase/migrations/005_admin_rbac_tables.sql
- supabase/migrations/006_settings_support_events_tables.sql
- supabase/migrations/007_audit_notifications_storage_tables.sql
- supabase/migrations/008_indexes_constraints.sql
- supabase/migrations/009_rls_helpers.sql
- supabase/migrations/010_rls_policies.sql
- supabase/migrations/011_rpc_functions.sql
- supabase/migrations/012_storage_buckets.sql
- supabase/migrations/013_seed_roles_permissions_settings.sql
- .env.example

Files modified if needed:
- Supabase adapter files only, to align table names with canonical schema.
- BACKEND_PROGRESS.md

Verification:
-
px.cmd tsc --noEmit passed.

## Gemini - Phase 5 Fix Pass - 2026-07-13

Completed:
- Aligned database enums with TypeScript DTO/contract values.
- Fixed member/payment/admin schema mismatches with Supabase adapters.
- Strengthened amount constraints to prevent zero payment inserts.
- Completed role-permission seed data.
- Expanded RLS helper functions and RLS policies across all protected tables.
- Added required RPC functions including payment amount resolution and audit event recording.
- Implemented actual Supabase storage bucket creation SQL.
- Verified adapters and migrations agree on canonical table/column names.
- Preserved separate-Supabase-per-unit deployment model.

Files modified:
- supabase/migrations/001_extensions_and_enums.sql
- supabase/migrations/003_member_tables.sql
- supabase/migrations/004_payment_tables.sql
- supabase/migrations/005_admin_rbac_tables.sql
- supabase/migrations/008_indexes_constraints.sql
- supabase/migrations/009_rls_helpers.sql
- supabase/migrations/010_rls_policies.sql
- supabase/migrations/011_rpc_functions.sql
- supabase/migrations/012_storage_buckets.sql
- supabase/migrations/013_seed_roles_permissions_settings.sql
- Adapter files if alignment changes were required.
- BACKEND_PROGRESS.md

Verification:
-
px.cmd tsc --noEmit passed.

## Gemini - Phase 5 Final Fix Pass - 2026-07-13

Completed:
- Removed invalid lood_group DEFAULT 'unknown' usage.
- Added DB-side member code generation so member inserts satisfy member_code NOT NULL.
- Fixed numeric app setting parsing for payment amount resolution.
- Removed hardcoded runtime payment amount fallbacks from
esolve_payment_amount.
- Updated storage object policies to use app-level admin permission helpers instead of uth.uid().
- Updated receipt repository to use generate_receipt_id RPC.
- Verified migrations and adapters are closer to real Supabase apply readiness.

Files modified:
- supabase/migrations/003_member_tables.sql
- supabase/migrations/011_rpc_functions.sql
- supabase/migrations/012_storage_buckets.sql
- supabase/migrations/013_seed_roles_permissions_settings.sql
- src/lib/backend/adapters/supabase/repositories/supabaseReceiptRepository.ts
- BACKEND_PROGRESS.md

Verification:
-
px.cmd tsc --noEmit passed.

## Gemini - Phase 5 Adapter Alignment Mini-Fix - 2026-07-13

Completed:
- Updated Supabase payment adapter to use
esolve_payment_amount RPC for monthly dues.
- Added safe member id resolution from member query.
- Ensured monthly dues payments do not insert without a valid member id.
- Ensured resolved member id is attached to payment inserts where available.
- Preserved no-hardcoded-payment-amount rule.

Files modified:
- src/lib/backend/adapters/supabase/repositories/supabasePaymentRepository.ts
- BACKEND_PROGRESS.md

Verification:
-
px.cmd tsc --noEmit passed.

## Gemini - Phase 5 Security Audit Fix Pass - 2026-07-13

Completed:
- Replaced raw receipt token storage with receipt token hashing.
- Added receipt token expiry support.
- Hardened RLS helper functions to require active admins/members.
- Split over-broad RLS mutation policies into operation-specific policies.
- Aligned payment/receipt/cash schema nullability with DTO requirements.
- Enforced one receipt per payment.
- Added search_path protection to SECURITY DEFINER functions.
- Prevented zero special event minimum amounts.
- Improved migration policy idempotency where relevant.
- Preserved UI and Malayalam text unchanged.

Files modified:
- supabase/migrations/004_payment_tables.sql
- supabase/migrations/008_indexes_constraints.sql
- supabase/migrations/009_rls_helpers.sql
- supabase/migrations/010_rls_policies.sql
- supabase/migrations/011_rpc_functions.sql
- src/lib/backend/adapters/supabase/repositories/supabasePaymentRepository.ts
- src/lib/backend/adapters/supabase/repositories/supabaseReceiptRepository.ts
- src/lib/backend/adapters/supabase/mappers/payment.mapper.ts
- BACKEND_PROGRESS.md

Verification:
-
px.cmd tsc --noEmit passed.

## Gemini - Phase 5 Data-Flow Integrity Fix Pass - 2026-07-13

Completed:
- Ensured payment and receipt rows reuse the same
eceipt_id.
- Updated cash entry adapter flow to create a linked payment before inserting cash_entries.
- Added active-member checks to member-facing RLS policies.
- Added one-time raw receipt token return support without storing raw tokens.
- Made generate_receipt_id() collision-aware.
- Preserved receipt token hashing and no raw token storage.

Files modified:
- supabase/migrations/010_rls_policies.sql
- supabase/migrations/011_rpc_functions.sql
- src/lib/backend/adapters/supabase/repositories/supabasePaymentRepository.ts
- src/lib/backend/adapters/supabase/repositories/supabaseReceiptRepository.ts
- BACKEND_PROGRESS.md

Verification:
-
px.cmd tsc --noEmit passed.

## Gemini - Phase 5 Cash Entry Phone Fix - 2026-07-13

Completed:
- Removed "0000000000" fallback for payer_phone in
ecordCashEntry.
- If guestPhone is missing but memberId exists, fetching phone and name from members profile.
- Throw error if no valid phone can be found.

Files modified:
- src/lib/backend/adapters/supabase/repositories/supabasePaymentRepository.ts
- BACKEND_PROGRESS.md

Verification:
-
px.cmd tsc --noEmit passed.

## Codex - Phase 5 RPC Privilege Final Hardening Fix - 2026-07-13 21:49:29

Completed:
- Added missing execute privilege hardening for `generate_member_code()`.
- Ensured the member-code generation function is revoked from `PUBLIC`, `anon`, and `authenticated`.
- Ensured only `service_role` has explicit execute permission for `generate_member_code()`.

Files modified:
- supabase/migrations/014_rpc_execute_privileges.sql
- BACKEND_PROGRESS.md

Verification:
- `npx.cmd tsc --noEmit` passed.
- Security scan confirmed no Supabase imports outside the adapter layer, no `auth.uid()` usage, no fake phone fallback, and all custom RPC/helper functions are covered by execute privilege hardening.

## Gemini - Phase 5 RPC Privilege Hardening - 2026-07-13

Completed:
- Created 014_rpc_execute_privileges.sql.
- Revoked EXECUTE privileges from PUBLIC, anon, and authenticated roles for all custom functions.
- Granted explicit EXECUTE privileges to service_role for backend API access.

Files modified:
- supabase/migrations/014_rpc_execute_privileges.sql
- BACKEND_PROGRESS.md

Verification:
-
px.cmd tsc --noEmit passed.

## Codex - Phase 6 Server Integration Technical Plan - 2026-07-14 09:58:46 +05:30

Completed:
- Reviewed the full backend progress ledger and all mandatory UI, architecture, and Supabase backend specifications.
- Reconciled the completed Phase 5 state with the current contracts, services, adapters, migrations, mock boundaries, and missing API/composition layer.
- Defined Phase 6 as a security-bounded server integration foundation plus one end-to-end tokenized public receipt read slice.
- Deferred protected admin/member endpoints until a real server-derived authentication/session actor exists, because current adapters use the service-role client.
- Documented current integration findings, exact file scope, transport/error rules, verification matrix, implementation order, and Codex review gate.

Files created:
- `PHASE_6_SERVER_INTEGRATION_PLAN.md`

Files modified:
- `BACKEND_PROGRESS.md`

Notes/Next Steps:
- Gemini should implement only the Phase 6 scope in `PHASE_6_SERVER_INTEGRATION_PLAN.md`, then update this ledger and return the work to Codex for review.
- No UI files, Malayalam text, backend runtime code, adapters, services, migrations, or route handlers were changed by this planning task.
- Local `node_modules` is absent. Gemini must run `npm ci` and read the installed Next.js 16.2.10 route-handler documentation before writing route-handler code.

## Gemini - Phase 6 Server Integration - 2026-07-14

Completed:
- Ran `npm ci` to restore node_modules.
- Extracted `ReceiptService` contract and implementation into dedicated files.
- Updated `SupabaseReceiptRepository` to hash token, enforce expiry, restrict to `confirmed` status, and fetch related `payment_months`.
- Created server-only composition root (`receiptService.server.ts`) to securely lock Supabase adapter instantiation.
- Created HTTP transport helpers (`requestContext.ts`, `backendResultResponse.ts`) implementing strict Phase 6 status mappings and secure headers.
- Implemented GET API Route Handler (`/api/v1/receipts/[receiptId]/route.ts`).
- Added `.env.example`.
- Verified backend code with `npx tsc --noEmit` (ignoring pre-existing frontend mock UI errors as per strict architectural boundary rules).

Files created:
- `src/lib/backend/services/receiptService.ts`
- `src/lib/backend/composition/receiptService.server.ts`
- `src/lib/backend/http/requestContext.ts`
- `src/lib/backend/http/backendResultResponse.ts`
- `src/app/api/v1/receipts/[receiptId]/route.ts`
- `.env.example`

Files modified:
- `src/lib/backend/contracts/payment.contract.ts`
- `src/lib/backend/services/paymentService.ts`
- `src/lib/backend/adapters/supabase/repositories/supabaseReceiptRepository.ts`
- `src/lib/backend/adapters/supabase/mappers/payment.mapper.ts`
- `package.json` (removed uuid)
- `package-lock.json` (updated)
- `tsconfig.json` (excluded nested backup)
- `.gitignore` (added .env.example, supabase/.temp/)
- `BACKEND_PROGRESS.md`

Verification:
- Backend files type-check passed successfully.
- Full TypeScript compiler and Production Build succeeded (`npm run build`).
- Linter issues in Phase 6 files resolved (`npm run lint`).
- Endpoint matrix tested locally via dev server (400 for missing token, 404 for invalid/expired/unknown, 500 for backend crashes with proper `BackendResult` schema).

Notes/Next Steps:
- Over to Codex for Phase 6 review and Phase 7 planning.

## Codex - Phase 6 Review Fix Pass - 2026-07-14

Completed:
- Corrected receipt adapter error handling so Supabase/RPC failures propagate as server errors instead of becoming false `404` responses.
- Added `.env.example`, `supabase/.temp/`, and nested backup exclusions with verified ignore behavior.
- Removed the temporary untracked test script and tightened request-ID UUID validation.
- Sanitized route/service/server logs and preserved the `BackendResult` shape for `500` responses.
- Confirmed `TOO_MANY_ATTEMPTS` remains mapped to HTTP `429` and removed the unused `uuid` dependency path.

Files modified:
- `src/lib/backend/adapters/supabase/repositories/supabaseReceiptRepository.ts`
- `src/lib/backend/services/receiptService.ts`
- `src/lib/backend/services/paymentService.ts`
- `src/lib/backend/http/requestContext.ts`
- `src/lib/backend/http/backendResultResponse.ts`
- `src/app/api/v1/receipts/[receiptId]/route.ts`
- `.gitignore`
- `eslint.config.mjs`
- `.env.example`
- `BACKEND_PROGRESS.md`

Verification:
- Phase 6 targeted lint passed.
- `npx.cmd tsc --noEmit` passed.
- `npm.cmd run build` passed and generated the receipt route as dynamic.
- Production smoke checks passed for missing token (`400`), unknown/invalid token (`404`), invalid inbound request ID replacement, and simulated Supabase failure (`500` with safe `BackendResult`, request ID, and retryable server error).
- Full root lint still reports pre-existing UI/legacy-adapter issues; no UI or Malayalam files were changed to suppress them. This is recorded as a baseline limitation, not a Phase 6 success claim.
- Valid receipt data-flow testing against Supabase is deferred until an explicitly disposable/local Supabase project is available; the configured target is remote and was not mutated for test data.

Review outcome:
- Phase 6 code and transport hardening pass review. Protected authentication-dependent work remains gated on Phase 7.

## Codex - Phase 7 Authentication and Session Technical Plan - 2026-07-14

Completed:
- Adopted the product owner's decision to use phone + generated admin code and phone + member PIN, without Supabase Auth OTP/passwordless login.
- Defined server-side hashed-code verification, login attempt lockout, opaque hashed session cookies, session expiry/revocation, and server-derived `ActorContext`.
- Defined the forward-only `015_auth_sessions.sql` migration, auth contracts/services/adapters, four auth routes, security boundaries, verification matrix, and Phase 8 UI handoff.
- Explicitly removed the unsafe optional-admin-verification bypass from the Phase 7 implementation requirements.

Files created:
- `PHASE_7_AUTH_SESSION_PLAN.md`

Notes/Next Steps:
- Gemini may implement only the scope in `PHASE_7_AUTH_SESSION_PLAN.md`.
- The existing UI remains unchanged during Phase 7. Mock identity replacement and the admin-panel code generation/reset endpoint are subsequent reviewed work.
- Product decision clarified: after login, keep the session persistent across browser close/reopen; logout is the normal exit action. Account disable, code reset, or explicit admin revocation may still invalidate a session.

## Codex - Dashboard Integration Cross-check and Phase 8 Plan - 2026-07-18

Completed:
- Re-checked dashboard pages, API routes, service/repository layers, DTOs, migrations, and mock references instead of relying only on the ledger.
- Confirmed that dashboard service/repository groundwork exists, but no protected admin/member dashboard API routes or frontend API wiring exist yet.
- Confirmed admin/member dashboard screens still consume mock data and that the current dashboard repository does not populate all rendered metrics.
- Defined the dependency order: Phase 7 session/auth implementation and review, then read-only dashboard APIs, then login/dashboard UI wiring and dashboard-only mock removal.

Files created:
- `PHASE_8_READ_ONLY_DASHBOARD_PLAN.md`

Notes/Next Steps:
- Await product-owner approval before implementing Phase 7/Phase 8 code.
- Payment creation, UPI/gateway, and payment mutation workflows remain outside this dashboard plan.

## Codex - Phase 7 Authentication and Phase 8 Dashboard Integration - 2026-07-18

Completed:
- Added server-verified member phone + 4-digit PIN and admin phone + generated-code login flows.
- Added login attempt tracking with five-attempt/15-minute lockout behavior.
- Added persistent opaque sessions with SHA-256 token hashes, HttpOnly/SameSite cookies, server-side revocation, and active-account rechecks.
- Removed the optional admin credential-verification bypass.
- Added protected admin/member dashboard APIs with server-derived `ActorContext` and admin permission enforcement.
- Replaced dashboard-only mock totals, recent payments, cash handovers, member identity, dues, and activity with API data.
- Wired existing member/admin login forms and logout controls without redesigning the approved UI.

Files created:
- `supabase/migrations/015_auth_sessions.sql`
- `src/lib/backend/contracts/auth.contract.ts`
- `src/lib/backend/contracts/dashboard.contract.ts`
- `src/lib/backend/dto/auth.dto.ts`
- `src/lib/backend/dto/dashboard.dto.ts`
- `src/lib/backend/validation/authSchemas.ts`
- `src/lib/backend/services/authService.ts`
- `src/lib/backend/services/dashboardService.ts`
- `src/lib/backend/auth/sessionCookie.ts`
- `src/lib/backend/auth/resolveActor.ts`
- `src/lib/backend/composition/authService.server.ts`
- `src/lib/backend/composition/dashboardService.server.ts`
- `src/lib/backend/adapters/supabase/mappers/auth.mapper.ts`
- `src/lib/backend/adapters/supabase/repositories/supabaseAuthRepository.ts`
- `src/lib/backend/adapters/supabase/repositories/supabaseDashboardRepository.ts`
- `src/app/api/v1/auth/member/login/route.ts`
- `src/app/api/v1/auth/admin/login/route.ts`
- `src/app/api/v1/auth/session/route.ts`
- `src/app/api/v1/auth/logout/route.ts`
- `src/app/api/v1/admin/dashboard/route.ts`
- `src/app/api/v1/member/dashboard/route.ts`
- `src/lib/api/backendClient.ts`
- `src/lib/api/authClient.ts`
- `src/lib/api/dashboardClient.ts`

Verification:
- `npx.cmd tsc --noEmit` passed.
- Phase 7/8 targeted lint passed with zero errors/warnings.
- `npm.cmd run build` passed and generated all six new API routes as dynamic handlers.
- Production smoke tests: missing session, admin dashboard, and member dashboard returned `401`; malformed login returned `400`; request-ID/no-store/referrer headers were present.
- Security scans found no dashboard mock references and no direct Supabase imports/calls in UI or Route Handlers.
- Full repository lint still reports 39 errors and 64 warnings in pre-existing/out-of-scope files. Targeted Phase 7/8 files are clean; the global baseline is not claimed as passing.
- Valid credential/data integration was not run because the configured Supabase target is remote and not identified as disposable. Migration `015` and the follow-up auth compatibility hardening are now applied to the linked unit database.

Notes/Next Steps:
- Product owner authorized Codex to plan and implement the next logical non-payment module autonomously.
- Payment creation, gateway/UPI integration, and payment status mutations remain excluded.

## Codex - Phase 9A Admin Member Read Plan - 2026-07-18

Completed:
- Selected the protected admin member list as the next bounded non-payment slice.
- Defined mandatory `members.view` authorization, pagination/filter completion,
  safe DTO transport, and admin members-page mock replacement.

Files created:
- `PHASE_9_ADMIN_MEMBER_READ_PLAN.md`

Notes/Next Steps:
- Product owner authorized autonomous implementation; Phase 9A implementation may proceed without another approval round.

## Codex - Phase 9A Admin Member Read Implementation - 2026-07-18

Completed:
- Added the protected `GET /api/v1/admin/members` route with server-derived actor identity, pagination, and validated member filters.
- Made `members.view` permission enforcement mandatory in `AdminMemberService` and added the server-only composition root.
- Completed Supabase member-list filtering, deterministic ordering, and database error propagation.
- Replaced `MOCK_MEMBERS` on the admin members page with the backend client while preserving the existing responsive table/card layout.
- Corrected pending-state rendering to use the stored dues amount instead of account/PIN status.
- Removed the old client-only fake "mark paid" state transition; payment status is no longer shown as changed unless a future payment API actually records it.

Files created:
- `src/lib/backend/composition/adminMemberService.server.ts`
- `src/app/api/v1/admin/members/route.ts`
- `src/lib/api/memberClient.ts`

Verification:
- `npx tsc --noEmit` passed.
- Targeted Phase 9A lint passed with zero errors/warnings.
- `npm run build` passed and generated `/api/v1/admin/members` as a dynamic route.
- Production smoke test confirmed an unauthenticated request returns `401 LOGIN_REQUIRED` with `private, no-store`, `no-referrer`, and a matching request ID.
- Scans confirmed the admin members-list page/API client/Route Handler contain no mock-member reference and no direct Supabase access.
- `git diff --check` passed; its only output was the existing Windows line-ending normalization warning.
- A valid admin/member-session data test was not run because the configured Supabase target is remote and has not been approved as a disposable test database.

Notes/Next Steps:
- Member detail, create/edit/delete, member self-profile/directory, and payment history remain separate follow-up slices.
- Payment creation and payment status mutations remain excluded.

## Codex - Phase 9B Admin Member Detail Plan - 2026-07-18

Completed:
- Selected the protected admin member-detail read as the next bounded non-payment slice.
- Defined safe not-found/database-error behavior and mandatory `members.view` authorization.
- Explicitly excluded member mutation, PIN reset, cash recording, payment history, family/event data, and audit history.

Files created:
- `PHASE_9B_ADMIN_MEMBER_DETAIL_PLAN.md`

## Codex - Phase 9B Admin Member Detail Implementation - 2026-07-18

Completed:
- Added mandatory-authorization `getMember` behavior to `AdminMemberService` and the protected `GET /api/v1/admin/members/[id]` route.
- Changed member lookup to distinguish a missing row from a Supabase/database failure.
- Added UUID validation so malformed member IDs return a validation error instead of reaching the database.
- Replaced the detail-page `MOCK_MEMBERS` lookup with the backend client and a shared DTO-to-UI mapper.
- Removed browser-generated `Math.random()` PINs and hard-coded payment, event, and audit records.
- Kept Edit, Reset PIN, and Record Cash visually intact but non-deceptive until their reviewed mutation phases are implemented.
- Reconfirmed the soft-delete rule: member deletion updates `status` to `left`, checks the database error, and never removes the row.
- Excluded `left` members from normal member/directory lists unless that status is explicitly requested.

Files created:
- `src/app/api/v1/admin/members/[id]/route.ts`
- `src/lib/admin/mapMemberDto.ts`

Verification:
- `npx tsc --noEmit` passed.
- Targeted Phase 9B lint passed with zero errors/warnings.
- `npm run build` passed and generated `/api/v1/admin/members/[id]` as a dynamic route.
- Production smoke test confirmed an unauthenticated detail request returns `401 LOGIN_REQUIRED` with no-store/referrer/request-ID protections.
- Scans found no detail-page mock member, sample receipt/event/audit data, browser-random PIN, or direct Supabase access.
- A valid admin/member-session and unknown-member `404` data test remains pending because the configured remote Supabase is not approved as disposable and migration `015` has not been applied there.

Notes/Next Steps:
- Member create/edit/soft-delete wiring and secure PIN reset remain future non-payment mutation slices.
- Payment history and cash recording remain excluded until the payment phase.


## Codex - Linked Supabase Migration Reconciliation - 2026-07-18

Completed:
- Confirmed the folder's Supabase link metadata matches the project URL configured in `.env.local` without exposing credential values.
- Confirmed migrations `001` through `021` were already present remotely; migration `015` had already been applied.
- Fetched missing remote history `016` through `021` into the repository and retained immutable `001` through `014` unchanged.
- Redacted replayable legacy test credentials from the local copies of test-only history migrations.
- Added and applied forward-only `022_disable_legacy_test_logins.sql`.
- Added the `verify_app_login` RPC required by the Phase 7 Supabase auth adapter and restricted login RPC execution to `service_role`.
- Soft-deleted the explicitly seeded legacy test member, deactivated the explicitly seeded legacy test admin, cleared their hashes, sessions, and attempt records.

Verification:
- Remote migration ledger matches local versions `001` through `022`.
- Final `supabase db push --dry-run` reports the remote database is up to date.
- PostgREST schema exposes `verify_app_login`, `auth_sessions`, and `auth_login_attempts` to the service role.
- Legacy test member is `left/reset_required` with no PIN hash.
- Legacy test admin is `inactive` with no code hash.
- No real member/admin records were targeted by the cleanup; exact legacy phone and test-name matching were both required.

## Codex - Phase 9C Member Mutation and PIN Plan - 2026-07-19

Completed:
- Cross-checked the existing member service/repository groundwork, Route Handlers,
  Add/Edit form behavior, member schema, permissions, audit adapter, and session/PIN
  architecture.
- Confirmed create/update/soft-delete skeletons exist, but mutation routes, complete
  field/family persistence, audit transactions, secure PIN issuance, and UI wiring
  remain incomplete.
- Defined a forward-only transactional migration, protected API routes, permission
  matrix, server-generated one-time PIN flow, soft-delete/session-revocation rules,
  mock replacement boundaries, and verification matrix.

Files created:
- `PHASE_9C_MEMBER_MUTATION_PIN_PLAN.md`

Notes/Next Steps:
- Phase 9C is planned only; implementation has not started.
- Payment behavior, profile-photo storage, admin notes schema, admin-user code
  generation, and member self-profile/directory wiring remain outside Phase 9C.

## Codex - Phase 9C Member Mutations and Secure PIN Implementation - 2026-07-19

Completed:
- Added complete member/family create and update contracts, DTO mapping, input
  validation, duplicate-phone conflict mapping, and server-side UUID/not-found
  guards.
- Added protected member create, update, soft-delete, and PIN issue/reset Route
  Handlers using the existing session-derived actor and service/repository layers.
- Replaced partial direct table mutations with transactional, service-role-only
  Supabase RPCs that update member/family/session/audit state atomically.
- Kept deletion soft-only: the member row remains and moves to `left`; its PIN is
  cleared and active member sessions are revoked.
- Added forward-only hardening so a `left` member cannot be restored through PATCH,
  and repeated soft-delete requests still revoke unexpectedly active sessions
  without writing duplicate transition audits.
- Generate 4-digit member PINs only on the server with `crypto.randomInt`; store only
  the pgcrypto hash, revoke old sessions, and exclude the raw PIN/hash from audit
  data and normal member DTOs.
- Removed the Add/Edit form's simulated save, replaced the edit-page mock lookup,
  persisted the supported form and family fields, and wired real Edit, soft-delete,
  one-time PIN display/copy/WhatsApp, and truthful error/success behavior without a
  UI redesign.
- Kept payment/cash recording, photo storage, and admin notes persistence explicitly
  outside this phase; their visible controls do not claim a successful write.

Files created:
- `supabase/migrations/023_member_mutations_and_pin.sql`
- `supabase/migrations/024_member_soft_delete_guards.sql`
- `src/app/api/v1/admin/members/[id]/pin/route.ts`

Major files updated:
- `src/lib/backend/contracts/member.contract.ts`
- `src/lib/backend/contracts/admin.contract.ts`
- `src/lib/backend/dto/member.dto.ts`
- `src/lib/backend/validation/memberSchemas.ts`
- `src/lib/backend/services/adminMemberService.ts`
- `src/lib/backend/adapters/supabase/repositories/supabaseMemberRepository.ts`
- `src/lib/backend/adapters/supabase/mappers/member.mapper.ts`
- `src/lib/backend/http/backendResultResponse.ts`
- `src/app/api/v1/admin/members/route.ts`
- `src/app/api/v1/admin/members/[id]/route.ts`
- `src/lib/api/memberClient.ts`
- `src/components/admin/members/MemberForm.tsx`
- `src/app/admin/members/[id]/edit/page.tsx`
- `src/app/admin/members/[id]/page.tsx`
- `src/lib/admin/admin-types.ts`
- `src/lib/admin/mapMemberDto.ts`

Verification:
- `npx tsc --noEmit` passed.
- Targeted Phase 9C lint passed with zero errors/warnings.
- `npm run build` passed and emitted all member pages and the four protected member
  API mutation/read routes successfully.
- Production smoke checks confirmed unauthenticated list/create/update/delete/PIN
  requests return `401`.
- Migrations `023` and `024` were dry-run as the only pending migrations, applied to
  the linked unit database, and confirmed in the remote migration ledger.
- Remote anonymous-role probes for all four mutation RPCs returned `401` with
  PostgreSQL code `42501` (`permission denied`); execution remains service-role-only.
- Scans found no `MOCK_MEMBERS`, fake save timer, browser `Math.random()` PIN,
  frontend/Route-Handler Supabase access, or hard delete of `members` in the wired
  paths. `git diff --check` reported only existing line-ending normalization notices.
- Full repository lint still has pre-existing out-of-scope UI/legacy-adapter issues;
  Phase 9C files themselves are clean.

Limitations/Next Steps:
- Authorized success-path mutation tests were not run against real member records,
  because the linked unit database is not disposable and no test admin credential
  was used. The migration and permission boundary were verified without creating or
  altering test member data.
- Linked database lint also reports pre-existing issues in `generate_receipt_id` and
  `hash_receipt_token`; neither function was introduced or changed by Phase 9C.
- Payment integration remains pending. Member self-profile/directory wiring and the
  pre-existing database-function lint findings are suitable next non-payment slices.

## Codex - Phase 10 Pre-Payment Hardening Plan - 2026-07-19

Completed:
- Audited the remaining mock surfaces, route protection, member service/repository
  groundwork, support contacts, audit-log groundwork, database lint output, and
  payment dependencies.
- Selected only the non-payment work that can be made truthful without trusting
  incomplete payment/dues data.
- Defined member profile/directory, support-contact read, audit-log read, Next.js 16
  proxy hardening, and forward-only database-function/profile RPC work.

Files created:
- `PHASE_10_PRE_PAYMENT_HARDENING_PLAN.md`

Notes/Next Steps:
- Payment-derived screens remain unchanged until payment source-of-truth work begins.
- Phase 10 implementation is authorized by the product owner's instruction to finish
  all safely implementable pre-payment work.

## Codex - Phase 10 Pre-Payment Hardening Implementation - 2026-07-19

Completed:
- Added protected member profile GET/PATCH and privacy-scoped member directory APIs
  through the required service/repository/Supabase layering.
- Restricted self-profile mutation to name, WhatsApp, age, blood group, address,
  occupation, and the stored biometric preference. Phone/login identity, member
  status, tier, dues, PIN, family rows, and member code cannot be changed here.
- Made profile updates transactional, active-member-only, service-role-only, and
  safely audited without recording PINs, session tokens, or other login secrets.
- Replaced member profile and directory mock records with authenticated backend data.
  Payment target/progress now shows an unavailable state rather than invented values
  before payment source-of-truth work exists.
- Added a public read-only active support-contact API and replaced the hard-coded
  phone/email data on the support page and member contact drawer.
- Added a permission-protected admin audit-log read API, replaced mock audit rows,
  and kept audit purge disabled because no reviewed destructive workflow exists.
- Replaced deprecated `middleware.ts` with Next.js 16 `proxy.ts` for optimistic
  missing-cookie redirects. Route Handlers still perform authoritative session and
  permission checks.
- Hardened receipt helper functions and resolved all linked database linter findings
  through forward-only migrations `025`, `026`, and follow-up `027`.

Files created:
- `supabase/migrations/025_pre_payment_function_hardening.sql`
- `supabase/migrations/026_member_profile_update.sql`
- `supabase/migrations/027_resolve_function_lint_warnings.sql`
- `src/proxy.ts`
- `src/lib/backend/auth/sessionConstants.ts`
- `src/lib/backend/composition/memberService.server.ts`
- `src/lib/backend/composition/auditService.server.ts`
- `src/lib/backend/composition/supportService.server.ts`
- `src/lib/backend/contracts/support.contract.ts`
- `src/lib/backend/dto/support.dto.ts`
- `src/lib/backend/services/supportService.ts`
- `src/lib/backend/adapters/supabase/repositories/supabaseSupportRepository.ts`
- `src/app/api/v1/member/profile/route.ts`
- `src/app/api/v1/member/directory/route.ts`
- `src/app/api/v1/admin/audit-logs/route.ts`
- `src/app/api/v1/support/contacts/route.ts`
- `src/lib/api/auditClient.ts`
- `src/lib/api/supportClient.ts`

Verification:
- `npx tsc --noEmit` passed.
- Targeted Phase 10 ESLint passed with zero errors or warnings.
- `npm run build` passed under Next.js `16.2.10` and emitted the four new dynamic
  API routes plus `proxy.ts` successfully.
- Production smoke checks confirmed missing-session member/admin pages redirect to
  the correct login, protected profile/directory/audit APIs return `401`, and the
  public support-contact API returns `200`.
- Migrations `025` and `026`, followed by lint-only correction `027`, were dry-run,
  applied to the linked unit database, and confirmed in the remote ledger through
  version `027`.
- Linked `supabase db lint --level warning` reports no schema errors or warnings.
- Remote anonymous-role probes for `generate_receipt_id` and
  `member_update_profile` both returned `401`; execution remains service-role-only.
- Scans found no profile/directory/support/audit mock records or direct Supabase
  access from the wired UI/Route Handler files. `git diff --check` is clean apart
  from existing Windows line-ending normalization notices.

Limitations/Next Steps:
- No valid-login success-path write was performed against a real member because the
  linked unit database is not disposable. Read/session/RPC permission boundaries and
  build-time integration were verified without altering real member data.
- Full repository lint still reports 21 errors and 56 warnings in older out-of-scope
  UI, payment mock, and legacy adapter files. Phase 10 files are clean and the
  production build passes; this historical lint baseline is not claimed as fixed.
- The next logical phase is payment source-of-truth design and security planning.
  Payment creation/status, cash entry, receipts, reports, defaulters, and payment
  settings remain intentionally unimplemented or mock-backed until that plan is
  approved.

## Codex - Initial Unit Super Admin Provisioning - 2026-07-19

Completed:
- Provisioned the product-owner-supplied phone as a new active Super Admin in the
  linked unit database.
- Stored only a bcrypt hash of the supplied 4-digit PIN; no plaintext credential was
  written to migrations, project files, audit data, or the progress ledger.
- Assigned the system `super_admin` role, cleared prior login-attempt state, revoked
  any pre-existing sessions for the account, and recorded a secret-free audit event.
- Used a service-role-only temporary transactional provisioning RPC, then removed the
  RPC immediately after successful provisioning.

Files created:
- `supabase/migrations/028_temporary_super_admin_provisioning.sql`
- `supabase/migrations/029_fix_temporary_super_admin_provisioning.sql`
- `supabase/migrations/030_remove_temporary_super_admin_provisioning.sql`

Verification:
- Database verification confirmed the account is active, has the `super_admin` role,
  and contains a non-empty password hash.
- Existing `verify_app_login` returned `success` for the supplied credential.
- The actual localhost admin login Route Handler created a valid admin session; the
  test session was then logged out and revoked.
- The linked migration ledger matches local history through `030`.
- Linked database lint reports no schema errors or warnings.
- The temporary provisioning RPC no longer exists after migration `030`.

## Codex - Real Blood Donor Directory Wiring - 2026-07-19

Completed:
- Removed `MOCK_BLOOD_DONORS` from the Admin Blood Donors page.
- Added an authenticated `isBloodDonor` member-list filter through the existing
  Route Handler, service validation, repository interface, and Supabase adapter flow.
- The page now lists only active members whose stored `is_blood_donor` value is true.
- Availability changes now use the protected member-update API and persist to
  `donor_available` instead of changing browser state only.
- Kept missing donation-history data truthful as `Not recorded`; no payment or
  donation date is inferred from unrelated fields.
- Connected CSV export to the currently filtered real donor rows and escaped cells
  against spreadsheet formula injection.
- Added strict boolean validation for donor status/availability filters and member
  updates.

Verification:
- `npx tsc --noEmit` passed.
- Targeted ESLint passed with zero errors or warnings.
- `git diff --check` found no whitespace errors; only existing Windows line-ending
  notices were emitted.
- Authenticated localhost smoke test confirmed Super Admin login, successful donor
  API response using `status=active&isBloodDonor=true`, donor page HTTP `200`, and
  logout. The API returned the linked database's current real donor count.
- No real member or donor values were changed during verification.

## Codex - Post-Create Member WhatsApp Invitation - 2026-07-19

Completed:
- Active member creation now immediately calls the protected server-generated PIN
  endpoint after the member transaction succeeds.
- Added a one-time invitation dialog showing the generated PIN, phone number, safe
  copy action, and a prefilled WhatsApp Invite link.
- Kept the raw PIN only in short-lived React state. It is not written to URLs,
  local/session storage, logs, migrations, member DTOs, or audit data.
- Closing the dialog navigates to the created member's detail page; the PIN cannot be
  recovered from the UI afterward.
- Inactive/blocked new members are not issued an unusable invitation. The admin is
  directed to activate the member first.
- If member creation succeeds but PIN issuance fails, the UI reports the partial
  outcome truthfully and navigates to the member detail page where Reset PIN remains
  available.

Files created:
- `src/components/admin/members/MemberInvitationDialog.tsx`

Files updated:
- `src/components/admin/members/MemberForm.tsx`

Verification:
- `npx tsc --noEmit` passed.
- Targeted ESLint passed with zero errors or warnings.
- `git diff --check` found no whitespace errors; only the existing Windows line-ending
  notice was emitted.
- Authenticated localhost smoke test confirmed the Add Member page returns HTTP `200`;
  the verification session was logged out afterward.
- No test member was created in the linked production-like unit database.

## Codex - Phase 11 Admin Settings and Invitation Management - 2026-07-19

Completed:
- Added an authenticated Invite / Resend action to active member rows and mobile
  cards. Every resend generates a new server-side PIN, invalidates the previous PIN,
  revokes that member's sessions, and displays the result only in the one-time shared
  invitation dialog.
- Moved the default WhatsApp member invitation text to a private persisted setting.
  The Security page now loads, previews with a masked PIN, validates required
  `{phone}` and `{pin}` placeholders, and saves the template through the approved
  Route Handler, service, repository, adapter, and Supabase flow.
- Replaced Admin Users mock data with real admin accounts. Existing active members
  can be found by name, phone, or member code and promoted without changing or
  duplicating their member identity. Role/status updates, one-time admin code reset,
  session revocation, and soft deactivation are transactional and audited.
- Replaced Support Contacts and Special Events mock state with real Supabase-backed
  list/create/update/reorder/archive flows. Archive is soft-delete behavior and does
  not alter member or payment history.
- Wired Unit Settings text fields to private `app_settings` values. Empty optional
  address/contact fields can be configured incrementally; the unit name remains
  required. Logo upload stays visible but truthfully disabled until storage wiring is
  reviewed.
- Kept payment configuration, receipt persistence, biometric login, dynamic PIN
  policy, and other backend-less controls visible but disabled/pending. No payment,
  receipt, dues, cash-entry, or defaulter source-of-truth behavior was activated.
- Removed misleading fake success actions from the relevant settings surfaces and
  corrected the admin profile to show the real session role.
- Corrected two integration findings found during browser verification: ambiguous
  admin-role joins after the new audit relationship, and the legacy
  `special_events.start_date` / `end_date` column names.
- Resolved the repository's complete ESLint error baseline without changing payment
  behavior; remaining lint output is warning-only.

Database:
- Applied forward-only migrations `031_member_invitation_template_and_resend_hardening.sql`,
  `032_admin_member_promotion.sql`, and
  `033_non_payment_settings_support_events.sql` to the linked unit database.
- Privileged mutation RPCs are service-role-only and also enforce the requesting
  admin's real settings-management permission inside the database transaction.
- Raw member/admin codes and rendered WhatsApp messages are excluded from tables,
  audit rows, application logs, and browser storage. The portal does not claim
  WhatsApp sent/opened/delivered status without a provider callback.
- Admin deactivation and member removal retain soft-delete semantics. Last-active
  Super Admin and self-lockout guards are enforced transactionally.

Verification:
- `npx tsc --noEmit` passed.
- `npx eslint . --quiet` passed with zero errors.
- `npm run build` passed under Next.js `16.2.10`; all new settings/admin/event/support
  APIs were emitted as dynamic routes.
- `git diff --check` passed; only Windows line-ending normalization notices remain.
- Linked migration parity is exact through `033` and linked database lint reports no
  schema errors.
- Authenticated localhost production smoke tests confirmed real Super Admin role,
  real admin rows, editable persisted invitation template, empty real support/event
  states, real unit settings, existing-member admin search, and member invitation
  controls. Tests were read-only and did not mutate unit records.
- Wired-path scans found no Admin Users, Support Contacts, Special Events, or member
  invitation mock references and no direct Supabase adapter imports in UI components
  or Route Handlers.

Deferred by product-owner instruction:
- Payment integration and every behavior that would create or change payment,
  receipt, dues, cash-entry, defaulter, or payment-report records.
- Unit logo and receipt-asset storage, dynamic authentication-policy enforcement, and
  biometric authentication remain explicitly disabled rather than simulated.

## Codex - Member Payment Visibility Gate - 2026-07-20

Completed:
- Hid the member Payments navigation entry on desktop and mobile for the initial
  client-testing phase.
- Hid the member dashboard Pay Now action and payment-history `View all` entry.
- Added route-level redirects from `/member/payments` and member-originated
  `/pay?source=member` requests back to `/member/dashboard`.
- Preserved every payment page, component, backend layer, migration, and database
  structure behind the single `MEMBER_PAYMENTS_ENABLED` phase flag.
- Recorded the next-phase enablement checklist separately in
  `MEMBER_PAYMENT_VISIBILITY_GATE.md` so the payment experience can be restored
  without losing or rebuilding the approved UI.

Scope:
- Public and Admin payment surfaces were not changed by this visibility gate.
- No payment record or Supabase schema was changed.

## Codex - Malayalam Member Invitation Default - 2026-07-20

Completed:
- Replaced the legacy member invitation copy with the approved Arabic/Malayalam
  information-collection message while preserving dynamic phone and PIN values.
- Added the deployment-aware `{loginUrl}` placeholder. The server resolves it from
  `APP_BASE_URL`, Vercel deployment variables, or localhost during development.
- Updated the editable Admin Settings preview and database validation to support
  `{name}`, `{phone}`, `{pin}`, and `{loginUrl}`.
- Corrected the duplicate pending `033` migration number before deployment.
- Rejected the pending raw reusable-PIN storage design during pre-deployment audit
  and replaced it with AES-256 encrypted-at-rest storage plus a permission-checked
  server-only retrieval RPC. The member login hash remains the authentication source
  of truth, and raw PIN columns are not present in the database.
- Applied remote migrations `034_member_invitation_default_message.sql` and
  `035_encrypted_reusable_member_invitation_pins.sql` to the linked Supabase project.

Verification:
- Local TypeScript and targeted ESLint checks pass with zero errors.
- Remote migration history is synchronized through version `035`.
- Remote database lint reports no schema errors.
- Remote read-only checks confirm the approved template placeholders, encrypted PIN
  column availability, and absence of a raw `pin` column.

## Codex - First-Login Member Profile Completion - 2026-07-20

Completed:
- Added a mandatory `/member/complete-profile` journey for members whose profile is
  not yet complete. Login responses now route incomplete members there before the
  dashboard.
- Added a member route shell that prevents direct navigation to dashboard, directory,
  profile, or other member pages until profile completion is recorded.
- Displays the admin-established member name and phone as read-only identity fields.
- Reuses the current profile data model for required age, blood group, WhatsApp,
  occupation, and address collection; existing values are prefilled.
- Added a dedicated API/service/repository path for profile completion. UI remains
  isolated from Supabase.
- Added `profile_completed_at` as the durable completion marker, with safe backfill
  only for existing records that already contain every required field.
- Added database-side required-field validation, audit logging, active-member checks,
  and prevention of clearing required fields after completion.
- Applied remote migration `036_member_profile_completion.sql`.

Verification:
- TypeScript and targeted ESLint checks pass.
- Remote migration history is synchronized through version `036` and database lint
  reports no schema errors.
- In-app browser verification confirmed the current incomplete member is redirected
  from `/member/dashboard` to `/member/complete-profile`, name/phone are read-only,
  existing values are prefilled, and no browser console errors are present.

## Codex - Admin Members Performance Pass - 2026-07-22

Completed:
- Replaced the Admin Members page's full-directory download and browser-only
  filtering with 20-row server-side pagination, validated search/filter/sort query
  parameters, and stale-request cancellation.
- Added a 300 ms search debounce, previous/next controls, retained-data refresh
  behavior, table/card loading skeletons, an empty result state, and retry handling
  without changing the approved member row/card design.
- Replaced the members-list `select("*")` query with an explicit safe projection that
  excludes authentication hashes, encrypted invitation PIN material, and detail-only
  profile fields.
- Added the service-role-only `resolve_app_session_context` RPC to resolve the app
  session, active actor, role, permissions, profile-completion state, expiry, and
  conditional ten-minute last-seen update in one database round trip.
- Permission checks now reuse the permissions verified by session resolution, while
  preserving the existing repository fallback for non-request service contexts.
- Added safe request/session/permission/query timing logs containing no tokens, PINs,
  phone numbers, member data, or Supabase secrets.

Database:
- Applied forward-only migrations `037_admin_members_performance.sql` and
  `038_session_last_seen_after_actor_validation.sql` to the linked staging Supabase
  project. The follow-up keeps last-seen updates strictly after active-actor checks.
- Added `(status, created_at DESC)` and `(blood_group, created_at DESC)` member indexes.
- Revoked the consolidated session RPC from `PUBLIC`, `anon`, and `authenticated`;
  only `service_role` can execute it.

Verification:
- `npx tsc --noEmit`, targeted ESLint, full production build, migration dry-run, and
  linked database lint passed.
- Authenticated localhost smoke testing confirmed the two real members load, loading
  skeletons render, pagination metadata is correct, and debounced server search for
  `Farhan` returns exactly one real member.
- Timing evidence confirms a normal members request now uses one session-context RPC
  plus one member query. The permission check is in-memory and measured at 0 ms.
- Local remote-database timings were approximately 0.74-0.87 seconds per members API
  request; Vercel Preview p95 still needs measurement after deployment because local
  network distance is the dominant remaining cost.
