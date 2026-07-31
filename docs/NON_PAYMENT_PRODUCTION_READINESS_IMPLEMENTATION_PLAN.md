# SSF Alparamba — Non-Payment Production Readiness Plan

Status: Partially implemented — local safe changes complete; staging gates pending
Scope: Non-payment features only
Implementation started: Yes

## 1. Objective

Bring the member-management, settings, authentication, authorization, audit, and responsive admin experience to production-ready status without changing payment, cash-entry, dues, defaulter, report, or receipt workflows.

## 2. Explicitly Out of Scope

- Payment gateway integration
- Payments ledger replacement
- Cash Entry implementation
- Dues calculations
- Defaulters/reminder implementation
- Payment-derived dashboard totals
- Payment reports and exports
- Receipt generation, download, share, and receipt settings persistence

Existing out-of-scope controls must not be accidentally presented as completed functionality.

## 3. Safety Principles

1. Preserve the existing landing page and approved design system.
2. Do not rename the database field `area`; change only the user-facing label to `Block`.
3. Do not rewrite migration history or manually edit production data.
4. Inspect the remote migration ledger before applying any migration.
5. Use additive and idempotent database changes.
6. Keep existing member IDs, phone numbers, audit history, and relationships intact.
7. Test each phase independently before moving to the next phase.
8. Commit each phase separately so it can be reverted without affecting later work.
9. Do not mix payment-related changes into these commits.
10. Never expose raw Supabase errors, credentials, PINs, or tokens.

## 4. Phase 0 — Baseline and Protection

### Work

- Record the current Git commit and working-tree state.
- Preserve the existing uncommitted dashboard styling changes.
- Take a database backup or verified export before applying migrations.
- Record current row counts for:
  - members
  - family_members
  - admin_users
  - audit_logs
  - app_settings
  - support_contacts
- Inspect the Supabase migration ledger.
- Confirm whether migrations `042` and `043` are applied remotely.

### Migration Decision

- If neither `042` nor `043` is applied: apply them in order.
- If `043` is already applied but `042` is missing: do not force an old migration into history. Create an idempotent forward reconciliation migration such as `044_reconcile_unit_areas_setting.sql`.
- If `042` is marked applied but `unit.areas` is missing: create a forward repair migration; do not edit `042`.

### Gate

- Backup/export verified.
- Migration state documented.
- No row-count changes before implementation.

## 5. Phase 1 — Dashboard Non-Payment Actions

### Work

- Wire desktop and mobile `Add Member` actions to `/admin/members/new`.
- Confirm keyboard activation and accessible labels.
- Keep `Record Cash` and payment-derived actions out of scope.
- Either hide/disable out-of-scope dashboard actions with an honest explanation or leave them unchanged based on product-owner confirmation.
- Do not modify dashboard data contracts in this phase.

### Acceptance Tests

- Desktop Add Member opens the new-member page.
- Mobile Add Member opens the same page.
- Enter/Space activation works where applicable.
- No payment route or API behavior changes.
- Dashboard loading/error states remain intact.

### Rollback

- Revert only the dashboard-action commit.

## 6. Phase 2 — Configurable Blocks

### Work

- Preserve backend property and database column name `area`.
- Change visible labels:
  - `Area`
  - `Area / Branch`
  - `Areas / Branches`
  to the approved user-facing term `Block` or `Blocks`.
- Keep API contracts backward compatible.
- Verify the `unit.areas` app setting through the safe migration decision from Phase 0.
- Continue to store configured Block choices in the existing `areas` JSON setting unless the product owner explicitly requests a schema rename.
- Ensure existing member values not present in current settings remain visible while editing.
- Validate:
  - at least one Block
  - maximum 50 Blocks
  - maximum 80 characters
  - trimmed, case-insensitive uniqueness

### Acceptance Tests

- Settings can add, edit, remove, and reorder Blocks.
- Saved Blocks persist after refresh.
- Member create/edit forms show saved Blocks.
- Member list filter shows the same Blocks.
- Existing member Block values are not erased.
- Duplicate or empty Block values are rejected safely.
- Audit log records settings changes.

### Rollback

- UI-label commit can be reverted without touching stored data.
- Forward migration rollback must remove only the newly inserted setting if it was created by the repair and is confirmed unused.

## 7. Phase 3 — Member Form and List Cleanup

### Work

- Remove the disabled Admin Note section from the member form.
- Replace horizontal filter scrolling with a responsive layout:
  - desktop: compact inline filters
  - tablet: wrapped controls
  - mobile: stacked controls or an existing filter drawer/popover
- Preserve server-side pagination and current filter query behavior.
- Verify member-card text under the name is the actual member ID/code.
- Verify badges use DTO/database values and are not hard-coded.
- Keep mobile touch targets at least 44px where the control is interactive.

### Acceptance Tests

- No page-level horizontal overflow at 320px and 375px.
- All filters remain reachable without sideways page scrolling.
- Changing any filter resets pagination to page 1.
- Name, phone, member code, status, blood group, and Block match database data.
- Admin Note is no longer displayed.
- Skeletons match final card/table dimensions.

### Rollback

- Revert member-list UI commit; backend queries remain unchanged.

## 8. Phase 4 — Authentication and Session Runtime Verification

### Work

