# Architecture Plan

## 1. Current Project Status

Current app: Next.js App Router project at `src/app`.

Existing routes:

| Route | File | Status |
|---|---|---|
| `/` | `src/app/page.tsx` | Approved landing/home baseline |
| `/pay` | `src/app/pay/page.tsx` | Public payment mock exists |
| `/success` | `src/app/success/page.tsx` | Public success mock exists |
| `/receipt/[id]` | `src/app/receipt/[id]/page.tsx` | Receipt mock exists |
| `/support` | `src/app/support/page.tsx` | Support page exists |

Existing foundation:

| Area | Current State |
|---|---|
| Framework | Next.js 16 App Router, React 19, TypeScript |
| Styling | Tailwind CSS v4 tokens in `src/app/globals.css` |
| UI primitives | `Button`, `Card`, `Input`, `Label` |
| Icons | `lucide-react` already in use |
| Fonts | Poppins UI font currently wired, Cooper Black local brand font wired |
| Brand font utility | `.font-cooper` exists |
| Missing primitive | `Badge` is imported by receipt page but `src/components/ui/badge.tsx` does not exist yet |

Design baseline from current landing page:

- Soft SaaS/fintech feel.
- White and slate surfaces: `#FFFFFF`, `#F8FAFC`, `#F1F5F9`.
- Primary blue action system.
- Green trust/success signals.
- Rounded cards, subtle shadows, light borders.
- Cooper Black only for SSF brand text.
- Mobile-first stacked structure.
- Card-centered payment flow.
- Calm, transparent community finance tone.

Do not redesign the landing page. All new pages must visually extend this implementation.

## 2. Full Route Map

### Public Routes

| Route | Access | Purpose | Status |
|---|---|---|---|
| `/` | Public | Landing / Home | Built, approved baseline |
| `/pay` | Public | Guest/member payment lookup and payment | Built mock, refine later |
| `/payment` | Public | Preferred future canonical payment route | Add redirect or migrate from `/pay` |
| `/payment/success` | Public | Payment success confirmation | Add; can replace `/success` |
| `/success` | Public | Current success route | Existing legacy/simple route |
| `/receipt/[id]` | Public or token-gated | Digital receipt view | Built mock |
| `/support` | Public | Support/contact | Built mock |
| `/login` | Public | Member/admin login entry | Not built |
| `/otp-verification` | Public | OTP verification | Not built |

Recommended route policy: keep current routes working, but standardize future public payment flow around `/payment` and `/payment/success`. Add redirects later only with product owner approval.

### Member Routes

| Route | Access | Purpose |
|---|---|---|
| `/member/dashboard` | Protected member | Dues summary, payment CTA, recent activity |
| `/member/payments` | Protected member | Payment history |
| `/member/profile` | Protected member | Member and family profile |
| `/member/receipts` | Protected member | Receipt archive |
| `/member/notifications` | Protected member | Announcements/payment reminders |

### Admin Routes

| Route | Access | Purpose |
|---|---|---|
| `/admin` | Protected admin | Redirect to `/admin/dashboard` |
| `/admin/login` | Public/admin auth | Admin login if separate from member login |
| `/admin/dashboard` | Protected admin | Collection overview and quick actions |
| `/admin/members` | Protected admin | Members list |
| `/admin/members/[id]` | Protected admin | Member detail, dues, receipts, family info |
| `/admin/payments` | Protected admin | Payments ledger |
| `/admin/defaulters` | Protected admin | Current/severe defaulters |
| `/admin/cash-entry` | Protected admin | Manual cash payment entry |
| `/admin/reports` | Protected admin | Reports and exports |
| `/admin/audit-log` | Protected admin | Admin/system activity log |
| `/admin/settings` | Protected admin | Unit/payment/admin settings |

## 3. Layout Architecture

### RootLayout

Current global layout stays as the top shell:

- Loads global CSS.
- Loads current UI font variable.
- Loads Cooper Black local font.
- Provides global app metadata.

Future work should not replace this foundation unless the product owner requests it.

### PublicLayout

Used for:

- `/`
- `/pay` or `/payment`
- `/payment/success`
- `/success`
- `/receipt/[id]`
- `/support`
- `/login`
- `/otp-verification`

Structure:

