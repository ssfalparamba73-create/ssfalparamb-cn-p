# UI_PLAN_V2

# [SSF Alparamba] Digital Varisankhya Collection Portal
## Premium SaaS UI/UX Specification â€” v2.0 (Next-Level)

### 1. Product Vision
A trust-first community finance tool. Every screen should communicate transparency and accountability to members while giving non-technical committee volunteers admin superpowers with zero training curve. Benchmark feel: Stripe Dashboard Ã— CRED Ã— Linear, filtered through restrained, respectful cultural branding.

### 2. Design System (Tokens)
- **Color Tokens**:
  - Primary Background:   #F8FAFC
  - Secondary Background: #F1F5F9
  - Text Primary: `#0F172A`
  - Accent Green (Success): `#16A34A`
  - Accent Blue (Primary Actions): `#2563EB`
  - Accent Gold: `#C8A96B` (ceremonial only)
  - Accent Red (Defaulters/Errors): `#DC2626`
- **Typography**: Inter (English) + Noto Sans Malayalam. Tabular-figure style for numerals.
- **Radius**: Cards 20px, Buttons 12px, Inputs 10px, Pills Full.
- **Shadows**: Soft only `0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.06)`.
- **Motion**: Subtle 150-300ms ease-outs. No gimmicky animations.
- **Cultural Identity**: Low-opacity geometric/arabesque patterns (3-5%) on hero and receipts. Bismillah/greeting respectfully sized.

#### 2.1 Expanded Token Rules
- **Preserved color system**: Do not replace, rename, or visually reinterpret the existing palette. The required color values remain:
  - Primary Background: `#FFFFFF`
  - Secondary Background: `#F8FAFC`, `#F1F5F9`
  - Primary Blue: `#2563EB`, `#3B82F6`
  - Success Green: `#16A34A`, `#22C55E`
  - Gold Accent: `#C8A96B`
  - Error Red: `#DC2626`
- **Text hierarchy**:
  - Primary text: `#0F172A`
  - Secondary text: `#475569`
  - Muted text: `#64748B`
  - Hairline borders/dividers: `#E2E8F0`
  - Soft surfaces: `#F8FAFC`, `#F1F5F9`
- **State color usage**:
  - Blue is reserved for primary actions, active navigation, selected rows, links, focused components, and chart primary series.
  - Green is reserved for paid, confirmed, success, verified, completed, and positive deltas.
  - Red is reserved for overdue, failed, destructive, invalid, and attention-critical states.
  - Gold is ceremonial and premium only: receipts, trust seals, section accents, and high-level recognition. Never use gold for ordinary CTAs.
- **Spacing scale**: Use an 8px base grid with 4px sub-steps for dense UI.
  - `0`: 0px
  - `1`: 4px
  - `2`: 8px
  - `3`: 12px
  - `4`: 16px
  - `5`: 20px
  - `6`: 24px
  - `8`: 32px
  - `10`: 40px
  - `12`: 48px
  - `16`: 64px
  - `20`: 80px
- **Border rules**: Prefer 1px borders using `#E2E8F0`; use shadows to create depth only for elevated surfaces, not every panel.
- **Density rule**: Admin screens should feel efficient and scannable. Public/member screens may breathe more, but must never become marketing-heavy.

### 3. Information Architecture
- **Public**: Landing/Home, Pay Now (guest), Payment Success, Receipt, Support.
- **Member**: Dashboard, History, Profile/Family, Notifications.
- **Admin**: Dashboard, Members, Payments Ledger, Cash Entry, Defaulters, Reports, Audit Log, Settings.

#### 3.1 Navigation Hierarchy
- **Public navigation**: Keep minimal. Primary action is Pay Now. Secondary actions are Login and Support.
- **Member navigation**: Prioritize Dashboard, History, Profile/Family, and Notifications. Show payment due state prominently on every relevant member surface.
- **Admin navigation**: Sidebar order must mirror operating frequency:
  - Dashboard
  - Members
  - Payments Ledger
  - Cash Entry
  - Defaulters
  - Reports
  - Audit Log
  - Settings
- **Active state**: Active navigation uses `#2563EB` text/icon with a subtle `#F8FAFC` or `#F1F5F9` surface. Do not use heavy filled nav blocks.
- **Breadcrumbs**: Use on admin detail pages and deep report screens only. Keep labels short and bilingual only where clarity requires it.

