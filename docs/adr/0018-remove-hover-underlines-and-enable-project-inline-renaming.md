# 18. Remove Hover Underlines and Enable Project Inline Renaming

Date: 2026-10-22

## Status

Accepted

## Context

To achieve a clean, modern aesthetic across the application, text underline hover flashes needed to be removed from project names, session items, workflow items, and group headers. Additionally, while sessions and workflows supported inline renaming via double-click, projects in the left sidebar required a separate interaction. Parity was needed so that project items in the tree navigation can also be directly double-clicked to rename inline.

## Decision

1. **Remove Hover Underline Effects**:
   - Removed `hover:underline` from project items, session items, workflow sidebar items, workflow detail titles, and step group headers.
   - Preserved clean cursor hover cues (`cursor-pointer`) and subtle background hover highlighting without distracting text underlines.
2. **Inline Double-Click Renaming for Projects**:
   - Added inline editing support to `SortableProjectItem` in [`client/components/layout/project-sidebar.tsx`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/layout/project-sidebar.tsx).
   - Double-clicking the project name mounts an auto-focused `<input>` field.
   - Pressing `Enter` or clicking outside (`onBlur`) commits the new project name using `updateProject(project.id, { name: trimmed })`; `Escape` cancels editing.
   - Dragging via `@dnd-kit` is disabled while editing (`disabled: isEditing`) and click/key events are stopped from propagating to avoid accordion collapse or navigation triggers.

## Consequences

- Consistent interaction model across Projects, Sessions, and Workflows: all are double-clickable to rename.
- Smoother, cleaner visual feel without jarring text-decoration changes on hover.
- Full drag-and-drop reordering compatibility remains intact.
