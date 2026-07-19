# Phase 9A Plan: Protected Admin Member List

## Decision

The next non-payment slice replaces only the admin members-list mock. Member detail,
create/edit/delete, member profile, directory, and payment history remain separate
follow-up slices so authorization and UI parity can be reviewed incrementally.

## Runtime path

```text
Admin Members page
  -> GET /api/v1/admin/members
    -> persistent session actor resolver
      -> AdminMemberService (`members.view`)
        -> MemberRepository
          -> SupabaseMemberRepository
            -> members
```

## Required changes

- Add a server-only admin-member composition root with mandatory permission checks.
- Add protected `GET /api/v1/admin/members` with pagination and existing filters.
- Complete repository filter/error handling for search, status, blood group, area,
  tier, arrears state, and donor availability.
- Add a browser API client and replace `MOCK_MEMBERS` only on the admin members page.
- Preserve the current table/cards, filters, sorting, layout, copy, colors, and fonts.
- Do not add member mutations or payment integration.

## Verification

- Missing/member session -> denied; authorized admin with `members.view` -> success.
- Filters/pagination return safe `MemberDTO` values only.
- Supabase failure returns safe `500`, not an empty member list.
- Admin members page has no `MOCK_MEMBERS` reference.
- TypeScript, targeted lint, production build, and no-direct-Supabase scans pass.

## Implementation status

Implemented on 2026-07-18. Source-level verification passed; production build and
runtime authorization smoke checks are recorded in `BACKEND_PROGRESS.md`.