### 4. Implementation Phasing

**Phase 1: Foundation & Landing Page (The First Step)**
- Initialize Next.js (App Router), Tailwind CSS, ShadCN UI.
- Configure Design System tokens in `tailwind.config.ts` & `globals.css`.
- Setup fonts (Inter + Noto Sans Malayalam).
- Build the Public Landing Page (Hero, Stats strip, Call to Actions).

**Phase 2: Authentication & Member Flow**
- OTP Login Mock/Setup.
- Member Dashboard (Dues, History, Family members).
- Payment Page (UPI integration prep, Cash acknowledgment mode).
- Payment Success & Receipt generation.

**Phase 3: Admin Core Features**
- Admin Layout (Sidebar/Header with bilingual greeting).
- Admin Dashboard (Stats, Quick Actions).
- Members List & Detail View.
- Cash Entry Flow.

**Phase 4: Advanced Admin & Settings**
- Defaulters View (Severe vs Current Month).
- Payments Ledger & Audit Log.
- Reports & Exports.
- Settings Panel.

---

## 5. Visual Hierarchy Rules

### 5.1 Layout Balance
- Every screen must have one clear primary job. The largest visual weight should belong to the user's next meaningful action or the most important financial state.
- Use calm horizontal alignment. Page titles, filters, table edges, chart panels, and footer actions should share consistent x-axis anchors.
- Avoid visual competition between stats, charts, and actions. If everything is emphasized, nothing is emphasized.
- Prefer grouped sections over scattered widgets. Each group should have a clear title, optional helper text, and consistent spacing.

### 5.2 Whitespace Standards
- **Mobile 320-767px**:
  - Page gutter: 16px
  - Section gap: 24px
  - Card internal padding: 16px
  - Form field gap: 14-16px
  - Button group gap: 8-12px
- **Tablet 768-1023px**:
  - Page gutter: 24px
  - Section gap: 32px
  - Card internal padding: 20-24px
  - Grid gap: 16-20px
- **Desktop 1024-1439px**:
  - Page gutter: 32px
  - Section gap: 40px
  - Card internal padding: 24px
  - Grid gap: 20-24px
- **Large desktop 1440px+**:
  - Content max width: 1280-1440px depending on screen
  - Page gutter: 40px
  - Section gap: 48px
  - Dashboard grid gap: 24px
- Dense admin tables may use 16px card padding when it improves information density without harming touch or readability.

### 5.3 Visual Rhythm
- Use a repeatable vertical rhythm: title block, control row, primary content, supporting content.
- Section headers should sit 16-20px above the content they label and 32-48px below the previous major section.
- In dashboards, top-level stats appear first, then operational charts, then recent activity and audit trails.
- Do not separate every small area with a border. Use spacing first, then subtle borders, then shadows only when hierarchy requires it.

### 5.4 Content Grouping And Scannability
- Group by user intent:
  - "What is due?"
  - "Who paid?"
  - "Who needs follow-up?"
  - "What changed?"
  - "What should I do next?"
- Use short labels, strong numeric formatting, and consistent status badges.
- Important financial totals should be visible without scrolling on dashboard landing screens.
- Use progressive disclosure for secondary details. Do not overload the first view with every audit or metadata field.

## 6. Advanced Typography System

### 6.1 Type Scale
- Display: 40px / 48px, 700 weight, used only on public hero and major success states.
- H1: 30px / 38px, 700 weight, page titles.
- H2: 24px / 32px, 650-700 weight, major sections.
- H3: 20px / 28px, 650 weight, cards and panels.
- Body: 16px / 24px, 400-500 weight.
- Small: 14px / 20px, 400-500 weight.
- Caption: 12px / 16px, 500 weight, metadata and table helpers.
- Do not scale font sizes fluidly with viewport width. Use breakpoint-based changes only.

### 6.2 Letter Spacing
- English headings: 0 letter spacing.
- Malayalam text: 0 letter spacing; never tighten.
- Numeric labels and table metadata: 0 letter spacing.
- All-caps labels, if used sparingly: `0.04em` maximum.

### 6.3 Numeric Typography
- Use tabular numerals for all financial amounts, IDs, dates, receipt numbers, and dashboard metrics.
- Align currency amounts by decimal or right edge in tables.
- Format rupee amounts consistently:
  - Compact stat: `₹12,450`
  - Detailed row: `₹12,450.00` only when paise-level precision exists.
  - Empty/unknown: `--`, never `0` unless the amount is truly zero.