- Public navbar based on current landing header.
- Compact SSF wordmark using Cooper Black only for `SSF`.
- Primary action button.
- Optional footer.
- Centered card layout for payment/login/receipt flows.
- Same soft background and card style as current landing page.

### MemberLayout

Used for `/member/*`.

Mobile:

- Top header with greeting/status.
- Bottom navigation for Dashboard, Payments, Receipts, Profile.
- Payment due state visible near top.
- Full-width cards and large touch targets.

Desktop/tablet:

- Simple top header.
- Optional side rail if needed later.
- Main content max width.
- Dashboard-style cards based on landing/payment card language.

### AdminLayout

Used for `/admin/*`.

Desktop:

- Persistent sidebar.
- Top navbar with search/actions/profile.
- Main content area with dashboard grid.
- Tables and filters inside flat bordered cards.

Mobile:

- Top header.
- Drawer menu for admin navigation.
- Optional bottom quick nav for highest-frequency actions.
- Tables convert to cards.

Admin layout must feel operational, not marketing-like. Use the same color tokens, cards, typography rhythm, and restrained accents from the landing page.

## 4. Page Build Order

### Phase 1 - Core Public Flow

1. Landing Page `/`  
   Already built and approved. Do not redesign.

2. Payment Page `/payment` or current `/pay`  
   Dependencies: `PublicLayout`, `PaymentLookupForm`, `PaymentMethodSelector`, `DueSummaryCard`.

3. Payment Success Page `/payment/success` or current `/success`  
   Dependencies: `SuccessCard`, `ReceiptActionGroup`, `PaymentMetaList`.

4. Receipt Page `/receipt/[id]`  
   Dependencies: `Badge`, `ReceiptHeader`, `ReceiptAmountPanel`, `ReceiptMeta`, `PrintActions`.

5. Login / OTP `/login`, `/otp-verification`  
   Dependencies: `AuthCard`, `PhoneInput`, `OtpInput`, `AuthStateMessage`.

### Phase 2 - Member Flow

6. Member Dashboard `/member/dashboard`  
   Dependencies: `MemberLayout`, `DueStatusCard`, `PaymentCTA`, `RecentPaymentsCard`.

7. Payment History `/member/payments`  
   Dependencies: `PaymentCard`, `PaymentStatusBadge`, `EmptyState`.

8. Profile `/member/profile`  
   Dependencies: `MemberProfileCard`, `FamilyMemberCard`, `EditableSection`.

9. Receipts `/member/receipts`  
   Dependencies: `ReceiptCard`, `ReceiptFilterBar`, `DownloadReceiptButton`.

10. Notifications `/member/notifications`  
    Dependencies: `NotificationCard`, `NotificationBadge`.

### Phase 3 - Admin Core

11. Admin Login `/admin/login`  
    Dependencies: `AuthCard`, `OtpInput`, `AdminAccessNotice`.

12. Admin Dashboard `/admin/dashboard`  
    Dependencies: `AdminLayout`, `StatsCard`, `QuickActionCard`, `ChartCard`, `RecentActivityList`.

13. Members List `/admin/members`  
    Dependencies: `MemberTable`, `MemberCard`, `FilterBar`, `SearchInput`, `StatusBadge`.

14. Member Detail `/admin/members/[id]`  
    Dependencies: `MemberSummaryPanel`, `PaymentHistoryTable`, `FamilySection`, `AdminNotesPanel`.

### Phase 4 - Admin Advanced

15. Payments Ledger `/admin/payments`  
    Dependencies: `PaymentTable`, `LedgerFilterBar`, `ExportButton`.

16. Defaulters `/admin/defaulters`  
    Dependencies: `DefaulterTable`, `DefaulterCard`, `ReminderAction`.

17. Cash Entry `/admin/cash-entry`  
    Dependencies: `CashEntryForm`, `MemberSearchCombobox`, `AmountInput`, `ConfirmationModal`.

18. Reports `/admin/reports`  
    Dependencies: `ReportChart`, `ReportSummaryCard`, `DateRangePicker`, `ExportPanel`.

19. Audit Log `/admin/audit-log`  
    Dependencies: `AuditTable`, `AuditDetailDrawer`, `ActorBadge`.

20. Settings `/admin/settings`  
    Dependencies: `SettingsForm`, `PaymentConfigCard`, `AdminUsersPanel`.

## 5. Component Dependency Map

### Foundation Components

Build or stabilize before new pages:

