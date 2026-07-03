<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Constitution For All Agents

Before building, editing, redesigning, refactoring, or adding any page, route, layout, component, or feature, every agent must read and follow both master specification files:

1. `UI_PLAN_V2.md`
2. `Architecture_Plan.md`

These two files together are mandatory. Do not follow only one.

## Authority

- `UI_PLAN_V2.md` is the single source of truth for UI:
  - Design system
  - Colors
  - Typography
  - Spacing
  - Components
  - Layout rules
  - Responsive behavior
  - Interaction rules
  - Visual hierarchy

- `Architecture_Plan.md` is the single source of truth for architecture:
  - Route map
  - Folder structure
  - Page hierarchy
  - Layout hierarchy
  - Build order
  - Component dependency map
  - Shared layouts
  - Navigation structure

## Mandatory Implementation Check

Before implementation, verify:

1. Does this follow `UI_PLAN_V2.md`?
2. Does this follow `Architecture_Plan.md`?

If either answer is no, stop and ask the product owner for clarification.

## Priority Order

1. Product owner latest instruction
2. `UI_PLAN_V2.md`
3. `Architecture_Plan.md`
4. Existing codebase
5. Agent suggestions

## Forbidden Behavior

Agents must never:

- Ignore `UI_PLAN_V2.md`
- Ignore `Architecture_Plan.md`
- Make assumptions outside these files
- Introduce architectural changes without approval
- Introduce UI changes without approval
- Redesign the approved landing page without explicit product owner instruction

## Current Visual Baseline

The existing landing page is the approved V1 design foundation. Future pages must preserve its UI style, spacing, typography, color palette, component style, and visual hierarchy unless the product owner explicitly requests a change.
