# Payment Export Filters — Implementation Plan

**Status:** Implemented locally — production/Supabase verification is still pending
**Product area:** Admin Reports & Exports (`/admin/reports`), Payments Ledger
**Last reviewed:** 2026-10-11

## Goal

Provide an admin export tool that produces trustworthy payment and outstanding-dues reports. A payment export must contain only payments that have actually been confirmed. Unpaid dues must be available as a separate, explicitly labelled report so an unpaid member is never mistaken for a transaction or a payment awaiting review.

Keep the current lightweight CSV download (Excel-compatible) and formal A4 portrait, monochrome PDF preview/print flow. Reuse the existing native month/date inputs; do not add a calendar or PDF JavaScript dependency unless the current browser print flow proves insufficient.

## Implemented local scope

- Payment exports now request `confirmed` rows from the admin payment API and exclude voided payments from both CSV/PDF output. Period filtering uses `paid_at`, falling back to `recorded_at` only when older confirmed data has no `paid_at` value.
- Payment date filters and PDF preview are available inside the preview dialog. CSV can be downloaded for the selected period from that dialog; the outer CSV button remains an all-dates confirmed export.
- The pending-dues PDF/CSV now has a single-month or up-to-24-month dues-period filter. A protected server route checks `reports.export`, compares active members with current outstanding balance against confirmed, non-voided `payment_months` coverage, and returns only unpaid members. Pending UPI/QR intents do not count as paid.
- The dues report labels `Current Balance` separately from `Unpaid Dues Month(s)`. Historical rate snapshots are not available in the current schema, so the report does not claim to calculate the amount owed for a past period.
- No schema migration or new JavaScript dependency was added. Excel-compatible CSV remains the spreadsheet output.

## Baseline observed before the local fix

- `src/components/admin/exports/PaymentsExportButton.tsx` exports every payment returned by the admin payments endpoint, including `pending`, failed, cancelled, and rejected rows.
- `src/components/admin/exports/DashboardExportButton.tsx` filters to `confirmed` and non-voided rows, so export behavior differs by entry point.
- `src/components/admin/exports/DefaultersExportButton.tsx` exports members whose current `duesPending` is greater than zero. It does not calculate whether a member paid a selected month or remained unpaid during a historical period.
- `src/components/admin/exports/ExportActions.tsx` already provides month and date-range inputs, PDF preview, browser “Save as PDF”, CSV download, and export audit calls. Date filtering currently happens in the browser after pages are fetched.
- `src/lib/api/adminPaymentExportClient.ts` fetches all payment pages and currently sends only date bounds.
- The admin export audit route already checks `reports.export`; audit metadata should be expanded to identify report kind and the chosen filters.
- The payment schema has `payments.status`, `payments.paid_at`, `payments.recorded_at`, `payments.voided_at`, and normalized dues coverage in `payment_months.month_key`. `members.dues_pending` is a current aggregate, not a month-by-month historical balance.

## Product behavior

### Report type A — Confirmed payments

- Include only `payments.status = 'confirmed'` and `voided_at IS NULL`.
- Apply to the Payments Ledger export, Financial Report export, PDF preview, and CSV download consistently.
- Date filters use the payment completion date (`paid_at`); if historical confirmed rows have no `paid_at`, use a documented fallback to `recorded_at` and track those rows for data-quality follow-up.
- Allow optional payment method and category filters, with “All” as the default.
- Do not include pending UPI/QR intents, cash handovers awaiting review, failed attempts, or voided records.

### Report type B — Outstanding dues

- Show members who have not covered the selected dues month(s), as a separate report from received payments.
- Support a current-month shortcut and a selectable dues-month interval. Label the control as a dues period so users do not confuse it with the date a payment was received.
- Determine coverage only from confirmed, non-voided monthly-dues payments joined through `payment_months`; pending intents do not count as paid.
- Include member identity, phone, area, unpaid dues month(s), and outstanding amount. Do not create fake payment rows or label dues as cash handovers.
- Use active/eligible membership and the configured dues frequency when determining which members owe for each period.

### Optional report type C — Cash handovers awaiting review

Keep this separate from outstanding dues. It contains only `method = 'cash_handover'`, `status = 'pending'`, and non-voided rows. It represents cash already reported as handed to an admin and awaiting verification, not members who have yet to pay. Add this mode only if the product owner wants that queue exportable.

## Filters and export controls

- Report type: `Confirmed payments` or `Outstanding dues` (and optional `Cash handovers awaiting review`).
- Period: all, one calendar month, or custom start/end period. For outstanding dues, period values are month keys; for received payments, they are timestamps.
- Payment method and payment category filters apply only to confirmed-payment reports.
- Search/area/member filters may be added if the existing admin report APIs can apply them server-side without loading the full member list.
- Show the active report type, period, payment method/category, row count, and total amount in the preview and audit record.
- Keep PDF styling formal, grayscale, aligned, A4 portrait, with page numbers and repeated table headings. CSV remains Excel-compatible and uses the same row set and filter summary as the PDF.