- Create a staging-only test matrix for:
  - valid member PIN
  - invalid member PIN
  - repeated failures and lockout
  - valid admin code
  - inactive admin
  - blocked/inactive/left member
  - logout
  - revoked session
  - expired session
  - refresh/session restoration
- Use dedicated staging accounts; never test lockout against the only production super admin.
- Confirm cookies use the expected secure, HTTP-only, same-site configuration in production.
- Confirm successful login does not expose the PIN/code in logs or responses.

### Acceptance Tests

- Invalid credentials return normalized safe errors.
- Lockout activates and later clears according to policy.
- Logout/revocation makes the token unusable.
- Protected pages and APIs reject missing/expired sessions.
- A soft-deleted member cannot log in.
- A reused phone resolves only to the new active member.

### Rollback

- Test-data cleanup only; authentication code changes, if required, must be isolated in a separate commit.

## 9. Phase 5 — Roles, Permissions, and RLS Verification

### Work

- Build a role matrix from the currently supported roles in the database.
- Test both UI visibility and direct API authorization.
- Test anonymous access with the anon key.
- Test member self-access boundaries.
- Test admin mutation boundaries.
- Verify audit logs cannot be directly inserted/updated/deleted by ordinary clients.

### Required Matrix

- Super Admin
- Admin
- Any legacy Collector/Treasurer/Viewer roles still present in the database
- Member
- Anonymous user

### Acceptance Tests

- UI hiding is not the only protection.
- Direct unauthorized API calls return 401/403.
- Members cannot access another member’s data.
- Anonymous users cannot read raw protected tables.
- Admin-management and audit-purge operations require the intended elevated role.

### Rollback

- RLS fixes must be additive forward migrations.
- Never disable RLS as a temporary workaround.

## 10. Phase 6 — Support Contacts and Required Configuration

### Work

- Add approved support-contact data through the admin UI or controlled seed/migration.
- Verify active/inactive state, ordering, primary contact, phone, and WhatsApp availability.
- Confirm public/member views expose only active safe fields.
- Avoid placing real personal contact details in source-controlled seed files unless explicitly approved.

### Acceptance Tests

- Public support API returns active contacts only.
- Disabled contacts disappear without being permanently deleted.
- Ordering persists.
- WhatsApp action appears only when enabled.
- Settings mutations create audit records.

### Rollback

- Deactivate the added contact rows rather than deleting audited production records.

## 11. Phase 7 — Automated Tests

### Minimum Test Layers

1. Validation unit tests:
   - phone
   - member input
   - Block settings
   - pagination
2. Service tests:
   - member permissions
   - soft delete
   - session behavior
   - settings update
3. Repository/integration tests:
   - member pagination
   - Block settings persistence
   - phone reuse
4. RLS tests:
   - anonymous
   - member self-access
   - admin permissions
5. End-to-end smoke tests:
   - admin login
   - member list
   - add member
   - edit member
   - soft delete
   - reused phone
   - Block settings

### Rules

- Tests must use isolated local/staging data.
- Destructive tests must create and clean up their own uniquely prefixed records.
- No production phone number, PIN, or user account may be embedded in tests.

### Gate

- All tests pass consistently on two consecutive runs.

## 12. Phase 8 — Responsive, Accessibility, and Browser QA

### Viewports

- 320px
- 375px
- 768px
- 1024px
- 1440px

### Checks

- No page-level horizontal overflow.
- Dashboard, Members, Member Form, Settings, and Audit pages remain usable.
- Keyboard navigation works.
- Visible focus indicators remain.
- Dialogs trap focus and close with Escape.
- Labels and icon-button aria-labels exist.
- Light/dark contrast is readable.
- Malayalam text does not clip or compress.
- Chrome and Edge smoke tests pass.

### Gate

- No critical or high-severity accessibility/responsive defect remains.

## 13. Phase 9 — Warning Cleanup and Final Verification

### Work

- Remove unused imports and variables.
- Replace appropriate raw `<img>` usage with the supported Next.js image approach where it does not alter approved visuals.
- Do not combine visual redesign with warning cleanup.
- Run:
  - full lint
  - TypeScript
  - production build
  - automated tests
  - database migration verification
  - authenticated smoke tests

### Acceptance Gate

- ESLint: 0 errors and approved warning count.
- TypeScript: pass.
- Production build: pass.
- Automated tests: pass.
- Migration ledger: consistent.
- Product-owner acceptance: complete.

## 14. Recommended Commit Sequence

1. `fix: wire non-payment dashboard member action`
2. `fix: align member area labels to block terminology`
3. `fix: improve responsive member filters`
4. `fix: remove deferred admin note field`
5. `fix: reconcile configurable block settings migration`
6. `test: add member validation and service coverage`
7. `test: add auth and RLS integration coverage`
8. `test: add non-payment admin smoke coverage`
9. `chore: clean non-payment lint warnings`

Each commit must pass lint, TypeScript, and relevant tests before the next commit begins.

## 15. Final Non-Payment Release Gate

Non-payment scope is ready only when:

- Add Member works on desktop and mobile.
- Block settings persist and feed member forms/filters.
- No member-list horizontal overflow remains.
- Admin Note is removed.
- Member data and badges match the database.
- Auth/session runtime matrix passes.
- Role/RLS matrix passes.
- Support contacts are configured.
- Automated tests pass.
- Responsive/accessibility QA passes.
- Production build passes.
- Migration state is consistent.
- Product owner approves the staging result.
