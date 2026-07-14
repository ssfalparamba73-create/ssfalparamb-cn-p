# Phase 6 Technical Plan: Server Integration Foundation and Tokenized Receipt Read

## 1. Decision

Phase 6 will establish the missing server-only integration boundary and deliver one complete, security-bounded vertical slice: tokenized public receipt retrieval.

Phase 6 will **not** broadly wire the admin/member UI or expose protected mutation endpoints. The current adapters use the Supabase service-role client, which bypasses RLS. Protected endpoints are unsafe until a real server-derived member/admin session can build `ActorContext`; client-supplied actor IDs must never be trusted.

The approved sequence is therefore:

1. Phase 6: server composition, HTTP boundary, receipt query service, and public tokenized receipt route.
2. Phase 7: authentication/session adapter and protected actor resolution.
3. Phase 8: read-only admin/member API routes and UI mock replacement, one module at a time.
4. Later phases: protected mutations, payments, settings, notifications, reports, and final mock cleanup.

This is a sequencing refinement of the broad implementation phases in `Backend_Architecture_Supabase_Plan.md`; it preserves the required layering and closes the service-role security gap before protected routes exist.

## 2. Mandatory References and Preflight

Before implementation, Gemini must re-read:

1. `AGENTS.md`
2. `UI_PLAN_V2.md`
3. `Architecture_Plan.md`
4. `Backend_Architecture_Supabase_Plan.md`
5. `BACKEND_PROGRESS.md`
6. This file

The repository currently has no `node_modules` directory. Before writing any Next.js route-handler code:

1. Run `npm ci`.
2. Read the relevant Next.js 16.2.10 guides under `node_modules/next/dist/docs/`.
3. Follow the installed version's conventions, including promised dynamic `params`, async request APIs, and Route Handler caching behavior.

Implementation may not begin if it conflicts with either master specification.

## 3. Phase 6 Goal

Create this runtime path:

```text
GET /api/v1/receipts/[receiptId]?token=...
  -> Route Handler
    -> HTTP request context + public ActorContext
      -> ReceiptService
        -> ReceiptRepository
          -> SupabaseReceiptRepository
            -> Supabase RPC/tables
  <- BackendResult<ReceiptDTO>
<- sanitized JSON response + request ID
```

The route proves the approved architecture end to end without requiring unfinished member/admin authentication and without changing the existing receipt UI.

## 4. Non-Negotiable Guardrails

- No visual or content changes to any page or component.
- No changes to Malayalam text.
- Cooper Black remains restricted to the exact text `SSF`.
- No frontend or Route Handler may import `@supabase/supabase-js` or call Supabase directly.
- All Supabase-specific code remains under `src/lib/backend/adapters/supabase/`.
- `SUPABASE_SERVICE_ROLE_KEY` remains server-only and must never use a `NEXT_PUBLIC_` prefix.
- The receipt token must never be logged, included in an error, included in response metadata, or persisted in raw form.
- The response must contain only `ReceiptDTO`, never raw database rows.
- Invalid, expired, revoked, and unknown receipt tokens must produce the same safe not-found response.
- Receipt responses must not be cached.
- Do not accept `memberId`, `adminId`, `actorType`, roles, or permissions from query parameters, headers, or JSON bodies.
- Do not add admin/member route handlers in this phase.
- Do not remove mocks in this phase.

## 5. Current Integration Findings

These findings come from the current repository and must inform implementation:

### In scope for Phase 6

- There is no `src/app/api/**` transport layer.
- There is no server composition root connecting services to Supabase repositories.
- Receipt querying is currently embedded in `paymentService`, whose constructor also requires unrelated payment-minimum providers.
- `SupabaseReceiptRepository.findByReceiptIdAndToken()` does not currently load `payment_months`, so the receipt DTO cannot reliably include covered months.
- Repository read failures currently collapse database errors and not-found results in several places. The receipt path must distinguish a safe missing/invalid token from an infrastructure failure internally while returning safe public messages.
- `.env.example` is absent from the current checkout even though the progress ledger says it was created.

### Recorded for later phases, not to be expanded into Phase 6

- Protected actor/session resolution is not implemented.
- Admin auth remains mock-based in `src/lib/admin/AuthContext.tsx`.
- Admin payment services request `payments.approve` and `payments.reject`, while seeded RBAC defines `payments.verify`.
- Several admin/member list filters are declared but not fully applied by adapters.
- Dashboard aggregation currently fills only part of `AdminDashboardStatsDTO`.
- The master backend plan describes `member_profiles`, while the current migrations fold those fields into `members`. This must be resolved before member-profile wiring; Phase 6 must not silently introduce a second profile source of truth.

These deferred findings must remain visible in the Phase 6 handoff and in the next planner review.

## 6. Scope and File Plan

### 6.1 Receipt contract and service separation

Create:

```text
src/lib/backend/services/receiptService.ts
```

Modify:

```text
src/lib/backend/contracts/payment.contract.ts
src/lib/backend/services/paymentService.ts
```

