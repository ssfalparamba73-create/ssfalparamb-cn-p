# Phase 8 UI Integration and Mock Removal Plan

Status: Planner document only. No UI implementation is authorized by this document.

Roles:

- Codex: Planner and reviewer
- Gemini: Implementer
- Product owner: Approval authority for any visual or product-behavior conflict

## 1. Objective

Connect the existing public, member, and admin UI to the approved backend through HTTP route handlers and frontend API facades. Replace mock identity and mock data only after the equivalent backend flow is working and tested.

The existing visual presentation is the fixed product baseline. Phase 8 changes data sources and event handlers behind the UI; it does not redesign the UI.

## 2. Mandatory Gates Before Implementation

Gemini must confirm all gates before changing UI-facing files:

1. Phase 7 staging auth smoke tests pass using the Vercel deployment-protection bypass mechanism or an authenticated staging session.
2. Staging Supabase migrations `001` through `015` are applied successfully.
3. Staging contains a disposable test member and test admin with hashed credentials.
4. Vercel staging environment variables are configured without committing secrets:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
5. `npx.cmd tsc --noEmit` passes before implementation.
6. The current UI baseline is recorded so that screenshots or visual comparison can prove no visual drift.

If a gate fails, stop at the gate and report the blocker. Do not add mock fallbacks that hide a backend failure.

## 3. Non-Negotiable UI Preservation Contract

The following must remain visually and textually identical:

- Layout, colors, spacing, typography, icons, shadows, borders, radius, cards, tables, forms, drawers, modals, charts, and navigation.
- Malayalam and English display text.
- Existing routes, responsive behavior, page hierarchy, and landing page visuals.
- Public, member, and admin visual composition.

Allowed changes are limited to:

- Replacing mock imports with API/service calls.
- Adding event handlers to existing controls.
- Adding loading, error, empty, and disabled behavior through existing UI primitives without changing composition.
- Adding route handlers, server compositions, DTO-preserving client facades, and tests.
- Deleting unused mock declarations only after parity approval.

Forbidden:

- Direct Supabase imports from pages, components, contexts, or browser API helpers.
- Service-role keys in browser code.
- Direct database queries from UI code.
- New visual components when an existing component can represent the state.
- Silent fallback to mock data after an API error.

## 4. Required Data Flow

Every connected feature must follow this path:

```text
Existing UI component
  -> frontend API facade using fetch
  -> /api/v1 route handler
  -> request context and server actor resolution
  -> service contract
  -> repository contract
  -> Supabase adapter
  -> Supabase table/RPC with RLS
  -> BackendResult<T>
  -> frontend API facade
  -> existing component state update
```

The browser must receive only DTOs and safe `BackendResult` data. Raw Supabase errors, service-role credentials, raw receipt tokens after their one-time handoff, and database rows must never reach the UI.

## 5. Source of Truth Rules

- Persistent member, payment, receipt, admin, audit, and settings data: Supabase tables through repositories.
- Authenticated identity: server-resolved session and app-level member/admin IDs.
- Form input before submission: component local state only.
- Loading/error state: component local state or existing context only.
- Cache: optional optimization, never authoritative, and invalidated after mutations.
- URL parameters: routing inputs only; never authoritative for amount, status, identity, or receipt data.
- `src/lib/admin/mock-data.ts`: temporary migration scaffolding only; it is not a fallback source after a module is connected.

## 6. Client-Side Integration Boundary

Create small browser-safe API facades. They may use `fetch`, DTO types, and `BackendResult`; they must not import Supabase, repositories, services, server compositions, or Next.js server-only APIs.

Proposed files:

```text
src/lib/frontend-api/
  httpClient.ts
  authClient.ts
  memberClient.ts
  paymentClient.ts
  receiptClient.ts
  adminClient.ts
```

Responsibilities:

- `httpClient.ts`: JSON request, request ID propagation, safe response parsing, and predictable error conversion.
- `authClient.ts`: member/admin login, current session, logout.
- `memberClient.ts`: dashboard, profile, profile update, directory, member payments.
- `paymentClient.ts`: public payment intent, member payment history, admin cash entry and status actions where appropriate.
- `receiptClient.ts`: tokenized receipt fetch and receipt navigation helpers.
- `adminClient.ts`: dashboard, members, payments, audit logs, donors, events, reports, and settings only as endpoints become available.

