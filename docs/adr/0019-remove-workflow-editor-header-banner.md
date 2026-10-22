# 19. Remove Workflow Editor Header Banner

Date: 2026-10-22

## Status

Accepted

## Context

Following the design pattern established in the project chat view (where redundant headers, breadcrumbs, and metadata banners were removed in favor of a minimal, full-screen canvas), the workflow editor page (`workflows/[id]`) retained a large header banner displaying the workflow title, group/skill count badges, a long description placeholder, and a 3-dot dropdown menu.

Because workflows are already named, selected, and renamed via double-click in the persistent sidebar (and deleted via the sidebar's direct delete action), the top banner in the editor view was redundant and occupied valuable vertical space needed for editing sequence steps and skills.

## Decision

1. **Remove Header Banner from Workflow Detail/Edit**:
   - Completely removed the top workflow banner containing the duplicate title heading, badges, description paragraph, and 3-dot dropdown menu from [`client/app/workflows/[id]/page.tsx`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/workflows/[id]/page.tsx).
2. **Consolidate Actions in Sequence Steps Toolbar**:
   - Moved the primary `Launch Run` and `+ Add Group` buttons directly into the top toolbar of the Sequence Steps section.
   - Retained complete functionality without any visual clutter or redundant headers.

## Consequences

- The workflow editing view is now clean, minimal, and fully dedicated to step groups and skill sequence composition.
- Matches the minimal full-screen aesthetic of the project conversation interface.
- Workflow renaming and deletion remain easily accessible via the left sidebar.
