# 17. Streamlined Workflow Sidebar and Inline Renaming

Date: 2026-10-22

## Status

Accepted

## Context

Following the unification and streamlining of project sessions (where extraneous session details, timestamps, and 3-dot dropdown menus were removed in favor of inline double-click renaming and a single direct delete action), the workflow sidebar retained older, cluttered presentation:
- Workflow items displayed step counts, long descriptions, relative updated timestamps, and a 3-dot dropdown menu for duplicate, edit, launch, and delete.
- Renaming a workflow required opening a separate modal form.
- The sidebar visual density did not match the minimal, clean full-screen aesthetic established for the rest of Relay.

## Decision

1. **Workflow Sidebar Simplification**:
   - Stripped away workflow step count badges, description lines, and timestamp footers from sidebar items in [`client/components/layout/workflow-sidebar.tsx`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/layout/workflow-sidebar.tsx).
   - Sidebar items now cleanly present just the drag handle, workflow icon, workflow name, and a direct delete button.
2. **Three-Dot Menu Removal & Direct Delete**:
   - Removed the 3-dot `MoreVertical` dropdown menu on sidebar workflow items.
   - Replaced with a single hover-revealed `Trash2` delete button that triggers the confirmation modal before deletion.
3. **Inline Double-Click Renaming**:
   - Double-clicking the workflow name in the sidebar triggers an inline text input with `autoFocus`.
   - Pressing `Enter` or clicking outside (`onBlur`) commits the new name; pressing `Escape` cancels editing.
   - Disabled `@dnd-kit` sorting while editing (`disabled: isEditing`) and isolated click events (`e.stopPropagation()`) to eliminate sensor/focus collisions.
   - Also implemented inline double-click renaming on the workflow title header in [`client/app/workflows/[id]/page.tsx`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/workflows/[id]/page.tsx).

## Consequences

- Consistent minimal interaction across both Project Sessions and Workflows.
- Quick, distraction-free renaming without modal dialogs.
- Clear and safe delete flow via existing confirmation dialogs.