Do not make a client facade return mock data when the server responds with an error. Return the server `BackendResult` and let the existing page state show the appropriate error state.

## 7. Server Route and Composition Plan

All routes must use the existing request-context and response helpers. Each route must resolve the actor on the server and pass it to the service. No route may trust a member ID, admin ID, role, amount, or status supplied by the browser.

### 7.1 Existing Auth Routes to Wire

Existing routes:

- `src/app/api/v1/auth/member/login/route.ts`
- `src/app/api/v1/auth/admin/login/route.ts`
- `src/app/api/v1/auth/session/route.ts`
- `src/app/api/v1/auth/logout/route.ts`

Existing compositions:

- `src/lib/backend/composition/authService.server.ts`

Wire the existing login forms to these routes. The current four-digit input may be passed as the approved member PIN/admin code without changing the existing visual text or layout. Do not reintroduce a fake OTP verification implementation.

### 7.2 Member Routes

Create server compositions and route handlers using `memberService`, `paymentService`, and the existing repositories:

- `GET /api/v1/member/dashboard`
- `GET /api/v1/member/profile`
- `PATCH /api/v1/member/profile`
- `GET /api/v1/member/payments`
- `GET /api/v1/member/directory`

Proposed files:

- `src/lib/backend/composition/memberService.server.ts`
- `src/lib/backend/composition/paymentService.server.ts`
- `src/app/api/v1/member/dashboard/route.ts`
- `src/app/api/v1/member/profile/route.ts`
- `src/app/api/v1/member/payments/route.ts`
- `src/app/api/v1/member/directory/route.ts`

The member service must derive the member ID from the session actor. A member may never request another member's profile or payment history by changing a URL or request body.

### 7.3 Admin Routes

Create server compositions and route handlers using `adminAuthService`, `adminDashboardService`, `adminMemberService`, `adminPaymentService`, and `auditService`:

- `GET /api/v1/admin/session`
- `GET /api/v1/admin/dashboard`
- `GET /api/v1/admin/members`
- `POST /api/v1/admin/members`
- `GET /api/v1/admin/members/[id]`
- `PATCH /api/v1/admin/members/[id]`
- `DELETE /api/v1/admin/members/[id]` (soft delete only)
- `GET /api/v1/admin/payments`
- `POST /api/v1/admin/payments/[id]/approve`
- `POST /api/v1/admin/payments/[id]/reject`
- `POST /api/v1/admin/payments/[id]/cancel`
- `POST /api/v1/admin/cash-entry`
- `GET /api/v1/admin/audit-log`

Proposed composition and route files:

- `src/lib/backend/composition/adminAuthService.server.ts`
- `src/lib/backend/composition/adminDashboardService.server.ts`
- `src/lib/backend/composition/adminMemberService.server.ts`
- `src/lib/backend/composition/adminPaymentService.server.ts`
- `src/lib/backend/composition/auditService.server.ts`
- `src/app/api/v1/admin/session/route.ts`
- `src/app/api/v1/admin/dashboard/route.ts`
- `src/app/api/v1/admin/members/route.ts`
- `src/app/api/v1/admin/members/[id]/route.ts`
- `src/app/api/v1/admin/payments/route.ts`
- `src/app/api/v1/admin/payments/[id]/approve/route.ts`
- `src/app/api/v1/admin/payments/[id]/reject/route.ts`
- `src/app/api/v1/admin/payments/[id]/cancel/route.ts`
- `src/app/api/v1/admin/cash-entry/route.ts`
- `src/app/api/v1/admin/audit-log/route.ts`

Every admin route must enforce a named permission through `adminAuthService`. A client-supplied role or permission is never trusted.

### 7.4 Public Payment and Receipt Routes

Existing receipt route:

- `src/app/api/v1/receipts/[receiptId]/route.ts`

Required public payment route:

