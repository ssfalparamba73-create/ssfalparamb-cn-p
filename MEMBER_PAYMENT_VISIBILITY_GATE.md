# Member Payment Visibility Gate

## Current release decision

**Status: Hidden for the initial client-testing phase.**

Member-facing payment entry points are controlled by
`src/lib/featureFlags.ts` through `MEMBER_PAYMENTS_ENABLED`.

The current value is `false`. This intentionally:

- removes Payments from the member desktop header;
- removes Payments from the member mobile bottom navigation;
- hides the member dashboard Pay Now action;
- hides the Recent Activity `View all` payment-history link;
- redirects `/member/payments` to `/member/dashboard`;
- redirects `/pay?source=member` to `/member/dashboard`.

## Preservation guarantee

No payment page, component, contract, service, repository, migration, receipt UI,
or payment database structure has been deleted. Public/admin payment code is not
changed by this visibility gate.

The existing member payment page remains preserved at
`src/app/member/payments/page.tsx` behind the flag so it can be restored without a
redesign.

## Enable only in the next payment phase

Set `MEMBER_PAYMENTS_ENABLED` to `true` only after all of these are complete:

1. Replace member payment-history mock transactions with authenticated real data.
2. Complete the reviewed payment source-of-truth and provider/webhook integration.
3. Verify server-calculated amounts, status transitions, duplicate prevention, and
   receipt-token access.
4. Verify member payment, success, history, and receipt journeys on staging.
5. Receive the product owner's release approval for member payment visibility.

Enabling the flag restores the preserved navigation/actions/routes; it must not be
used to bypass the readiness checklist above.