- Positive deltas use green; overdue or unpaid values use red. Neutral comparisons use muted text.

### 6.4 Malayalam + English Rendering
- Use Inter for English and numerals, Noto Sans Malayalam for Malayalam.
- Malayalam line height must be slightly more generous: minimum 1.5 for body text and 1.35 for headings.
- Avoid mixing Malayalam and English in the same compact button unless the label remains readable at 320px.
- Bilingual labels should follow the pattern: primary user language first, secondary translation in smaller muted text where needed.
- Malayalam text must not be visually squeezed inside badges, pills, or narrow table columns.

### 6.5 Heading Rhythm
- Page title blocks include title, optional subtitle, and optional action cluster.
- Title-to-subtitle gap: 6-8px.
- Title block-to-content gap: 24-32px.
- Card heading-to-body gap: 12-16px.
- Avoid more than two heading sizes within one card.

### 6.6 Financial Amount Styling
- Amounts are treated as product-critical data.
- Dashboard total amounts: 28-34px, 700 weight, tabular numerals.
- Card-level amounts: 20-24px, 700 weight.
- Table amounts: 14-15px, 600 weight, right aligned.
- Receipt totals: 24-30px, 700 weight with clear supporting metadata.

## 6A. Brand Typography Rules (SSF Branding)

### 6A.1 Dedicated Brand Font (Strict Rule)

* Use **Cooper Black** as the dedicated **SSF brand font**.
* Cooper Black is already installed locally in the development environment.
* Treat Cooper Black as a **brand identity layer only**, never as a general UI font.

### Allowed Usage (ONLY)

Cooper Black may be used **ONLY** when rendering the exact text:

**SSF**

Examples:

* SSF logo text
* SSF wordmark
* SSF brand header

### Strict Restrictions

Cooper Black must **NEVER** be used for any text other than **“SSF”**.

This includes:

* Unit name text (example: Alparamba, Kodassery, North Unit)
* Paragraphs
* Buttons
* Forms
* Tables
* Dashboard headings
* Reports
* Receipt body content
* Navigation
* Labels
* Analytics numbers
* Error messages
* Event names
* Special headers
* Hero titles (except the exact text “SSF”)

Examples:

* **SSF Alparamba** → Only **SSF** uses Cooper Black; **Alparamba** must use Inter / Noto Sans Malayalam
* **SSF Sahithyolsav** → Only **SSF** uses Cooper Black
* **SSF Unit Dashboard** → Only **SSF** uses Cooper Black

### Typography Hierarchy

* **SSF** → Cooper Black
* English UI Text → Inter
* Malayalam UI Text → Noto Sans Malayalam
* Numbers / Financial Data → Inter (Tabular Numerals)

This is a strict branding rule and must be followed by all agents and developers.


### 6A.2 Approved Cooper Black Usage
- Use Cooper Black only for:
  - `SSF`
  - SSF branding text
  - Main hero brand title when appropriate
  - Logo wordmark
  - Unit Name title
  - Premium ceremonial headings
  - Special highlighted titles
  - Branded receipt title
  - Event-style titles such as `SSF Sahithyolsav`
- Cooper Black should feel intentional, rare, and premium.
- Use Cooper Black at display or heading scale only. Avoid using it below 20px unless it is part of a compact logo lockup.

### 6A.3 Prohibited Cooper Black Usage
- Do not use Cooper Black for:
  - Body text
  - Paragraphs
  - Tables
  - Forms
  - Dashboard data
  - Analytics numbers
  - Buttons
  - Small labels
  - Navigation items
  - Error messages
  - Helper text
- Reason: Cooper Black is decorative and heavy. Overuse harms readability, data clarity, and premium product restraint.

### 6A.4 Primary UI Fonts
- Continue using Inter for English UI.
- Continue using Noto Sans Malayalam for Malayalam UI.
- Use Inter and Noto Sans Malayalam for:
  - Dashboard
  - Forms
  - Reports
  - Tables
  - Analytics
  - Navigation
  - Buttons
  - Labels
  - Body content

### 6A.5 Typography Layering
- Brand Layer: Cooper Black.
- UI Layer: Inter and Noto Sans Malayalam.
- Financial/Data Layer: Inter with tabular numerals.
- This hierarchy ensures:
  - Brand identity feels unique.
  - UI remains highly readable.
  - Financial data remains clean, precise, and trustworthy.

