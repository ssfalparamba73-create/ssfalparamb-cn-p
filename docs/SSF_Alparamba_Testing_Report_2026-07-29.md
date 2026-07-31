# SSF Alparamba Contribution Portal — Non-Payment Readiness Report

Date: 2026-07-29
Scope: Non-payment features only

## Current decision

**Implementation complete for the safe local code changes; staging/production release remains conditional.**

Payment, cash-entry, dues, defaulters, reports, and receipt workflows were intentionally not changed.

## Implemented

- Dashboard desktop and mobile **Add Member** actions now open `/admin/members/new`.
- User-facing member terminology now uses **Block / Blocks** while the compatible API/database property remains `area` and setting key remains `areas`.
- Member filters now wrap into a responsive grid/flex layout instead of horizontal scrolling.
- Deferred Admin Note UI was removed from the member form and member detail tabs.
- Added forward-only migration `044_reconcile_unit_blocks_setting.sql`:
  - creates the missing `unit.areas` setting without overwriting an existing value;
  - updates only its description/public flag when already present;
  - preserves the existing RPC contract;
  - enforces 1–50 trimmed, unique Block values of at most 80 characters;
  - keeps RPC execution restricted to `service_role`.
- Added Vitest and five focused Block-settings validation regression tests.
- Applied the available Next.js security patch from 16.2.10 to 16.2.12 with matching ESLint config.

## Verification results

| Check | Result |
|---|---|
| Block settings unit tests | Pass — 5/5 |
| TypeScript (`npx tsc --noEmit`) | Pass |
| Production build (`npm run build`) | Pass — all 54 routes generated |
| ESLint | Pass with 0 errors and 32 pre-existing warnings |
| Diff whitespace check | Pass |
| Obsolete Admin Notes / Area labels in scoped admin UI | No matches |
| Payment-scope source changes | None made by this implementation |

## Database deployment status

Migration `044` was **not applied to the connected remote database**. The environment does not expose a trusted migration ledger connection or database backup path, so applying a remote mutation would not meet the plan's safety gate. Apply `044` through the normal Supabase migration workflow only after backup and migration-ledger verification.

## Remaining release gates

- Apply and verify migration `044` in staging, then production through the controlled migration pipeline.
- Run authenticated role/session/RLS tests using dedicated staging accounts.
- Runtime-test soft-delete → phone reuse with isolated staging records.
- Add approved support-contact data; none was invented or committed.
- Complete responsive/accessibility browser QA at 320, 375, 768, 1024, and 1440 px. Browser automation was unavailable in the current Windows sandbox.
- Expand automated coverage beyond the new validation tests to service, repository, RLS, and E2E layers.

## Dependency audit residual risk

`npm audit` still reports upstream/transitive high-severity findings in Next-bundled PostCSS/Sharp and ESLint's minimatch/brace-expansion chain. The direct Next advisory was addressed by upgrading to 16.2.12. npm's remaining suggested `--force` resolution would introduce breaking or invalid framework changes, so it was not applied. Reassess when compatible upstream patches are released.

## Release recommendation

Do not deploy directly to production yet. Deploy this branch to staging, apply migration `044` through the controlled migration workflow, complete authenticated/runtime QA, and obtain product-owner acceptance first.