Required design:

- Add a dedicated `ReceiptService` interface with:

```ts
getReceiptByToken(
  receiptId: string,
  token: string,
  actor: ActorContext
): Promise<BackendResult<ReceiptDTO>>;
```

- Move token validation, repository lookup, not-found normalization, and view-count behavior from `paymentService` into `receiptService`.
- Remove the receipt repository dependency from `createPaymentService` after the extraction.
- Do not duplicate receipt business logic across both services.
- Keep validation in `validation/paymentSchemas.ts` unless a later phase justifies a dedicated receipt schema file.
- Public actors are allowed only for token-authenticated reads. Token validation is the authorization boundary for this operation.
- Incrementing view count is best-effort after a successful read. A metrics failure must be recorded internally but must not convert a valid receipt into a public error.

### 6.2 Receipt adapter correction

Modify:

```text
src/lib/backend/adapters/supabase/repositories/supabaseReceiptRepository.ts
src/lib/backend/adapters/supabase/mappers/payment.mapper.ts
```

Required behavior:

- Hash the supplied token through the existing `hash_receipt_token` RPC.
- Match both `receipt_id` and `public_token_hash`.
- Enforce expiry. For Phase 6, a `NULL` expiry is denied; only a non-expired timestamp is valid.
- Load the linked payment and `payment_months` in the same logical query where practical.
- Map month labels into `ReceiptDTO.months`.
- Preserve the payment's real status; do not default a missing status to `confirmed`.
- Do not return a receipt for a missing, rejected, cancelled, or otherwise non-displayable payment unless the product policy explicitly permits that state. For Phase 6, confirmed receipts are displayable; any additional state requires an explicit test and documented decision.
- Propagate unexpected Supabase/RPC failures to the service for normalization; do not represent all database failures as `null`.
- Do not expose the stored token hash.

No migration is expected for the basic read slice. If implementation proves a schema change is necessary, stop and request planner review; do not rewrite migrations `001` through `014`.

### 6.3 Server-only composition root

Create:

```text
src/lib/backend/composition/receiptService.server.ts
```

Required behavior:

- Mark the module server-only using the installed Next.js-supported mechanism.
- Instantiate `SupabaseReceiptRepository` and inject it into `createReceiptService`.
- Export a getter/factory for the configured `ReceiptService`.
- Do not read request headers or cookies in the composition root.
- Do not create a second Supabase client implementation.
- Do not export the Supabase client or concrete repository to UI code.

The composition module must be narrowly scoped. A universal service container is deferred until more services are safely wired.

### 6.4 HTTP transport helpers

Create:

```text
src/lib/backend/http/requestContext.ts
src/lib/backend/http/backendResultResponse.ts
```

`requestContext.ts` responsibilities:

- Create a server-generated request ID with `crypto.randomUUID()`.
- If an inbound request ID is supported, accept only a tightly validated UUID; otherwise replace it.
- Build the public `ActorContext` for this route:

```ts
{
  actorType: "public",
  requestId,
  device?: sanitizedUserAgent
}
```

- Do not trust forwarded IP headers unless the deployment proxy trust model has been documented. It is acceptable to omit `ip` in Phase 6.
- Never include the receipt token in the context or logs.

`backendResultResponse.ts` responsibilities:

- Convert `BackendResult<T>` to a JSON `Response` without changing the domain result type.
- Preserve the common response body shape.
- Add `X-Request-Id`.
- Add `Cache-Control: private, no-store, max-age=0`.
- Add `Referrer-Policy: no-referrer` for the tokenized receipt response.
- Do not expose error `details` publicly unless explicitly allow-listed.
- Suggested status mapping:
  - validation: `400`
  - auth: `401`
  - permission: `403`
  - not found, invalid token, expired token: `404`
  - conflict: `409`
  - rate limit: `429`
  - payment business error: `422`
  - storage/server/database: `500`
- A malformed or missing receipt token must not reveal whether the receipt ID exists.

### 6.5 Route Handler

Create:

```text
src/app/api/v1/receipts/[receiptId]/route.ts
```

Required behavior:

- Implement `GET` only.
- Use the installed Next.js 16.2.10 Route Handler signature and await promised dynamic params.
- Read `token` from `request.nextUrl.searchParams`.
- Build a public actor using `requestContext.ts`.
- Call only the configured `ReceiptService`.
- Return through `backendResultResponse.ts`.
- Do not redirect, render JSX, import a UI component, or read mock data.
- Do not add permissive CORS headers. Same-origin is the default.
- Do not place receipt tokens in logs.
- Ensure the handler is dynamically evaluated and not statically cached, following the installed Next.js documentation.

The endpoint contract is:

```text
GET /api/v1/receipts/{receiptId}?token={opaqueToken}
```

Success body:

```ts
BackendResult<ReceiptDTO>
```

Failure body:

```ts
BackendResult<null>
```

The route must never include raw Supabase error data.

### 6.6 Environment template restoration

