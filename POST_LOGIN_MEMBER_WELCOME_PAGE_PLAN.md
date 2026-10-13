# Post-login Member Welcome Page — Implementation Plan

**Status:** Implemented locally — lint, type check, and production build pass
**Last reviewed:** 2026-10-12

## Goal

After a member logs in, show a responsive member dashboard inspired by the supplied mobile app layout. Reuse the existing community image, payment, community, history, profile, and recent activity features. The screenshot provides layout guidance only; its attendance and college-specific content are not copied.

## Scope

- Keep the public landing page (`/`) unchanged.
- Keep the current login and OTP screens unchanged.
- Keep the existing member route `/member/dashboard`; do not add another route or an extra redirect page.
- Reorder/extend only the content shown after a member completes login and profile setup.
- Keep payment history below the welcome, due status, and quick actions.

## Current flow

- Successful member OTP login sends a complete-profile member to `/member/dashboard`.
- Members who still need to complete their profile go to `/member/complete-profile` and then continue to `/member/dashboard`.
- Before this update, the dashboard showed the member greeting, `DueStatusCard`, and recent activity, with payment/due information dominating the first view.
- `/pay` currently supports `monthly_dues` and `special_event` categories.
- Member accounts are admin-enrolled; this plan does not add public self-registration.

## Implemented page order

1. **Welcome heading:** greet the signed-in member by name and show their existing member code.
2. **Community image panel:** reuse the existing optimized social share image in a dismissible responsive frame.
3. **Due status:** retain the current amount, status, and Pay Now behavior.
4. **Quick actions:** link to the existing Pay, Community, Payment History, and Profile routes, respecting the payment feature flag.
5. **Recent activity:** retain the existing payment activity below the primary dashboard content.

The image panel and quick actions are compact enough that the current due amount/status and Pay Now action remain easy to find on mobile and desktop.

## Media behavior

- Use one optimized static image; no video playback, carousel, autoplay, or media JavaScript package in this phase.
- Reuse `next/image` and the existing asset pipeline. Prefer a compressed WebP/AVIF source with an intentional aspect ratio and responsive crop.
- Add meaningful alt text, reserve the image frame dimensions to prevent layout shift, and provide a fallback if the asset is unavailable.
- Keep the component simple so video can be considered later without changing this page's structure.
- Use an approved public asset; do not add upload controls or a new Storage bucket.

## Donation and payment rules

- Current payment categories are `monthly_dues` and `special_event`; there is no distinct `donation` category in the current payment DTO/schema.
- Unless a separate donation flow is approved, “Community / Donation” is explanatory content and any payment action must keep the existing category, amount validation, receipt, and accounting behavior. Do not label monthly dues as a tax-deductible donation or silently record an unrestricted donation as dues.
- A separately tracked donation would need defined amount rules, receipt wording, refunds/cancellations, reporting, and admin review. That requires an approved backend plan and additive end-to-end implementation, not a display-only change.

## UI and responsive requirements

- Follow `UI_PLAN_V2.md` tokens, typography, approved component style, spacing, and member-dashboard hierarchy.
- Render a compact phone dashboard and a distinct wide desktop dashboard at the existing `/member/dashboard` route; share the same member data and actions.
- Mobile: compact one-column layout with 16px page gutter, circular quick actions, and no horizontal overflow.
- Tablet/desktop: use a wider dashboard container, with the community image and due status balanced side by side and larger quick actions.
- Preserve a calm community tone. The image supports the welcome; it must not overpower payment status or amount due.
- Respect reduced-motion preferences; no autoplay audio/video.

## Architecture touchpoints

- `src/app/member/dashboard/page.tsx` — render separate compact mobile and wide desktop dashboard layouts; retain the existing dashboard data query.
- `src/components/dashboard/DueStatusCard.tsx` — preserve due amount, status, and payment action; adjust placement only if needed for the approved order.
- `src/components/dashboard/RecentActivityCard.tsx` — keep recent activity below the primary page content.
- `src/components/member/MemberWelcomeBanner.tsx` — render the community image.
- `src/components/member/MemberDashboardQuickActions.tsx` — link to existing member actions; no new route is required.
- Do not change `src/app/page.tsx`, `/login`, `/otp-verification`, or `/pay` for this request.
- Keep `Architecture_Plan.md` route map unchanged: `/member/dashboard` remains the protected member dashboard.

## Implementation sequence

1. Confirm whether “Donation” is explanatory copy or a separately tracked payment category.
2. Select and optimize the approved community image; confirm usage rights, alt text, and crop.
3. Implement the image and community welcome section on `/member/dashboard` using existing tokens/components.
4. Place the current payment option and Pay Now action directly beneath the welcome section while preserving all existing payment data and validation.
5. Verify complete-profile and incomplete-profile login paths still lead to their current routes.
6. Check 320px, 768px, 1024px, and desktop widths; verify keyboard focus and screen-reader labels.
7. Run lint, type, build, and relevant signed-in member flow checks before merging.

## Acceptance criteria

- Only the signed-in member dashboard changes; the public landing, login, OTP, and payment pages remain unchanged.
- After login, a member sees a welcome image, due status, quick actions, and recent activity.
- The due amount/status and Pay Now action remain easy to find without navigating elsewhere.
- Existing OTP, profile completion, payment history, and `/pay` behavior remain intact.
- The page works at mobile, tablet, and desktop sizes without overlap or horizontal scrolling.
- Image alt text and a reserved aspect ratio are in place; the image is bundled locally at `/social/ssf-alparamba-share.png`.
- No new route, public self-registration, video dependency, donation category, migration, or Storage bucket is added in phase 1.

## Decisions before implementation

- Should “Donation” be explanatory copy for the existing contribution option, or a separately recorded donation? Recommended for phase 1: explanatory copy only unless amount, receipt, reporting, and accounting rules are approved.
- Which approved community image should be shown, and what caption/alt text should it use?
