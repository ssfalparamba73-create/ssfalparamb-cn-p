<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project Constitution For All Agents

Before building, editing, redesigning, refactoring, or adding any page, route, layout, component, or feature, every agent must read and follow both master specification files:

1. `UI_PLAN_V2.md`
2. `Architecture_Plan.md`

Before implementing, refactoring, replacing mocks, wiring APIs, creating database schema, adding Supabase migrations, writing RLS policies, changing authentication, or adding any backend-related feature, every agent must also read and follow:

3. `Backend_Architecture_Supabase_Plan.md`

These required specification files are mandatory. Do not follow only one.

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
