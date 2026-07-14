# Phase 7 Technical Plan: Phone + Generated Code Authentication

## 1. Product decision

The product owner has chosen to keep the existing login experience:

- Member: phone number + 4-digit admin-issued PIN.
- Admin: phone number + code/PIN generated or reset from the admin panel.
- No Supabase Auth phone OTP, email OTP, passwordless flow, or browser Supabase client.
- No visual, layout, spacing, or Malayalam-text changes.

This is a deliberate simplification of the stronger-admin-auth recommendation in
`Backend_Architecture_Supabase_Plan.md`. The compensating controls in this plan are
mandatory: raw codes are never stored, all verification happens on the server, and
the browser receives only an opaque session cookie.

Phase 7 creates the authentication/session foundation. It does not wire the existing
mock UI yet; UI replacement is a later, separately reviewed step.

## 2. Required preflight

Before implementation, Gemini must re-read:

1. `AGENTS.md`
2. `UI_PLAN_V2.md`
3. `Architecture_Plan.md`
4. `Backend_Architecture_Supabase_Plan.md`
5. `BACKEND_PROGRESS.md`
6. This plan

The installed Next.js 16.2.10 documentation must be followed:

- `cookies()` is asynchronous.
- Cookies are set/deleted only in Route Handlers or Server Functions.
- `proxy.ts` is the Next.js 16 convention; Proxy is only an optimistic check and
  must never be the only authorization layer.

## 3. Runtime flow

```text
Login form
  -> Route Handler
    -> Auth service
      -> Auth repository interface
        -> Supabase adapter / security-definer RPC
          -> members/admin_users + auth_sessions + auth_login_attempts
  <- safe session DTO
  -> Route Handler sets HttpOnly session cookie

Protected Route Handler
  -> request context
    -> session resolver
      -> hashed cookie lookup
        -> active member/admin + permissions
  -> ActorContext
  -> existing service layer
```

No component, page, or route handler may call Supabase directly. The service-role
client remains confined to the existing adapter layer.

## 4. Database migration

Create a new forward-only migration:

```text
supabase/migrations/015_auth_sessions.sql
```

Do not rewrite migrations `001` through `014`.

### `auth_sessions`

Required fields:

- `id uuid primary key default gen_random_uuid()`
- `session_token_hash text unique not null`
- `actor_type text check (actor_type in ('member','admin')) not null`
- `member_id uuid references members(id) on delete cascade`
- `admin_id uuid references admin_users(id) on delete cascade`
- `expires_at timestamptz not null` (long-lived persistent session; not an idle timeout)
- `last_seen_at timestamptz not null default now()`
- `revoked_at timestamptz`
- `ip inet` (optional metadata only)
- `device text` (sanitized user-agent metadata only)
- `created_at timestamptz not null default now()`

Add a check that exactly one of `member_id` and `admin_id` is set, matching
`actor_type`. Add indexes for `session_token_hash`, `member_id`, `admin_id`, and
non-revoked expiry lookups.

### `auth_login_attempts`

Use one row per actor kind and normalized phone:

- `id uuid primary key default gen_random_uuid()`
- `actor_type text check (actor_type in ('member','admin')) not null`
- `phone text not null`
- `failed_count integer not null default 0`
- `locked_until timestamptz`
- `last_failed_at timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Unique `(actor_type, phone)`. The initial policy is five failed attempts followed
by a 15-minute lockout, with a successful login resetting the counter. Constants
must live in the service/RPC contract, not in the UI.

### RPC and privilege rules

Add narrowly scoped security-definer functions for:

- member PIN verification and attempt/lockout update;
- session creation, lookup, touch, and revocation where atomicity is needed.

Use `pgcrypto` `crypt()`/`gen_salt()` for PIN/code hashes. The RPC must compare the
submitted code to `pin_hash`; it must never return `pin_hash` or the submitted code.
Set a fixed `search_path`, revoke execution from `PUBLIC`, `anon`, and
`authenticated`, and grant only the backend role required by the adapter.

Add the matching grants in a new privilege migration section. RLS must deny direct
client access to both auth tables; the server adapter is the only access path.

## 5. Contracts and DTOs

Create or extend contracts under `src/lib/backend/contracts/`:

- `AuthRepository`: verify member code, find active admin/member identity, create/
  resolve/revoke session, record attempts.
- `AuthService`: `loginMember`, `loginAdmin`, `getCurrentActor`, and `logout`.
- `SessionDTO`: actor kind, app-level actor ID, safe display name, expiry only.

The submitted values are never included in DTOs, logs, errors, or `BackendResult`
metadata. `ActorContext` is built only after the session repository resolves the
cookie hash. Client-provided actor IDs, roles, permissions, or `actorType` are
ignored.

The existing optional `verifyAdminCredential` escape hatch in
`adminAuthService.ts` must not remain as a path that accepts any active admin. Admin
login must always verify the submitted generated code through the repository/RPC.

## 6. Services and adapters

Create:

```text
src/lib/backend/services/authService.ts
src/lib/backend/adapters/supabase/repositories/supabaseAuthRepository.ts
src/lib/backend/adapters/supabase/mappers/auth.mapper.ts
```

Responsibilities:

- Normalize and validate Indian phone numbers using existing validation helpers.
- Validate member PINs as exactly four digits.
- Validate admin generated codes using the agreed server contract (four to eight
  numeric digits; do not silently accept arbitrary strings).
- Reject inactive/blocked members and inactive/deleted admins with safe auth errors.
- Enforce attempt lockout before checking the stored hash.
- Generate at least 32 cryptographically random bytes for the raw session token,
  hash it with SHA-256 before persistence, and return the raw token only to the
  Route Handler for the cookie write.
- Resolve the session on every protected request and check expiry, revocation, and
  current active status.
- Touch `last_seen_at` without allowing a metrics failure to bypass authorization.
- Revoke the current session on logout.

Do not fetch raw `pin_hash` into UI code. Prefer a single server-side RPC that
performs the comparison and returns only the app identity needed to create a
session.

## 7. HTTP routes

Create these Route Handlers. Each route returns the existing `BackendResult` shape,
uses the request ID helper, and sets `Cache-Control: private, no-store`.

```text
POST /api/v1/auth/member/login
POST /api/v1/auth/admin/login
GET  /api/v1/auth/session
POST /api/v1/auth/logout
```

Request bodies:

```ts
// member
{ phone: string; pin: string }