## 7. Advanced Card System

### 7.1 Base Card
- Background: `#FFFFFF`
- Border: 1px solid `#E2E8F0`
- Radius: 20px
- Padding:
  - Mobile: 16px
  - Tablet: 20px
  - Desktop: 24px
- Shadow: default none or very soft. Use the existing soft shadow only when the card needs elevation.
- Cards must align to a grid and share consistent heights within the same row where practical.

### 7.2 Elevation Levels
- Level 0: Flat card, border only. Use for tables, settings groups, and dense admin panels.
- Level 1: Soft shadow. Use for dashboard stat cards and important action panels.
- Level 2: Elevated overlay. Use for modals, popovers, command menus, and critical confirmation panels.
- Avoid stacking multiple shadows. Elevation should feel precise, not decorative.

### 7.3 Hover And Press Behavior
- Desktop hover: subtle border darkening, `translateY(-1px)` maximum, shadow slightly increases.
- Press state: return to neutral position with a slightly stronger border or reduced opacity.
- Mobile: no hover-only affordances. Make tappable areas obvious through layout and labels.
- Transition duration: 150-220ms ease-out.

### 7.4 Nested Cards
- Avoid card-inside-card layouts. If inner grouping is required, use a soft surface band with `#F8FAFC`, 12-16px padding, and lighter border.
- Nested surfaces should not have independent shadows.
- Receipts may use inner bordered rows for structured payment metadata.

### 7.5 Stat Cards
- Required structure:
  - Label
  - Primary metric
  - Delta/status/helper text
  - Optional icon badge
- Metric must dominate the card. Label and helper text stay muted.
- Use icons sparingly and consistently. Icons support meaning; they do not decorate.
- Use one accent color per stat card based on status.

### 7.6 Financial Cards
- Show amount, status, due period, and action in a predictable order.
- Paid cards emphasize confirmation and receipt access.
- Due cards emphasize amount and payment action.
- Overdue cards use red only for the status and critical amount, not the entire card.

### 7.7 Mobile Compression
- Cards collapse to single-column.
- Reduce padding to 16px and gap to 12-16px.
- Hide secondary metadata behind "View details" where the card would exceed comfortable height.
- Keep primary amount and status visible without expansion.

## 8. Dashboard Composition

### 8.1 Admin Dashboard
- First viewport priority:
  - Total collected
  - Pending amount
  - Paid members
  - Defaulters / overdue members
  - Quick actions: Add cash entry, View defaulters, Export report
- Layout:
  - Desktop: 4 stat cards across top, followed by chart + recent activity.
  - Tablet: 2x2 stat grid, then chart, then recent activity.
  - Mobile: single-column stat cards, quick actions as horizontal scroll or compact stacked buttons.
- Quick actions should be near the top-right on desktop and directly below stats on mobile.
- Recent activity should remain visible within the first two scroll lengths on all devices.

### 8.2 Member Dashboard
- First viewport priority:
  - Current due amount/status
  - Pay Now or View Receipt action
  - Recent payment history
  - Family/profile summary
- Use a calm, reassuring tone. Do not make unpaid states feel punitive unless severely overdue.
- The member dashboard should require no financial interpretation: state what is due, why, and what action is available.

### 8.3 Chart Placement
- Charts must appear after top-level numeric summary, not before.
- The main chart should occupy the widest available column.
- Secondary charts must not compete with the primary collection trend.
- Empty charts still reserve stable layout space to prevent jumps.

### 8.4 Scroll Flow
- Top of page answers "current state."
- Middle of page answers "trend and details."
- Bottom of page answers "history and audit."
- Avoid placing critical actions at the very bottom unless duplicated near the relevant data.

## 9. Advanced Responsive Rules

### 9.1 Breakpoints
- Mobile: 320-767px
- Tablet: 768-1023px
- Desktop: 1024-1439px
- Large Desktop: 1440px+

### 9.2 Mobile 320-767px
- Grid: 1 column.
- Page gutter: 16px.
- Sidebar: replaced by bottom navigation for member views and slide-over drawer for admin views.
- Tables: convert to cards or prioritized rows.
- Cards: full width, 16px padding.
- Forms: single column, sticky submit bar for long payment/cash-entry forms.
- Charts: single chart per row, simplified axis labels, tooltip on tap.
- Primary actions: full width when they are the main task.