## Data and backend plan

1. Confirmed payment exports use the existing protected payments API with `status=confirmed`, server-side period bounds, stable pagination, and a final client-side non-voided guard.
2. The dues export uses a dedicated protected server route. It validates the dues period, enforces the 24-month limit, checks `reports.export`, and keeps member/payment-month joining on the server.
3. Export completion is recorded by the existing audit route with the report title, format, period, and row count. Do not add personal payment data to audit metadata.
4. Before production rollout, inspect the target Supabase schema/query plan and verify historical confirmed rows have `paid_at` or rely on the documented `recorded_at` fallback.
5. If export volume becomes large, move confirmed-payment export assembly to a server-side snapshot/stream so the browser does not retain the entire ledger in memory. Current page fetching remains batched and reuses the existing lightweight CSV/PDF generation.

## UI and architecture touchpoints

- `src/components/admin/exports/ExportActions.tsx` — report-type and filter controls, loading/empty/error states, shared preview/download flow.
- `src/components/admin/exports/PaymentsExportButton.tsx` — confirmed-payment report configuration.
- `src/components/admin/exports/DefaultersExportButton.tsx` — outstanding-dues report configuration and dues-period semantics.
- `src/components/admin/exports/DashboardExportButton.tsx` and `src/components/admin/reports/ReportsDashboard.tsx` — keep the existing confirmed-only financial summary behavior aligned with the shared contract.
- `src/lib/api/adminPaymentExportClient.ts` — typed request for server-filtered, paginated export data.
- Add report DTO/validation/service/repository and a protected report API under the existing `src/app/api/v1/admin/` backend structure, following `Backend_Architecture_Supabase_Plan.md`.
- `src/app/api/v1/admin/exports/audit/route.ts` — include report mode and normalized filter metadata in audit records.
- `src/lib/client/printablePdf.ts` — preserve the existing A4 portrait grayscale format; only change it if QA finds pagination/readability issues.

## Remaining rollout steps

1. **Production data check:** Inspect the target Supabase schema and sample rows for missing `paid_at`, missing `payment_months`, non-active members with balances, and historical changes to dues amounts. Do not alter or clear payment data.
2. **Reconcile exports:** Compare confirmed payment row counts and totals against the Payments Ledger for a month and custom range. Compare dues results against confirmed month coverage and outstanding balances.
3. **Confirm due policy:** Validate whether inactive members should be included, and whether historical unpaid periods need rate snapshots to produce period-specific amounts. Current implementation includes active members with a positive current balance and reports that balance separately.
4. **Performance/security rollout:** Review the target Supabase query plan, test `reports.export` access for allowed/denied admins, inspect audit entries, then deploy the application. No migration is currently required.

## Acceptance criteria

- A pending UPI/QR intent never appears in confirmed-payment PDF or CSV output.
- Pending cash handovers are not mislabeled as payments received and do not enter the outstanding-dues report.
- Every exported payment is confirmed and non-voided; PDF and CSV contain the same rows for the same filters.
- Current-month and custom dues-month interval reports list active members with a positive current balance and uncovered selected months; confirmed coverage removes those month(s) from the unpaid result.
- Payment date filters are inclusive of the selected local start/end dates and consistent across the API, preview, PDF, and CSV.
- Empty results, invalid/reversed ranges, timezone boundaries, pagination, concurrent new payments, permission denial, and large exports have defined behavior.
- The PDF remains readable on mobile preview and prints as monochrome A4 portrait with repeated headers/page numbers.
- Export audit entries contain report kind and filters, but not the exported personal data.

## Verification completed locally

- ESLint passed for the changed TypeScript/TSX files and new route.
- TypeScript `--noEmit` passed.
- Production build passed; the new dues export route is included in the build.
- The local admin payments page and its authenticated API requests returned HTTP 200.
- `git diff --check` passed; only the repository's LF/CRLF normalization warnings were printed.
- No automated tests were added or run. The target Supabase data/query behavior, export reconciliation, permission-denial behavior, and rendered multi-page PDF still need rollout verification.

## Rollout decisions and limitations

- “Cash due” is implemented as unpaid monthly dues, independent of the payment method the member may later use.
- Historical dues amounts are not versioned in the current schema. The report therefore shows uncovered month(s) and the current aggregate balance separately; it does not calculate historical period-specific amounts.
- Spreadsheet output remains Excel-compatible CSV; no `.xlsx` dependency was added.
- Cash handovers awaiting review remain separate from both confirmed payments and unpaid dues.
- The target Supabase project was not available for a live schema/query check in this session. Do not deploy until the target project’s joined `payment_months` query and report totals are reconciled against real data.