// admin
{ phone: string; code: string }
```

Rules:

- Do not accept a session token in JSON, query parameters, or a custom actor header.
- Set one opaque cookie, for example `ssf_session`.
- Cookie attributes: `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` in production,
  and a persistent `Max-Age` (the browser must remain logged in after closing and
  reopening it). The session is not automatically logged out during normal use.
- Logout is the normal way to end a session. Server-side revocation also occurs if
  the account is disabled, the admin resets/revokes the code, or an administrator
  explicitly revokes sessions. These are required recovery controls, not normal
  idle expiry.
- Login success returns only a safe session/actor DTO; never return the raw token.
- Invalid credentials, inactive identity, and locked attempts must not disclose
  whether a phone number exists. `TOO_MANY_ATTEMPTS` maps to HTTP 429.
- Logout clears the cookie in the Route Handler even when the server session is
  already missing or expired.
- `GET /api/v1/auth/session` resolves the cookie server-side and returns `401` when
  absent, expired, revoked, or inactive.

No `proxy.ts` guard is activated in this phase if it would interfere with the
currently mocked dashboard. A future UI-wiring phase may add an optimistic Proxy
redirect, but every API/action will still resolve and authorize the session itself.

## 8. Actor resolution and authorization

Create:

```text
src/lib/backend/auth/sessionCookie.ts
src/lib/backend/auth/resolveActor.ts
src/lib/backend/composition/authService.server.ts
```

`resolveActor(request)` must:

1. Read the cookie with async `cookies()` in the Route Handler boundary.
2. Hash the opaque value immediately.
3. Resolve the session through `AuthService`/`AuthRepository`.
4. Re-check current member/admin status.
5. Return an `ActorContext` containing only the app-level member/admin ID, actor
   type, request ID, and sanitized request metadata.

Existing protected services must receive this server-derived actor. A route is not
complete if it trusts an ID supplied by the browser.

## 9. Explicit non-scope

- No UI layout, color, spacing, typography, Malayalam, or copy changes.
- No removal of `MOCK_ADMIN_USERS` or mock member data yet.
- No admin PIN-generation/reset UI route; the existing admin panel remains the
  future issuer, with a later audited mutation endpoint.
- No Supabase Auth OTP/passwordless integration.
- No browser Supabase client or `@supabase/ssr` dependency.
- No payment, receipt, settings, reports, notification, or storage changes.
- No direct RLS policy redesign outside the new auth tables.

## 10. Verification matrix

Static:

- `npx.cmd tsc --noEmit`
- targeted lint for all Phase 7 files
- `npm.cmd run build`
- scan for raw PIN/code logging, service-role imports outside adapters, direct
  Supabase calls in routes, and UI/Malayalam file changes.

Behavior:

1. Valid member phone + PIN creates a session cookie and safe actor DTO.
2. Invalid member PIN increments attempts without revealing member existence.
3. Five failed attempts produce `429`; lockout expires after the configured window.
4. Inactive/blocked member is denied.
5. Valid admin phone + generated code creates an admin session.
6. Invalid admin code is denied and rate-limited.
7. Inactive admin is denied even if the code is correct.
8. Missing, expired, revoked, or tampered cookie returns `401`.
9. Closing/reopening the browser preserves the session; logout revokes the server
   session and clears the browser cookie.
10. Actor resolution ignores forged `memberId`, `adminId`, role, permission, and
    actor-type inputs.
11. Raw PINs/codes/session tokens never appear in response bodies, logs, or DB rows.
12. Session responses are private and never cached.

For database integration, use a disposable/local Supabase project or an explicitly
approved test unit. Do not insert test identities or codes into an unidentified
remote project.

## 11. Definition of done

Phase 7 passes when:

- Both phone + generated-code flows are server-verified through the required
  Route Handler -> Service -> Repository -> Adapter -> Supabase path.
- Codes are hashed and never stored in plaintext.
- Sessions use opaque hashed tokens and secure cookie attributes.
- Lockout, inactive-account checks, expiry, revocation, and server-derived
  `ActorContext` are covered by tests.
- The optional-admin-verification bypass is removed.
- No UI or Malayalam files changed.
- TypeScript, production build, and Phase 7 targeted lint pass.
- `BACKEND_PROGRESS.md` records exact evidence and any full-lint baseline issues
  without claiming a false global lint pass.

## 12. Handoff to Phase 8

Phase 8 may wire the existing login forms to these routes and replace mock identity
state. It must preserve the approved UI. The admin panel's code generation/reset
operation must be implemented and audited before production admin accounts can be
provisioned; Phase 7 only consumes already-issued codes.