### 9.3 Tablet 768-1023px
- Grid: 2 columns for stats; 1-2 columns for forms depending on content.
- Sidebar: collapsible rail or drawer depending on available width.
- Tables: keep tabular layout for simple datasets; use horizontal overflow for dense ledgers with sticky first column.
- Cards: 20px padding.
- Charts: allow two small charts side by side only when labels remain legible.

### 9.4 Desktop 1024-1439px
- Grid: 12-column system.
- Sidebar: persistent admin sidebar.
- Content max width: 1280px for operational screens unless a table needs full width.
- Tables: full tabular experience with sticky headers and column controls where useful.
- Cards: 24px padding.
- Forms: 2-column layout for related fields, single-column for high-risk fields requiring attention.

### 9.5 Large Desktop 1440px+
- Grid: 12 columns with wider analytical layouts.
- Content max width: 1440px.
- Avoid stretching text-heavy content. Keep reading columns max 720px.
- Use extra width for side panels, comparative reports, and persistent recent activity, not oversized typography.

## 10. Data Visualization Rules

### 10.1 Chart Styling
- Use the preserved palette:
  - Primary series: `#2563EB`
  - Secondary series: `#3B82F6`
  - Success series: `#16A34A`
  - Positive highlight: `#22C55E`
  - Warning/overdue series: `#DC2626`
  - Ceremonial/target marker: `#C8A96B`
- Chart backgrounds remain white or `#F8FAFC`.
- Grid lines should be subtle `#E2E8F0` at low visual weight.
- Axis labels use muted text and tabular numerals.

### 10.2 Financial Visualization Hierarchy
- Always show the key number above or beside the chart.
- Charts explain trend; stat cards communicate current totals.
- For collection reports, prioritize:
  - Collected amount
  - Pending amount
  - Collection rate
  - Paid vs unpaid members
  - Month-over-month movement

### 10.3 Empty Chart States
- Preserve the chart container height.
- Show a quiet empty state with a small icon, title, and one helpful sentence.
- Provide the next action when relevant, such as "Record first payment" or "Adjust date range."

### 10.4 Mobile Chart Compression
- Reduce x-axis label density.
- Use horizontal scroll only for time-series charts where compression harms meaning.
- Tooltips must be tap-friendly and must not overflow the viewport.
- Legends can collapse into inline labels or a small segmented control.

### 10.5 Export-Friendly Charts
- Reports and exports must render with sufficient contrast on white backgrounds.
- Avoid interaction-only meaning; exported charts need visible labels, legends, and date range.
- Include organization name, report title, date range, generated date, and total values in export layouts.

## 11. Table System Standards

### 11.1 Desktop Tables
- Header row is sticky within scroll containers.
- Header background: `#F8FAFC`.
- Row height:
  - Dense ledger: 44-48px
  - Standard member rows: 52-56px
  - Rich rows with metadata: 64px
- Row hover: subtle `#F8FAFC`.
- Selected row: light blue-tinted state using `#F8FAFC` with blue border/accent.
- Sortable headers show clear sort affordance and keyboard focus.
- Numeric columns are right aligned with tabular numerals.
- Status columns use badges with consistent labels.

### 11.2 Column Priority
- Members:
  - Required: Name, Member ID, Phone, Status, Due Amount, Last Paid, Actions
  - Optional: Area, Family count, Notes
- Payments:
  - Required: Date, Receipt ID, Member, Method, Amount, Status, Recorded By
  - Optional: Reference ID, Notes, Verified At
- Audit Logs:
  - Required: Time, Actor, Action, Entity, Summary
  - Optional: IP/device, Before/After details
- Reports:
  - Required: Period, Collected, Pending, Paid Members, Defaulters, Export

### 11.3 Mobile Table Fallback
- Convert each row into a compact card.
- Top row: primary identifier + status badge.
- Second row: key amount/date.
- Metadata appears in two-column label/value pairs.
- Secondary actions move into a kebab menu or "View details."
- Expandable rows may reveal audit metadata, payment references, and notes.

### 11.4 Empty And Partial Tables
- Empty tables show a purpose-specific empty state, not a blank rectangle.
- Loading tables use skeleton rows matching the final row height.
- Partial data states must clearly mark missing values as `--` or "Not recorded."

## 12. Form UX Standards

