# Phase 9C Plan: Member Mutations and Secure PIN Issuance

## 1. Objective

Complete the existing member-management groundwork end to end without redesigning
the approved UI and without adding payment behavior.

This phase connects:

```text
Admin Member UI
  -> protected Route Handler
    -> AdminMemberService
      -> MemberRepository interface
        -> Supabase adapter / service-role-only RPC
          -> members + family_members + auth_sessions + audit_logs
```

## 2. Verified Baseline

The following already exists and must be extended rather than duplicated:

- `AdminMemberService.createMember`, `updateMember`, and `softDeleteMember`.
- `MemberRepository.create`, `update`, and `softDelete`.
- Supabase member and family tables.
- `members.create`, `members.update`, and `members.delete` permissions.
- Protected admin member list/detail GET routes and browser clients.
- Server-managed admin/member sessions and the `verify_app_login` RPC.
- The approved Add/Edit Member form and member-detail Reset PIN action.

The current gaps are:

- No member `POST`, `PATCH`, or `DELETE` Route Handlers.
- Create/update repository methods persist only a subset of visible form fields.
- Update uses truthy checks, so valid `false`, empty optional values, and zero-like
  transitions cannot be represented safely.
- The Add/Edit form simulates success with `setTimeout`.
- The edit page still loads `MOCK_MEMBERS`.
- Family rows, joined date, donor fields, and full membership fields are not saved.
- No secure server-generated PIN issue/reset operation exists.
- Member writes are not yet audit-recorded end to end.

## 3. Scope

### Included

- Create member.
- Edit member core/membership/donor fields.
- Atomically replace the member's family-member collection when supplied.
- Soft delete by setting member status to `left`.
- Securely issue/reset a server-generated 4-digit member PIN.
- Revoke the member's existing sessions on soft delete and PIN reset.
- Audit every create, update, soft-delete, and PIN issue/reset operation.
- Replace the Add/Edit form's simulated save and edit-page mock lookup.
- Preserve the existing layout, colors, spacing, typography, labels, and responsive
  structure except where misleading OTP/manual-PIN copy must be corrected.

### Excluded

- Permanent member deletion.
- Member restoration after `left` status.
- Payment creation, cash recording, payment history, or dues recalculation.
- Profile-photo upload/storage.
- Admin notes persistence until an approved schema field/table is defined.
- Admin-user login-code generation; that is a separate reviewed slice.
- Member self-profile and directory APIs; they follow after Phase 9C.

Photo and Admin Notes controls must not claim persistence. Until their later phases,
they remain visually in place but disabled/informational and are never included in
the member mutation payload.

## 4. Contract Changes

Extend, do not replace, `member.contract.ts`.

### Family input

```ts
interface FamilyMemberInput {
  id?: string;
  name: string;
  relationship: string;
  age?: number;
  bloodGroup?: BloodGroup;
  isBloodDonor?: boolean;
  phone?: string;
}
```

### Create member input

The create command must support the approved persisted fields:

- `name`, `phone`, `alternatePhone`, `age`, `address`, `area`, `occupation`
- `status` (`active`, `inactive`, or `blocked`; never `left` on create)
- `monthlyTier`, `monthlyAmount`, `joinedAt`
- `bloodGroup`, `isBloodDonor`, `donorAvailable`
- optional `familyMembers`

`memberCode`, dues, reminder counts, timestamps, PIN hash/status, and IDs remain
server/database controlled.

### Update member input

Use explicit `undefined` checks. Empty optional strings may clear optional columns;
`false` must persist for donor flags. `left` cannot be set through PATCH; it is
reserved for the soft-delete endpoint.

If `familyMembers` is omitted, preserve the current family collection. If supplied,
validate and atomically replace it and update `family_count`.

### PIN response

```ts
interface IssuedMemberPinDTO {
  memberId: string;
  pin: string;       // returned once; never stored or logged
  issuedAt: string;
}
```

The raw PIN must not be part of `MemberDTO`, audit payloads, errors, logs, or normal
member GET responses.

