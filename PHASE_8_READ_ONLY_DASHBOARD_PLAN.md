# Phase 8 Technical Plan: Read-only Dashboard APIs and Mock Replacement

## 1. Review finding

The repository already contains parts of the backend foundation:

- `AdminDashboardService`, `MemberService.getDashboard()`, and several Supabase
  repositories exist.
- `get_dashboard_totals()` exists in the migrations.

The dashboard feature is not integrated yet:

- The only current API route is the public receipt route.
- Admin and member pages still import or define mock data.
- `src/lib/admin/api.ts` explicitly returns mock data.
- The dashboard repository currently supplies only partial totals; trend, payment
  split, paid-member, defaulter, donor, and cash-handover values are not populated.
- There is no server-derived actor/session available to protect these reads.

Therefore this phase must be implemented as a bounded read-only vertical slice. It
must begin only after Phase 7 authentication/session work is implemented and
reviewed.

## 2. Dependency order

```text
Phase 7 backend auth/session
  -> protected actor resolver
    -> dashboard read contracts and repository queries
      -> admin/member GET Route Handlers
        -> frontend API client
          -> dashboard pages/components use real responses
            -> remove dashboard-only mocks
```

The existing login forms must be wired to the Phase 7 phone + PIN/generated-code
routes before dashboard pages are switched to real data. Otherwise the new
protected endpoints would correctly return `401` for the current mock login.

## 3. Scope

### Backend read APIs

Create these protected GET endpoints:

```text
GET /api/v1/admin/dashboard
GET /api/v1/member/dashboard
```

The admin response includes the data already rendered by the approved dashboard:

- summary totals;
- collection trend;
- payment-method split;
- risk/defaulter and available-donor counts;
- recent confirmed/pending payments (safe DTO fields only);
- recent cash handovers (safe DTO fields only).

The member response includes:

- current member identity safe fields;
- pending amount and monthly amount;
- pending month labels;
- overdue flag;
- recent payment/activity items.

These are read-only queries over existing database records. No UPI, gateway,
payment-intent creation, cash-entry mutation, approval, rejection, or cancellation
belongs in this phase.

### Frontend wiring

After backend review, wire only the existing admin/member dashboard screens:

- fetch through same-origin API routes with cookies included;
- preserve the approved layout, colors, spacing, typography, icons, and text;
- preserve Cooper Black restriction and all existing Malayalam text;
- provide loading, error, and empty states using existing component patterns;
- remove only the mocks that feed these two dashboard screens.

Other pages (members list, payments list, profile, directory, donors, events,
reports, settings, and cash entry) remain out of scope until their own read/write
plans are approved.

## 4. Contract and DTO work

Add a dedicated view contract instead of overloading a payment mutation contract:

```text
src/lib/backend/contracts/dashboard.contract.ts
src/lib/backend/dto/dashboard.dto.ts
```

Suggested DTOs:

- `AdminDashboardDTO` containing `stats`, `recentPayments`, and
  `recentCashHandovers`;
- `MemberDashboardDTO` containing the existing member/due/activity sections plus
  only fields required by the current member dashboard;
- bounded `RecentPaymentDTO` and `RecentCashHandoverDTO` that never expose hashes,
  internal audit payloads, or unrelated personal data.

Keep app-level `memberId`/`adminId` values server-derived. Do not accept an ID,
role, permission, or member phone from the browser to choose the dashboard subject.

The existing `AdminDashboardStatsDTO` may be retained as the `stats` member of the
new view DTO. Any additions must be explicit and mapped from database rows/RPC
results, not filled with zero/empty fallbacks.

## 5. Service and repository design

Create or refine:

```text
src/lib/backend/services/dashboardService.ts
src/lib/backend/adapters/supabase/repositories/supabaseDashboardRepository.ts
src/lib/backend/composition/dashboardService.server.ts
```

The service must:

- require `actorType === "admin"` plus `dashboard.view` for admin reads;
- require `actorType === "member"` for member reads;
- use the member/admin ID from `ActorContext` only;
- return `BackendResult` and normalize adapter failures;
- apply bounded limits (for example, five recent dashboard items);
- avoid N+1 queries and avoid loading unrestricted raw table rows;
- return safe DTOs through dedicated mappers.

The repository may use one consistent dashboard RPC per actor kind or a small,
documented set of aggregate queries. A new migration may add a forward-only
`016_dashboard_read_queries.sql` if an RPC is needed. Do not silently modify old
migrations.