### 12.1 Form Structure
- Put high-confidence, commonly known fields first.
- Group related fields with clear headings: Member Details, Payment Details, Verification, Notes.
- Long forms should have a sticky footer with primary and secondary actions.
- Destructive or irreversible actions require confirmation.

### 12.2 Field States
- Default: white surface, subtle border.
- Hover: slightly darker border.
- Focus: blue ring using `#2563EB`, visible and accessible.
- Error: red border, red helper text, concise message below field.
- Success: green helper text only when confirmation is useful.
- Disabled: muted text, low-contrast surface, no hover elevation.
- Read-only: visually distinct from disabled; readable and copyable.

### 12.3 Validation
- Validate required fields on blur and submit.
- Validate payment amounts immediately for invalid characters and impossible values.
- Keep error text specific: "Enter a valid phone number" instead of "Invalid input."
- Summary errors appear at the top only when multiple fields fail.
- Preserve user input after validation errors.

### 12.4 Keyboard Navigation
- Logical tab order from top-left to bottom-right.
- Enter submits only when the form is valid or expected.
- Escape closes non-destructive modals/drawers.
- All custom controls must support keyboard operation and visible focus.

### 12.5 Mobile Form UX
- Use numeric keyboards for phone numbers, OTPs, and amounts.
- Keep labels visible; do not rely on placeholder-only labels.
- Use full-width primary buttons.
- Sticky submit bar should not cover fields or validation text.
- OTP fields must support paste.

## 13. Microinteraction Rules

- **Hover transitions**: 150-220ms, subtle color, border, or elevation shifts only.
- **Press states**: immediate 80-120ms feedback through slight scale, shade, or opacity change.
- **Buttons**: show loading state with spinner or progress text; prevent duplicate submissions.
- **Success animations**: use a restrained checkmark or brief fade/slide. Maximum 600ms.
- **Navigation transitions**: content fade/slide under 220ms. Avoid dramatic page movement.
- **Loading skeletons**: match real component dimensions and preserve layout stability.
- **Toast behavior**: appear within 300ms, auto-dismiss non-critical success after 4-5 seconds, keep errors until dismissed or resolved.
- **Reduced motion**: respect user reduced-motion preferences by removing transform animations.

## 14. Component Quality Standards

### 14.1 Buttons
- Variants: primary, secondary, ghost, destructive, success, icon-only.
- Sizes:
  - Small: 32-36px height
  - Default: 40-44px height
  - Large/payment: 48px height
- Primary buttons use `#2563EB`; success confirmation may use `#16A34A`.
- Destructive buttons use `#DC2626` and require clear intent.
- Icon-only buttons require accessible labels and tooltips on desktop.

### 14.2 Inputs
- Height: 40-44px desktop, 44-48px mobile.
- Label above field, helper/error below field.
- Prefix/suffix support for currency, phone, and search.
- Amount inputs must visually emphasize the numeric value and use tabular numerals.

### 14.3 Badges
- Use for status only, not decoration.
- Variants: Paid, Pending, Overdue, Failed, Verified, Cash, UPI, Admin, Member.
- Badge text should remain readable in Malayalam and English.
- Avoid bright filled badges for low-priority states; use soft backgrounds with strong text.

### 14.4 Modals
- Use for focused confirmation or small tasks.
- Max width: 420-560px depending on content.
- Mobile: convert to bottom sheet when action-oriented.
- Primary action sits bottom-right on desktop, full-width at bottom on mobile.
- Trap focus and restore focus to trigger after close.

### 14.5 Drawers
- Use for member details, filters, audit previews, and quick edits.
- Desktop width: 420-520px.
- Mobile: full-width sheet.
- Include clear title, close button, scrollable body, and sticky action footer when actions exist.

### 14.6 Toasts
- Position: top-right desktop, bottom mobile above navigation.
- Success toasts are brief and calm.
- Error toasts include recovery guidance when possible.
- Do not use toasts for information that must be permanently visible.

### 14.7 Skeletons
- Skeletons should match final content shape.
- Use for stats, tables, charts, and cards.
- Avoid showing a full-screen spinner unless the whole app is booting.

### 14.8 Charts
- Must include title, date range/context, and accessible text summary.
- Interactive charts require keyboard-reachable data summaries or table alternatives.
- Do not rely on color alone to distinguish series.

### 14.9 Tables
- Include search/filter controls when datasets are large.
- Use pagination or infinite loading only where dataset size requires it.
- Preserve selected filters and sort state during navigation.