## 5. Forward-only Database Migration

Create:

```text
supabase/migrations/023_member_mutations_and_pin.sql
```

Do not edit migrations `001` through `022`.

The migration must provide service-role-only transactional functions for:

1. Member create with optional family rows and audit event.
2. Member update with optional family replacement and audit event.
3. Member soft delete with session revocation and audit event.
4. Member PIN issue/reset with hash storage, session revocation, and audit event.

PIN function rules:

- Accept the server-generated raw PIN only as an RPC parameter.
- Require exactly four numeric digits.
- Store only `crypt(pin, gen_salt('bf'))` in `members.pin_hash`.
- Set `pin_status = 'issued'`.
- Revoke all active sessions for that member.
- Audit that a PIN was issued/reset without storing the raw PIN or hash.
- Revoke execute from `PUBLIC`, `anon`, and `authenticated`; grant only to
  `service_role`.

Soft-delete rules:

- Update `status = 'left'`.
- Set `pin_status = 'reset_required'` and clear `pin_hash`.
- Revoke all active member sessions.
- Never execute `DELETE FROM members`.
- Be idempotent: an already-left member returns success without a duplicate audit
  transition.

All mutation RPCs must use a fixed safe `search_path`, return only required fields,
and perform the member/family/session/audit changes in one database transaction.

## 6. Service and Repository Work

### AdminMemberService

- Preserve mandatory `members.create`, `members.update`, and `members.delete`
  permission checks.
- Add `issueMemberPin(id, actor)` guarded by `members.update`.
- Validate UUIDs before repository access.
- Load the current member for update/delete/PIN operations and return safe `404`
  when absent.
- Never accept actor identity from request bodies.
- Generate PIN with Node `crypto.randomInt(0, 10_000)` and `padStart(4, "0")`.
- Do not use `Math.random()`.

### SupabaseMemberRepository

- Call the new service-role-only RPCs rather than composing multi-table writes in
  the browser or Route Handler.
- Map returned rows through existing mappers.
- Translate PostgreSQL unique violation `23505` into existing `DUPLICATE_PHONE` or
  `DUPLICATE_MEMBER_CODE` conflicts instead of a generic 500.
- Distinguish not-found from database failure.
- Remove the current partial/truthy update behavior after RPC parity is verified.

## 7. Protected API Routes

### Create

```text
POST /api/v1/admin/members
permission: members.create
success: 201 BackendResult<MemberDTO>
```

### Update

```text
PATCH /api/v1/admin/members/[id]
permission: members.update
success: 200 BackendResult<MemberDTO>
```

### Soft delete

```text
DELETE /api/v1/admin/members/[id]
permission: members.delete
success: 200 BackendResult<null>
```

### Issue/reset PIN

```text
POST /api/v1/admin/members/[id]/pin
permission: members.update
success: 200 BackendResult<IssuedMemberPinDTO>
```

Every route must:

- Resolve the actor from the persistent session cookie.
- Use the existing server-only composition root.
- Validate params/body before service calls.
- Use `createBackendResponse` for request IDs and no-store/referrer protections.
- Return safe `400/401/403/404/409/500` responses.
- Never import or call Supabase directly.

## 8. Browser Client and Existing UI Wiring

Extend `src/lib/api/memberClient.ts` with:

- `createAdminMember(input)`
- `updateAdminMember(id, input)`
- `softDeleteAdminMember(id)`
- `issueAdminMemberPin(id)`

### Add Member page

- Convert the existing form controls into a validated payload; preserve its visual
  hierarchy and sticky footer.
- Remove the fake timeout/success toast.
- On success, navigate to the real member detail page.
- Do not bundle a manually typed PIN into the create payload.
- Keep the PIN card footprint, but explain that the PIN is generated securely after
  the member record is saved.

### Edit Member page

- Replace `MOCK_MEMBERS` with the existing protected detail client.
- Populate all persisted fields and family rows from backend data.
- Submit PATCH and keep the user on a truthful success/error path.
- Reuse the existing Status control. Selecting `left` must show a confirmation and
  call DELETE rather than PATCH; it must never hard-delete.

