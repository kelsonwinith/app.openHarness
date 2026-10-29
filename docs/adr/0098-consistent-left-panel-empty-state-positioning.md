# 0098. Consistent Left Panel Empty State Positioning

Date: 2026-10-28

## Status
Accepted

## Context
When searching or viewing the left panel with zero items in Projects and Workflows, the "No projects found" and "No workflows found" empty states differed in positioning, padding, and layout structure. In the project sidebar, items were unnested, while the workflow sidebar had intermediate wrapper divs, resulting in inconsistent vertical alignment and layout jumping. Additionally, `WorkflowsLayout` had differing main container flex properties compared to `ProjectsLayout`.

## Decision
1. **Left Panel Parity**:
   - Updated both [project-sidebar.tsx](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/layout/project-sidebar.tsx) and [workflow-sidebar.tsx](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/layout/workflow-sidebar.tsx) with identical structural hierarchy:
     - Header: fixed `h-7` top row with clickable uppercase category link (`Projects` / `Workflows`), count badge, action button, and search input with identical padding and icon positioning.
     - Content area: `flex-1 overflow-y-auto p-2 flex flex-col min-h-0`.
     - Empty state: centered vertically and horizontally using `flex flex-1 flex-col items-center justify-center p-6 text-center` with `h-7 w-7 text-muted-foreground/40 mb-2` icons.
2. **Layout Sizing Parity**:
   - Standardized [workflows/layout.tsx](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/workflows/layout.tsx) `main` container to `<main className="flex-1 min-h-0 flex flex-col overflow-hidden">` matching [projects/layout.tsx](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/projects/layout.tsx).

## Consequences
- The "not found" empty state in the left panel for both Projects and Workflows now shares identical layout, padding, icon sizing, and vertical centering.