- `POST /api/v1/public/payment-intents`

Before wiring `/pay`, confirm that the payment intent flow returns a safe one-time receipt URL/token contract. The raw receipt token may be returned only for the initial redirect and must never be stored or returned by later reads. If the current service contract cannot provide this safely, extend the contract/repository/composition first and stop UI wiring until reviewed.

Do not trust amount, member identity, event amount, or payment status from the browser. The server resolves and validates these values.

## 8. UI Wiring Order

### Step 0: Auth and Session

Files to integrate:

- `src/app/login/page.tsx`
- `src/components/auth/InlineLoginForm.tsx`
- `src/app/admin/login/page.tsx`
- `src/lib/admin/AuthContext.tsx`
- `src/app/member/layout.tsx`
- `src/app/admin/layout.tsx`

Requirements:

- Remove default `MOCK_ADMIN_USERS` identity from `AuthContext`.
- Bootstrap session from `/api/v1/auth/session` on provider/layout mount.
- Login calls the existing auth routes and preserves current redirect behavior.
- Logout calls the existing logout route and clears local identity state.
- Unauthorized API responses trigger the existing login/redirect behavior without a visual redesign.
- Do not store the raw session token in localStorage, React state, or query parameters.

### Step 1: Read-Only Member Flow

Wire:

- `src/app/member/dashboard/page.tsx`
- `src/app/member/payments/page.tsx`
- `src/app/member/profile/page.tsx`
- `src/app/member/directory/page.tsx`
- `src/components/dashboard/RecentActivityCard.tsx`
- `src/components/profile/ContactAdminsDrawer.tsx`

Replace local mock values with DTO data while preserving existing props and visual components. Use existing loading/error/empty primitives and keep layout dimensions stable.

### Step 2: Read-Only Admin Flow

Replace the mock internals of `src/lib/admin/api.ts` with calls to the approved admin client facade only after the corresponding routes exist.

Wire:

- `src/app/admin/dashboard/page.tsx`
- `src/components/admin/dashboard/*`
- `src/app/admin/members/page.tsx`
- `src/app/admin/members/[id]/page.tsx`
- `src/app/admin/payments/page.tsx`
- `src/app/admin/payments/[id]/page.tsx`
- `src/app/admin/audit-log/page.tsx`
- `src/app/admin/reports/page.tsx` only when a report endpoint exists

Do not leave per-component imports from `src/lib/admin/mock-data.ts` after a module is connected.

### Step 3: Member Profile and Admin Member Writes

Wire existing form submit handlers to:

- `PATCH /api/v1/member/profile`
- `POST /api/v1/admin/members`
- `PATCH /api/v1/admin/members/[id]`
- soft delete endpoint

Use the existing validation schemas on the server. Client validation may improve feedback but cannot replace server validation.

### Step 4: Payment and Cash Entry

Wire:

- `src/app/pay/page.tsx`
- `src/app/success/page.tsx`
- `src/app/receipt/[id]/page.tsx`
- `src/components/admin/cash-entry/CashEntryForm.tsx`
- admin payment transition controls

Requirements:

- Use server-calculated amounts and settings.
- Preserve flexible admin-configured special-event and cash minimums.
- Use the linked payment row as the unified ledger for cash entry.
- Keep receipt IDs and one-time receipt token behavior consistent with Phase 5.
- Never show success based only on a client button click; require a confirmed `BackendResult`.
- Prevent duplicate submits with existing loading controls and server-side idempotency where defined.

### Step 5: Remaining Admin Modules

The following current mocks do not yet have a complete approved service/contract/route path and must not be silently wired directly to Supabase:

- Blood donors
- Special events
- Reports and exports
- Support contacts/settings
- Admin user management
- Notifications/support requests

For each module, Gemini must first add or use the repository, DTO, validation, service, adapter, and route contract under `src/lib/backend/`. Then wire the existing UI. If the module is outside the current approved backend scope, leave its mock in place and document the reason instead of creating an unreviewed direct query.

## 9. Mock Removal Policy

Remove mock code only per module:

