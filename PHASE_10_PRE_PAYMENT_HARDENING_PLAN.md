# Phase 10 Plan: Pre-Payment Non-Payment Hardening

## Objective

Finish the non-payment foundations that can be implemented truthfully and safely
before payment creation/status logic becomes the source of truth.

The approved flow remains:

```text
UI / Route Handler -> Service -> Repository Interface -> Supabase Adapter -> Database
```

No UI redesign, Malayalam change, payment mutation, dues recalculation, receipt
creation, cash entry, defaulter calculation, or report total is included.

## Included Scope

1. Fix the existing `generate_receipt_id` and `hash_receipt_token` database lint
   failures through a forward-only migration without activating payment flows.
2. Add protected member profile GET/PATCH APIs using the session-derived member ID.
3. Persist only safe member-editable profile fields; phone/login identity remains
   read-only until a verified phone-change flow exists.
4. Audit member profile changes without storing session tokens or secrets.
5. Add a protected, privacy-safe member directory API returning only directory DTOs.
6. Replace member profile and directory mock data while preserving their current UI.
7. Add a read-only public support-contact API and replace hard-coded contact data.
8. Add a protected admin audit-log read API and replace its mock rows.
9. Replace the deprecated permissive mock middleware with a Next.js 16 `proxy.ts`
   optimistic session-cookie presence check. Route Handlers remain authoritative.
10. Apply migrations only after the remote dry-run shows they are the sole pending
    migrations.

## Explicitly Excluded Until Payment Phase

- Member/admin payment history and payment detail mock replacement.
- Public payment, success, receipt creation, cash entry, approval/cancellation.
- Defaulter/reminder amounts and reports derived from incomplete payment truth.
- Event collection status or settings that affect payment calculation.
- Admin-user/role mutation and login-code management, which requires its own
  high-risk review and recovery flow.
- Profile photo storage and biometric authentication. The stored biometric flag is
  only a preference and does not claim device biometric authentication.
- Audit-log purge.

## Database Work

### `025_pre_payment_function_hardening.sql`

- Recreate `generate_receipt_id()` so every control path returns or raises.
- Recreate `hash_receipt_token(text)` with an explicit `extensions.digest` call and
  safe search path.
- Preserve service-role-only execution.

### `026_member_profile_update.sql`

- Add a service-role-only transactional `member_update_profile` RPC.
- Accept only name, WhatsApp, age, blood group, address, occupation, and biometric
  preference.
- Reject inactive/blocked/left members and missing rows.
- Write one safe audit event with before/after values excluding PIN/login secrets.

### `027_resolve_function_lint_warnings.sql`

- Remove the PL/pgSQL loop-variable shadowing warning without changing the receipt
  ID format or function signature.
- Use pgcrypto's text digest overload so `hash_receipt_token(text)` remains correctly
  classified as immutable.
- Preserve service-role-only execution for both helpers.

## APIs

- `GET/PATCH /api/v1/member/profile`
- `GET /api/v1/member/directory`
- `GET /api/v1/support/contacts`
- `GET /api/v1/admin/audit-logs`

All protected routes resolve the actor from the HttpOnly session cookie and return
the existing `BackendResult` envelope with request ID and no-store headers.

## Privacy and Security Rules

- Directory responses never include dues, PIN state/hash, sessions, alternate phone,
  address, occupation, family, or payment rows.
- Member profile PATCH cannot change phone, status, tier, dues, PIN, member code, or
  family rows.
- Support contacts expose only active contact-safe fields.
- Audit API requires `audit.view` and has no purge/mutation endpoint.
- Proxy performs only an optimistic cookie-presence redirect; service permissions and
  Route Handler session checks remain mandatory.

## Verification

- TypeScript and targeted lint.
- Production build with `proxy.ts` and all new dynamic routes.
- Missing-session mutation/read routes return `401`.
- Member/admin cross-role access is denied by services.
- Anonymous execution of the profile mutation RPC returns permission denied.
- Database lint no longer reports the two existing function errors.
- Scans find no profile/directory/support/audit mocks or direct Supabase imports in UI
  and Route Handlers.
- Remote migration ledger matches local history.

## Implementation Outcome

Phase 10 was implemented on 2026-07-19. Migrations `025` through `027` were applied
to the linked unit database, the remote ledger matches local history through `027`,
and linked database lint reports no schema errors or warnings. Protected production
page/API smoke checks and anonymous RPC-denial probes passed. Payment-derived pages
and mutations remain intentionally outside this phase.
