# Admin Members Page Performance Plan

## Status

Planning only. No implementation is authorized by this document.

Target page: `/admin/members`

Primary objective: reduce the warm authenticated members-list request from the
current six sequential Supabase round trips to a maximum of two, while preserving
the approved UI and the strict route/service/repository/adapter layering.

## Current Verified Bottlenecks

The page currently waits for browser hydration and then starts a client-side API
request. That API request performs these operations sequentially:

1. Read `auth_sessions`.
2. Read the active admin record.
3. Read the admin role.
4. Update session `last_seen_at`.
5. Read admin permissions.
6. Query members with an exact count.

The page also calls `getAllAdminMembers()`, which continues requesting pages of 100
records until the full directory is downloaded. Search, filtering, and sorting then
run only in the browser. This will become progressively slower as member count grows.

The members query uses `select("*")`, even though the list does not need every member
column. It therefore reads server-only and detail-only fields unnecessarily.

## Non-Negotiable Constraints

- Do not change layout, colors, spacing, labels, Malayalam text, or responsive
  behavior.
- Do not expose Supabase clients, table names, service-role keys, PIN hashes, or raw
  errors to UI code.
- Preserve `UI / Route Handler -> Service -> Repository -> Supabase Adapter -> Supabase`.
- Do not weaken session validation, permission checks, RLS, soft-delete behavior, or
  audit rules.
- Do not cache one admin's private member data for another admin or user.
- Do not load the entire member directory merely to support client-side filters.
- Do not implement payment-related work in this pass.

## Phase 1 — Establish a Performance Baseline

Add sanitized timing around:

- session resolution;
- permission resolution;
- member repository query;
- complete API request duration.

Log only request ID, operation name, duration, status, and safe error code. Never log
cookies, tokens, PINs, service keys, phone numbers, or member payloads.

Capture at least:

- first cold request on Vercel Preview;
- five warm requests on Vercel Preview;
- query time with no filters;
- query time with search/status/blood-group filters.

## Phase 2 — Collapse Authentication and Permission Round Trips

Create a forward-only Supabase migration containing a service-role-only RPC such as
`resolve_app_session_context`.

The RPC must, in one database transaction:

1. Resolve the hashed session token.
2. Reject revoked or expired sessions.
3. Verify the linked member/admin remains active.
4. Return actor ID, actor type, actor name, admin role, permissions, expiry, and member
   profile-completion state where applicable.
5. Update `last_seen_at` only when its current value is older than ten minutes.

Required security properties:

- `SECURITY DEFINER` with a pinned safe `search_path`.
- Execution revoked from `PUBLIC`, `anon`, and `authenticated`.
- Execution granted only to `service_role`.
- No raw session token is stored or returned; the existing SHA-256 token hash remains
  the lookup value.

Update the auth repository to use this RPC. Extend the resolved server actor context
with its verified permissions. Service permission checks must then use those verified
permissions without issuing another database request.

Expected result: session, actor, role, permission, and conditional last-seen work drops
from five sequential calls to one.

## Phase 3 — Server-Side Members Pagination and Filtering

Replace `getAllAdminMembers()` on `/admin/members` with a paginated request.

Initial request:

- page: `1`;
- page size: `20`;
- sort: `newest`.

Send these controls to the API instead of filtering the full dataset in the browser:

- search;
- status;
- blood group;
- area;
- monthly tier;
- arrears/payment status;
- approved sort option;
- page and page size.

Search input must use a 300 ms debounce. Changing a filter or sort option resets the
page to `1`. Stale in-flight responses must be ignored or cancelled so an older query
cannot overwrite a newer result.

The API must validate every filter and map sort values through a server-side allowlist.
Never forward arbitrary column names or query syntax to Supabase.

The repository must replace `select("*")` with an explicit list-only projection. It
must not select `pin_hash`, reusable PIN ciphertext, profile-completion timestamps, or
other fields unused by the table.

## Phase 4 — Database Indexes

Add a forward-only migration with the minimum indexes justified by the query:

```sql
CREATE INDEX IF NOT EXISTS idx_members_status_created_at
ON members (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_members_blood_group_created_at
ON members (blood_group, created_at DESC);
```

Before adding trigram search indexes, run `EXPLAIN (ANALYZE, BUFFERS)` against realistic
staging volume. Add `pg_trgm`/GIN indexes for name, phone, and member code only if the
measured search plan requires them. Do not add speculative indexes to the small live
database.

## Phase 5 — Improve Perceived Loading Without Redesign

Keep the existing table/card geometry and add a loading state that mirrors it:

- desktop: a small fixed number of table-row skeletons;
- mobile: matching member-card skeletons;
- keep filters and page title stable;
- keep the previous successful page visible during filter refresh where safe;
- show the existing error style with a retry action on failure.

This phase must not alter the approved empty state, fonts, spacing, colors, or member
row actions.

## Phase 6 — Optional Initial Server Fetch

After Phases 2–5 are measured, evaluate splitting the route into:

- a Server Component page that obtains the first authorized member page through the
  service layer; and
- a Client Component for interactive filters, pagination, invitation actions, and
  row navigation.

Adopt this only if measurements show the current hydration-to-fetch waterfall remains
material. Do not duplicate authentication logic or call the internal HTTP API from a
Server Component when the service layer can be called safely on the server.

## Expected Request Shape After Core Optimization

```text
Browser -> GET /api/v1/admin/members?page=1&pageSize=20
        -> Auth repository: resolve_app_session_context RPC (1 DB call)
        -> Member repository: filtered paginated member query (1 DB call)
        -> BackendResult response
```

Target: two Supabase round trips for a normal list request.

## Test Matrix

### Functional

- First page, next page, previous page, and last partial page.
- Search by name, phone, and member code.
- Every existing filter and sort option.
- Filter change resets pagination.
- Newly created/updated/soft-deleted member appears correctly.
- Invitation and detail-row actions remain unchanged.
- Desktop table and mobile cards show identical records.

### Security

- Missing, expired, revoked, member, and inactive-admin sessions are denied.
- Admin without `members.view` is denied before member data is queried/returned.
- RPC cannot be executed by public, anon, or authenticated roles.
- No PIN hash/ciphertext or unrelated private columns appear in API responses/logs.
- A response for one admin is never shared through a public/global cache.

### Performance

- Verify a maximum of two Supabase round trips for a warm list request.
- Warm API target: p95 at or below 500 ms under normal staging conditions.
- Cold Vercel request target: at or below 1.5 seconds where platform cold start permits.
- Loading structure appears promptly and does not cause layout shift.
- Test with 20, 500, and at least 5,000 synthetic staging members before considering
  the optimization complete.

## Verification Commands and Release Gate

Before deployment:

1. TypeScript check.
2. Full ESLint run with zero new errors.
3. Production build.
4. Supabase migration dry-run.
5. Apply migration to staging only.
6. Remote database lint.
7. Auth/RPC permission tests.
8. Desktop and mobile browser smoke tests.
9. Compare measured before/after timings.

Release only when functional and security tests pass and the timing report confirms a
material improvement. If the consolidated auth RPC fails, roll back the application
to the previous auth repository and leave the additive database function unused; do
not weaken authentication as a performance workaround.

## Recommended Implementation Order

1. Baseline instrumentation.
2. Consolidated session-context RPC and auth repository update.
3. Server-side pagination/filter/sort contracts and repository projection.
4. Members-page query-state integration and skeleton loading.
5. Evidence-based indexes.
6. Tests, remote lint, build, staging deployment, and measured comparison.
7. Optional Server Component initial fetch only if the remaining waterfall is still
   significant.
