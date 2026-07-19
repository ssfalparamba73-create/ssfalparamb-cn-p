# Phase 9B Plan: Protected Admin Member Detail

## Decision

Replace the admin member-detail page mock with one protected read endpoint. Keep
member edit, PIN reset, cash recording, payment history, family records, event
subscriptions, and audit history outside this slice.

## Runtime path

```text
Admin member-detail page
  -> GET /api/v1/admin/members/:id
    -> persistent session actor resolver
      -> AdminMemberService (`members.view`)
        -> MemberRepository.findById
          -> Supabase members
```

## Required changes

- Add mandatory-permission `getMember` service behavior and safe not-found handling.
- Add protected `GET /api/v1/admin/members/[id]` using the Next.js 16 async params convention.
- Add the browser client and replace only the detail-page `MOCK_MEMBERS` lookup.
- Preserve the approved header, actions, tabs, layout, colors, spacing, and typography.
- Remove hard-coded payment/event/audit records and insecure browser-generated PINs.
- Keep unavailable mutations visible but non-deceptive; they must not pretend to save.

## Verification

- Missing session -> `401`; member/non-permitted admin -> denied; permitted admin -> success.
- Unknown member -> safe `404`; database failures -> safe `500`.
- Detail UI contains no mock member, fake payment/event/audit data, or `Math.random()` PIN.
- TypeScript, targeted lint, production build, layer scans, and `git diff --check` pass.

## Implementation status

Implemented and source/build verified on 2026-07-18. Migration `015` and the
forward-only auth compatibility migration `022` are applied to the linked database;
a real-user session test still requires an approved member/admin credential.