## 15. Empty, Loading, Error, Partial, And No-Data States

### 15.1 Global Rules
- Every screen must define:
  - Empty state
  - Loading state
  - Error state
  - Partial data state
  - No-data state after filters/search
- State messages should be useful, calm, and action-oriented.
- Preserve layout stability between loading and loaded states.

### 15.2 Public Screens
- Landing/Home: loading should not block primary CTA; show stable hero and stats placeholders.
- Pay Now: empty lookup shows clear instruction; invalid lookup shows specific recovery path.
- Payment Success: always show receipt access and next action.
- Receipt: if data is unavailable, show a recoverable error with support option.
- Support: empty FAQ/search results should suggest contact action.

### 15.3 Member Screens
- Dashboard: no dues state should feel positive and provide receipt/history access.
- History: no payments state explains that records will appear after payment is recorded.
- Profile/Family: partial family data should show missing fields clearly.
- Notifications: empty state confirms there are no new updates.

### 15.4 Admin Screens
- Dashboard: partial data should show available stats and mark unavailable sections.
- Members: no search result should preserve filters and offer reset.
- Payments Ledger: empty state should explain whether no payments exist or filters are excluding them.
- Cash Entry: success state should provide receipt/ledger next actions.
- Defaulters: empty state should feel positive and confirm no current defaulters.
- Reports: no data state should suggest changing period or exporting an empty report only when appropriate.
- Audit Log: empty state should be rare; show system message if logs are unavailable.
- Settings: loading states should be field-level, not full-page when possible.

## 16. Accessibility Standards

- Minimum touch target: 44x44px.
- Text contrast must meet WCAG AA minimums.
- Focus rings must be visible on all interactive elements and use `#2563EB`.
- Do not remove outlines without a stronger replacement.
- All icons used as controls require accessible names.
- Forms require programmatic labels, helper text associations, and error associations.
- Tables require header associations and keyboard-accessible sorting.
- Modals and drawers require focus trap, escape handling, and focus return.
- Malayalam text must remain legible at small sizes; avoid captions below 12px.
- Color cannot be the only status signal. Use text labels and icons where appropriate.
- Reduced-motion preference must be respected.
- Screen reader announcements are required for payment success, payment failure, form errors, and saved settings.

## 17. Premium Polish Guidelines

- The product should feel financially trustworthy before it feels visually impressive.
- Alignment must be exact. Edges of headings, cards, filters, tables, and actions should form clean vertical lines.
- Use fewer, better surfaces. Do not over-card the interface.
- Keep shadows soft and rare. Premium SaaS quality comes from spacing, typography, hierarchy, and restraint.
- Financial amounts, statuses, and receipt IDs must be impossible to misread.
- Every primary workflow should end with confirmation, receipt, or a clear saved state.
- Avoid vague labels such as "Submit" when a specific action exists. Use "Record Payment," "Save Member," "Export Report," or "Send Reminder."
- Trust signals:
  - Clear receipt numbers
  - Recorded by / verified by metadata
  - Audit log visibility
  - Export timestamps
  - Transparent payment status
- Pixel perfection checklist before shipping any screen:
  - All text fits at 320px width.
  - Buttons do not wrap awkwardly.
  - Malayalam and English both render cleanly.
  - Empty/loading/error states are implemented.
  - Focus states are visible.
  - Tables have mobile fallbacks.
  - Amounts use tabular numerals and consistent alignment.
  - Critical actions are reachable without hunting.
  - No decorative element competes with financial data.
- The final impression should be: this is a serious, carefully built community finance product from a top-tier software team.

## 18. Asset Management Rules

- Agents must not introduce new visual assets without product owner approval.
- This restriction includes:
  - Icons
  - Illustrations
  - Background graphics
  - SVG decorations
  - Stock images
  - Animations
- Allowed assets:
  - Approved logo
  - Approved icon library
  - Approved UI graphics
- If new assets are needed, ask the product owner first.
- Do not add decorative SVGs, stock-style graphics, or background patterns unless explicitly approved.

## 19. Component Naming Convention

- Use clear, consistent, production-ready component names.
- Approved naming examples:
  - `StatsCard`
  - `MemberCard`
  - `PaymentTable`
  - `ReportChart`
  - `CashEntryForm`
- Avoid temporary, vague, or numbered names:
  - `Card1`
  - `NewCard`
  - `TempComponent`
  - `TestSection`