- `Button` exists.
- `Card` exists.
- `Input` exists.
- `Label` exists.
- `Badge` missing, needed immediately.
- `Textarea`.
- `Select`.
- `Modal`.
- `Drawer`.
- `Toast`.
- `Skeleton`.
- `EmptyState`.
- `StatusBadge`.
- `AmountText`.
- `PageHeader`.
- `SectionHeader`.

### Layout Components

- `PublicLayout`.
- `MemberLayout`.
- `AdminLayout`.
- `PublicNavbar`.
- `AdminSidebar`.
- `AdminTopbar`.
- `MobileBottomNav`.
- `MobileDrawerNav`.
- `Footer`.

### Public Flow Components

- `HeroPaymentCard`.
- `PaymentLookupForm`.
- `DueSummaryCard`.
- `PaymentMethodSelector`.
- `SuccessCard`.
- `ReceiptHeader`.
- `ReceiptAmountPanel`.
- `SupportContactCard`.

### Member Components

- `MemberCard`.
- `DueStatusCard`.
- `PaymentCard`.
- `ReceiptCard`.
- `FamilyMemberCard`.
- `NotificationCard`.

### Admin Components

- `StatsCard`.
- `QuickActionCard`.
- `ChartCard`.
- `MemberTable`.
- `MemberSummaryPanel`.
- `PaymentTable`.
- `DefaulterTable`.
- `CashEntryForm`.
- `ReportChart`.
- `AuditTable`.
- `SettingsForm`.

## 6. Build Rules

All future pages must follow this order of authority:

1. Product owner latest instruction.
2. `UI_PLAN_V2`.
3. `ARCHITECTURE_PLAN`.
4. Current landing page implementation.
5. Agent recommendation.

No future page should introduce design drift. Reuse the current landing page's spacing, surface treatment, typography weight, rounded cards, blue/green/gold/red palette, Cooper Black branding restraint, and mobile-first flow.

New visual assets require product owner approval.

## 7. Master Specification Authority Rules

### 7.1 Master Specification Files

- This project has two master specification files:
  - `UI_PLAN_V2`
  - `ARCHITECTURE_PLAN`
- These two files together form the project constitution.

### 7.2 UI Authority File

- `UI_PLAN_V2` defines all UI-related decisions:
  - Design system
  - Colors
  - Typography
  - Spacing
  - Components
  - Layout rules
  - Responsive behavior
  - Interaction rules
  - Visual hierarchy
- `UI_PLAN_V2` is the single source of truth for UI.

### 7.3 Architecture Authority File

- `ARCHITECTURE_PLAN` defines all architecture-related decisions:
  - Route map
  - Folder structure
  - Page hierarchy
  - Layout hierarchy
  - Build order
  - Component dependency map
  - Shared layouts
  - Navigation structure
- `ARCHITECTURE_PLAN` is the single source of truth for architecture.

### 7.4 Mandatory Rule

- All agents and developers must follow both files together.
- Build is allowed only when implementation satisfies both:
  - `UI_PLAN_V2`
  - `ARCHITECTURE_PLAN`
- Not one. Both are mandatory.

### 7.5 Forbidden Behavior

- Agents must never:
  - Ignore `UI_PLAN_V2`
  - Ignore `ARCHITECTURE_PLAN`
  - Follow only one file
  - Make assumptions outside these files
  - Introduce architectural changes without approval
  - Introduce UI changes without approval

### 7.6 Conflict Resolution Rule

- If implementation creates ambiguity:
  - Step 1: Check `UI_PLAN_V2`.
  - Step 2: Check `ARCHITECTURE_PLAN`.
  - Step 3: If ambiguity still exists, stop and ask the product owner for clarification.
- Do not assume.

### 7.7 Implementation Rule

- Before building any feature, page, component, route, or layout, agents must verify:
  - Does this follow `UI_PLAN_V2`?
  - Does this follow `ARCHITECTURE_PLAN`?
- If either answer is no, do not proceed.

### 7.8 Priority Order

- Implementation priority:
  - Product Owner Latest Instruction
  - `UI_PLAN_V2`
  - `ARCHITECTURE_PLAN`
  - Existing Codebase
  - Agent Suggestions
- This priority order is mandatory.

### 7.9 Final Rule

- No page, component, route, or feature may be built unless both master files are respected.