1. Backend route exists and is protected correctly.
2. DTO shape matches existing component expectations.
3. Staging endpoint test passes for success, validation, auth, permission, empty, and server error cases.
4. Existing UI page works with real data.
5. Codex approves parity and security.
6. Only then remove the module's unused mock declarations/imports.

Do not delete `src/lib/admin/mock-data.ts` globally until every consumer is removed and all modules have parity approval.

## 10. Error, Loading, and Empty State Contract

All connected pages must handle:

- Initial loading without layout shift.
- Empty result after filters/search.
- Validation errors at the existing form level or field level.
- `401` session expiry with the existing navigation behavior.
- `403` permission denial without exposing policy details.
- `404` not found using the existing empty/not-found state.
- `409` conflicts such as duplicate phone or already-transitioned payment.
- `429` lockout/rate limit with a calm retry message.
- `500` safe server error with request ID for support/debugging.

The UI must never display raw Supabase error messages or stack traces.

## 11. Testing and Verification Plan

### Static checks

- `npx.cmd tsc --noEmit`
- Targeted ESLint for all changed files
- Search changed UI files for `supabase` imports and service-role references
- Search connected modules for direct `mock-data` imports

### Auth checks

- Member login success and failure
- Admin login success and failure
- Session restore after reload/browser reopen
- Logout and revoked session
- Invalid/expired session
- Five-attempt lockout
- Member cannot access admin routes
- Admin permission denial is enforced server-side

### Data-flow checks

- Member dashboard/profile/payment history returns only the session member's data.
- Directory returns only the safe directory DTO.
- Admin list/detail filters and pagination work.
- Cash entry creates a linked payment and returns a non-null `paymentId`.
- Payment success requires a server-confirmed response.
- Receipt access requires a valid token and rejects invalid/expired tokens.
- Duplicate writes do not create duplicate receipts or ledger rows.

### UI preservation checks

- Compare public, member, and admin screenshots before and after wiring.
- Check desktop, tablet, and mobile breakpoints.
- Verify Malayalam text, routes, layout dimensions, colors, typography, and icons are unchanged.
- Confirm no UI file was changed solely to redesign or restyle a screen.

## 12. Gemini Handoff Instructions

Gemini must implement in the following order and report after each step:

1. Pass staging/auth gates.
2. Create server compositions and route handlers for the already-approved services.
3. Create browser-safe API facades.
4. Wire authentication/session identity.
5. Wire member read flows.
6. Wire admin read flows.
7. Wire approved writes and payment/receipt flows.
8. Handle remaining modules only when their backend contracts exist.
9. Remove mocks module-by-module after tests pass.
10. Update `BACKEND_PROGRESS.md` with the exact files created/modified and test results.

Gemini must not modify visual styling, Malayalam text, layout hierarchy, routes, or responsive behavior. Gemini must stop and report any missing backend contract instead of bypassing the architecture.

## 13. Codex Review Checklist

- No unauthorized UI redesign or text changes.
- No Supabase imports outside server adapters/compositions/routes.
- No service-role key in client bundles.
- No direct mock fallback after a connected API failure.
- All routes use `BackendResult` and request tracing.
- All protected routes resolve the actor server-side.
- RLS and service permission checks remain authoritative.
- DTOs preserve existing component data shapes.
- Amounts, statuses, receipt IDs, and identities are server-authoritative.
- Raw receipt tokens are never persisted or exposed on later reads.
- `BACKEND_PROGRESS.md` is updated.
- `npx.cmd tsc --noEmit` passes.
- Targeted lint and staging flow tests pass.

## 14. Phase 8 Completion Criteria

Phase 8 is complete only when:

- Phase 7 staging auth is verified.
- Authenticated session state replaces hardcoded mock identity.
- Approved public/member/admin modules use the Repository -> Service -> Adapter path through route handlers.
- Connected modules have no direct mock imports or silent mock fallbacks.
- Payment and receipt flows require confirmed backend responses.
- Error, loading, empty, permission, and session-expiry states are handled.
- UI screenshot and responsive parity is confirmed.
- TypeScript and targeted lint pass.
- Codex completes the review and the progress ledger records the final handoff.