The admin query must populate every rendered field, including trend, method split,
paid-member count, defaulter count, donor count, and cash-handovers count. If a
metric cannot be defined from the current schema, stop and document the product
decision instead of returning a misleading zero.

The member query must derive pending months from `payment_months`/payment status and
recent activity from real payment records. It must not use the URL, local storage,
or a client-supplied member ID.

## 6. Route Handler rules

Each handler must follow:

```text
Route Handler
  -> request context
  -> server session/actor resolver
  -> dashboard service
  -> repository/adapter
  -> BackendResult response helper
```

Rules:

- Use Next.js 16.2.10 conventions and async `cookies()`.
- Return `401` for absent/expired/revoked sessions.
- Return `403` when an authenticated admin lacks `dashboard.view`.
- Add `X-Request-Id`, `Cache-Control: private, no-store, max-age=0`, and
  `Referrer-Policy: no-referrer`.
- Never log cookies, PINs, generated codes, or raw database rows.
- Do not add permissive CORS headers.
- Do not import Supabase or a UI component into a Route Handler.

## 7. Frontend API boundary

Create a small browser-safe client under `src/lib/api/` that only calls the API:

```text
src/lib/api/dashboardClient.ts
```

It must:

- call same-origin paths with `credentials: "include"`;
- parse the common `BackendResult<T>` shape;
- surface validation/auth/permission/server errors without leaking details;
- never import `@supabase/supabase-js`;
- never decide the actor ID or permission locally.

The page/component wiring must use this client, not `src/lib/admin/api.ts` and not
direct database calls. Existing visual components may receive real DTO data via
props; their visual design is not to be redesigned.

## 8. Mock replacement checklist

Only after the protected routes and login UI are working:

- Admin dashboard: remove `MOCK_DASHBOARD_STATS` and `MOCK_PAYMENTS` usage.
- Admin recent cash handovers: replace the mock source with the dashboard DTO.
- Member dashboard: remove `mockDueAmount`, hardcoded member name, and mock
  recent-activity source.
- Keep mock files used by other pages until those pages receive separate APIs.
- Remove any mock only after a real response, loading state, error state, and empty
  state have been verified.

## 9. Verification matrix

### Authorization

1. No cookie -> both endpoints return `401`.
2. Member cookie -> member dashboard succeeds; admin dashboard returns `403`.
3. Admin cookie with `dashboard.view` -> admin dashboard succeeds.
4. Admin cookie without permission -> admin dashboard returns `403`.
5. Forged actor IDs/query parameters do not change the resolved subject.
6. Disabled/revoked/expired session is rejected.

### Data correctness

1. Admin totals match confirmed/pending database records.
2. Trend and method split are real and consistently scoped by the documented date
   range; no placeholder empty arrays.
3. Recent payment/cash rows are bounded and mapped to safe DTOs.
4. Member dues and pending month labels match database state.
5. Member A cannot see member B's dashboard or payment activity.
6. Empty database state returns a valid empty DTO, not a mock value.

### Build and protection

- `npx.cmd tsc --noEmit`
- targeted lint for changed backend/API files
- `npm.cmd run build`
- scan for direct Supabase imports outside adapters;
- scan dashboard pages/components for removed mock references;
- verify no UI/Malayalam changes beyond approved data-wiring edits;
- production smoke-test success, `401`, `403`, server failure, and no-store headers.

Use a disposable/local Supabase project for populated-data tests. Do not insert
test identities or payments into an unidentified remote unit database.

## 10. Definition of done

This phase is complete only when:

- Phase 7 session/auth review has passed.
- Both protected dashboard APIs work through the required layers.
- Every rendered dashboard value comes from real database data or an explicitly
  documented empty state.
- The approved dashboard UI uses API DTOs instead of dashboard mocks.
- No payment creation/gateway integration has been introduced.
- No raw Supabase rows, credentials, codes, or cookies leak to the client.
- TypeScript, targeted lint, build, endpoint matrix, and UI protection checks pass.
- `BACKEND_PROGRESS.md` records exact evidence without claiming unrelated pages are
  complete.

## 11. Recommended implementation order for approval

1. Implement and review Phase 7 phone + PIN/generated-code sessions.
2. Add dashboard DTOs/contracts and reconcile the missing admin metrics.
3. Add the dashboard repository, RPC/query migration if required, and mappers.
4. Add protected admin/member dashboard Route Handlers and composition root.
5. Add the browser-safe dashboard API client.
6. Wire login forms, then wire only the two dashboard screens.
7. Remove only dashboard-specific mocks and run the verification matrix.
8. Return to Codex for review before starting other modules or payment integration.