- Component names should describe product purpose, not visual appearance alone.
- Prefer domain-specific names where useful, such as `DefaulterTable`, `ReceiptHeader`, `PaymentStatusBadge`, or `MemberSummaryPanel`.

## 20. Mobile Priority Rule

- This project is mobile-first.
- When a design decision conflicts between mobile and desktop, mobile UX gets priority.
- Rules:
  - Never sacrifice mobile usability for desktop aesthetics.
  - All screens must work perfectly on small screens first.
  - Desktop enhancements are secondary.
  - Critical payment, receipt, member, and admin tasks must be usable at 320px width.
  - Touch targets, readable Malayalam text, visible actions, and clear financial amounts are mandatory on mobile.

## 21. Future Expansion Compatibility

- All implementations must remain scalable for future features.
- Possible future expansions:
  - WhatsApp automation
  - AI analytics
  - Multi-unit SaaS
  - Advanced accounting
  - Notification systems
- Avoid rigid architecture and hard-coded assumptions that block future product growth.
- Design components, layouts, and naming patterns so they can support multiple units, richer analytics, new communication channels, and more advanced financial workflows.
- Do not overbuild future features now. Preserve flexibility while implementing the current approved feature set.

## 22. Product Owner Override Rule

- The product owner has final authority over all UI decisions.
- For this project, the product owner is the person giving implementation instructions.
- If the product owner explicitly requests any UI modification, agents must allow and implement the change.
- Product owner requests may include:
  - Change colors
  - Change spacing
  - Redesign cards
  - Modify layout
  - Add new sections
  - Replace components
  - Update typography
- These changes are fully allowed when directly requested by the product owner.
- Do not reject requested changes by citing previous UI lock rules.

## 23. Confirmation Rule For Major UI Changes

- For major visual changes, agents must follow this process:
  - Understand the requested change.
  - Explain the expected visual impact.
  - Ask for confirmation if ambiguity exists.
  - After confirmation, implement the change.
- If the product owner request is clear and specific, proceed with implementation.
- If the request has multiple reasonable interpretations, ask a concise clarification question before editing.
- Do not use confirmation as a way to resist or delay a clear product owner instruction.

## 24. Priority Hierarchy

- UI authority order:
  - Product Owner latest instruction (highest priority)
  - Approved `UI_PLAN_V2`
  - Existing implementation
  - Agent recommendations (lowest priority)
- Meaning: if the product owner says "Change this," that instruction overrides `UI_PLAN_V2`.
- Agents may still explain tradeoffs, but the product owner's latest explicit direction is authoritative.

## 25. Master Specification Authority Rules

### 25.1 Master Specification Files

- This project has two master specification files:
  - `UI_PLAN_V2`
  - `ARCHITECTURE_PLAN`
- These two files together form the project constitution.

### 25.2 UI Authority File

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

### 25.3 Architecture Authority File

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

### 25.4 Mandatory Rule

- All agents and developers must follow both files together.
- Build is allowed only when implementation satisfies both:
  - `UI_PLAN_V2`
  - `ARCHITECTURE_PLAN`
- Not one. Both are mandatory.

### 25.5 Forbidden Behavior

- Agents must never:
  - Ignore `UI_PLAN_V2`
  - Ignore `ARCHITECTURE_PLAN`
  - Follow only one file
  - Make assumptions outside these files
  - Introduce architectural changes without approval
  - Introduce UI changes without approval

### 25.6 Conflict Resolution Rule

- If implementation creates ambiguity:
  - Step 1: Check `UI_PLAN_V2`.
  - Step 2: Check `ARCHITECTURE_PLAN`.
  - Step 3: If ambiguity still exists, stop and ask the product owner for clarification.
- Do not assume.

### 25.7 Implementation Rule

- Before building any feature, page, component, route, or layout, agents must verify:
  - Does this follow `UI_PLAN_V2`?
  - Does this follow `ARCHITECTURE_PLAN`?
- If either answer is no, do not proceed.

### 25.8 Priority Order

- Implementation priority:
  - Product Owner Latest Instruction
  - `UI_PLAN_V2`
  - `ARCHITECTURE_PLAN`
  - Existing Codebase
  - Agent Suggestions
- This priority order is mandatory.

### 25.9 Final Rule

- No page, component, route, or feature may be built unless both master files are respected.