### Member detail page

- Re-enable the existing Edit navigation after edit wiring passes.
- Wire the existing Reset PIN action to the PIN route.
- Show the generated PIN once in the previously approved copy/WhatsApp modal pattern.
- Closing the modal discards the raw PIN; reopening requires a new reset.
- Never persist the raw PIN in local storage, URL/query params, React context, or
  application logs.

## 9. Validation Rules

- Normalize phone numbers with the shared validator.
- Validate duplicate phone as `409 DUPLICATE_PHONE`.
- Require non-empty trimmed name.
- Validate optional age and family age as sensible non-negative integers.
- Validate blood group, monthly tier, member status, and positive monthly amount.
- Reject `left` in POST/PATCH payloads.
- Validate `joinedAt` as an ISO date not later than the current date.
- If `isBloodDonor` is false, normalize `donorAvailable` to false.
- Limit family collection size and string lengths to prevent oversized payloads.
- Reject unknown object keys where the validation layer supports it.

## 10. Audit Requirements

Required actions:

- `member.created`
- `member.updated`
- `member.soft_deleted`
- `member.pin_issued` or `member.pin_reset`

Audit rows must contain server-derived admin identity, member ID, request context,
safe before/after data, and an accurate summary. They must never contain raw PINs,
PIN hashes, session tokens, service keys, or full request bodies.

## 11. Verification Matrix

### Service and route tests

- Missing session -> `401` for every mutation.
- Member session -> denied.
- Admin lacking the required permission -> `403`.
- Invalid UUID/body -> `400`.
- Unknown member -> `404`.
- Duplicate phone -> `409`.
- Authorized create/update/delete/PIN actions -> expected success code and DTO.
- Repository/database failure -> safe `500`, with no internal detail leakage.

### Database integration

- Create persists every supported field and family count.
- Update persists `false`, cleared optional fields, donor changes, family replacement,
  and joined date correctly.
- Failed family/audit write rolls back the whole mutation.
- Soft delete leaves the row present, sets `left`, removes it from normal lists, and
  revokes sessions.
- PIN reset stores a bcrypt-compatible pgcrypto hash, never plaintext.
- Old PIN fails after reset; new PIN succeeds.
- Existing session fails after PIN reset.
- Audit row exists exactly once for each real transition.
- No mutation RPC is executable by `PUBLIC`, `anon`, or `authenticated`.

### UI and architecture

- Add/Edit pages contain no `MOCK_MEMBERS` or simulated success timer.
- Refresh confirms persisted values.
- Soft-deleted member disappears from normal member list.
- Raw PIN is shown once and disappears on modal close/navigation.
- No frontend component or Route Handler imports Supabase.
- Existing layout, Malayalam copy, colors, spacing, and typography remain unchanged.
- Targeted lint and TypeScript pass.
- Production build passes.
- `git diff --check` passes.

## 12. Implementation Order

1. Extend DTO/contracts and validators with complete member/family mutation inputs.
2. Add and review migration `023` transactional RPCs and privileges.
3. Complete repository adapter and error translation.
4. Extend AdminMemberService and composition dependencies.
5. Add POST/PATCH/DELETE/PIN Route Handlers.
6. Extend the browser API client.
7. Wire Add Member form.
8. Replace Edit Member mock and wire update/soft delete.
9. Wire the detail-page Reset PIN one-time modal.
10. Run service, database, route, UI, architecture, build, and migration verification.
11. Apply migration only after dry-run confirms `023` is the sole pending migration.
12. Update `BACKEND_PROGRESS.md` with exact results and unresolved limitations.

## 13. Definition of Done

Phase 9C passes only when member create/edit/soft-delete/PIN-reset actions survive a
page refresh, enforce server permissions, write audit records, never hard-delete,
never expose raw PINs beyond the one-time response, and contain no mock or simulated
success behavior in the wired paths.