Create or restore:

```text
.env.example
```

For Phase 6 it must document, with empty placeholder values only:

```text
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
APP_ENV=
APP_BASE_URL=
```

Do not add real secrets. Do not introduce browser-exposed Supabase variables in this phase because no browser Supabase client is approved.

## 7. Explicit Non-Scope

Do not implement any of the following in Phase 6:

- UI fetch calls or page/component edits.
- Admin/member login, cookies, middleware/proxy guards, or session persistence.
- Public payment creation or payment lookup.
- Payment approval, rejection, cancellation, or cash entry routes.
- Admin/member list endpoints.
- Support, events, donor, settings, report, notification, or export endpoints.
- Receipt creation/token issuance.
- Mock deletion.
- New visual assets.
- Rewriting historical migrations.
- A browser Supabase client.

## 8. Error and Logging Rules

- The Route Handler owns HTTP concerns; services remain unaware of HTTP status codes.
- Services return `BackendResult`; they do not throw raw errors across the service boundary.
- Repositories may throw adapter errors, which services normalize through the existing error helpers.
- Public messages remain generic and safe.
- Server logs may contain request ID, route, duration, outcome, and sanitized error code.
- Server logs must not contain token, token hash, full query string, service-role key, or raw receipt payload.
- A valid receipt read and an invalid token attempt may be counted, but security-event logging beyond existing contracts is deferred rather than improvised.

## 9. Verification Matrix

Gemini must verify all of the following:

### Static checks

```text
npx.cmd tsc --noEmit
npm.cmd run lint
npm.cmd run build
```

Also scan for:

- Supabase imports outside `src/lib/backend/adapters/supabase/`.
- `SUPABASE_SERVICE_ROLE_KEY` outside server-only backend files and environment documentation.
- receipt token logging.
- direct Supabase calls in `src/app/api/`.
- UI file changes.
- Malayalam text changes.

### Endpoint cases

1. Valid receipt ID + valid token -> `200`, `ok: true`, DTO only.
2. Valid receipt ID + wrong token -> `404`, safe generic error.
3. Unknown receipt ID + arbitrary token -> same public response shape/status as case 2.
4. Missing or blank token -> `400` validation error with no receipt lookup and no existence disclosure.
5. Expired token -> same public response as invalid token.
6. Cancelled/rejected payment -> denied according to the explicit display policy.
7. Supabase unavailable -> `500`, retryable safe error, request ID present, no raw database message.
8. Successful response includes `Cache-Control: private, no-store, max-age=0`.
9. Successful response includes `Referrer-Policy: no-referrer` and `X-Request-Id`.
10. Response never contains `public_token_hash` or the raw token.
11. `payment_months` appear as receipt month labels when present.
12. View-count failure does not hide an otherwise valid receipt.

### UI protection

`git diff --name-only` must show no files under:

```text
src/app/**/page.tsx
src/app/**/layout.tsx
src/components/**
src/app/globals.css
```

The new API Route Handler is the only allowed addition under `src/app/`.

## 10. Definition of Done

Phase 6 is complete only when:

- A dedicated receipt service exists and is covered by the common result/error pattern.
- The receipt repository returns a complete, sanitized `ReceiptDTO` and does not leak hashes.
- A server-only composition root injects the Supabase adapter.
- `GET /api/v1/receipts/[receiptId]` works through Route Handler -> Service -> Repository -> Adapter -> Supabase.
- The endpoint is no-store and includes a request ID.
- Invalid/expired tokens cannot be used to enumerate receipt existence.
- No protected admin/member endpoint has been exposed without authentication.
- No UI or Malayalam text has changed.
- TypeScript, lint, and production build pass.
- `BACKEND_PROGRESS.md` is updated with files touched, verification, and Phase 7 handoff notes.

## 11. Gemini Implementation Order

1. Install dependencies and read installed Next.js route-handler documentation.
2. Extract the receipt service contract/implementation.
3. Correct receipt repository query and mapping.
4. Add the server-only receipt composition root.
5. Add request-context and result-to-response helpers.
6. Add the tokenized receipt GET Route Handler.
7. Restore `.env.example` without secrets.
8. Run static scans and verification commands.
9. Exercise every endpoint case in the verification matrix against a disposable/local Supabase project.
10. Update `BACKEND_PROGRESS.md`.
11. Hand back to Codex for review before any Phase 7 work.

## 12. Codex Review Gate

Codex will review:

- Compliance with `UI_PLAN_V2.md`, `Architecture_Plan.md`, and `Backend_Architecture_Supabase_Plan.md`.
- Next.js 16.2.10 route-handler correctness against installed documentation.
- Supabase isolation and service-role containment.
- Receipt token hashing, expiry, anti-enumeration behavior, and no-store headers.
- DTO completeness and absence of raw database fields.
- Error normalization and request-ID propagation.
- Absence of UI changes.
- Verification evidence and `BACKEND_PROGRESS.md` entry.

Phase 7 may start only after this review passes.
