# 24. Remove Workflow Group Pencil Icon

Date: 2026-10-22

## Status

Accepted

## Context

In keeping with the streamlined interaction design across Relay (where projects, sessions, and workflows rely strictly on direct double-click inline renaming rather than explicit edit buttons or modals), the workflow step group cards previously retained a visible pencil button next to the group name.

## Decision

1. **Removed Pencil Rename Button**:
   - Removed the `<Button><Edit2 /></Button>` pencil icon from `SortableGroupCard` in [`client/app/workflows/[id]/page.tsx`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/workflows/[id]/page.tsx).
2. **Standardized Inline Double-Click Renaming**:
   - Renaming is triggered directly by double-clicking the group name text.
   - Commits changes on `Enter` or `onBlur`, cancels on `Escape`.
   - Cleaned up the unused `Edit2` import.

## Consequences

- Consistent interaction model across all entities in the UI (projects, sessions, workflows, and step groups all use inline double-click).
- Less visual clutter on each step group card header.
