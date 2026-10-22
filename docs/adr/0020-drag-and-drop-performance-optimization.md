# 20. Drag and Drop Performance Optimization

Date: 2026-10-22

## Status

Accepted

## Context

Users reported noticeable lag during drag-and-drop reordering across all list interfaces (projects, sessions, workflows, step groups, steps, and skills). Investigation revealed the root causes:
1. **Transition Lag on Dragged Element**: `@dnd-kit`'s `useSortable` returns an active CSS `transition` (defaulting to 250ms ease) intended for sorting sibling displacement. Applying this transition to the item currently being dragged caused every mouse move coordinate change to animate over 250ms, lagging severely behind the cursor.
2. **Matrix Transform Computations**: Using `CSS.Transform.toString(transform)` computes matrix and scaling equations rather than lightweight GPU-accelerated coordinate translation.
3. **Deadzone Activation Lag**: The PointerSensor was configured with a 5px activation distance deadzone before drag initiation.

## Decision

1. **Disable Transition on Active Drag**:
   - For every sortable component (`SortableProjectItem`, `SortableSessionItem`, `SortableWorkflowItem`, `SortableGroupCard`, `SortableStepItem`, `SortableSkillCard`), applied `transition: isDragging ? 'none' : transition`.
   - Sibling items continue to smoothly slide out of the way, while the dragged element sticks to the cursor at 60+ FPS with zero lag.
2. **Use Pure GPU Translation**:
   - Replaced `CSS.Transform.toString(transform)` with `CSS.Translate.toString(transform)` to produce direct hardware-accelerated `translate3d(x, y, 0)`.
   - Added `zIndex: isDragging ? 50 : undefined` to maintain proper stacking above adjacent items without DOM reflows.
3. **Optimized Pointer Activation**:
   - Reduced `activationConstraint.distance` from `5` to `3` pixels, eliminating the deadzone hesitation while preserving click-vs-drag distinction.

## Consequences

- Drag-and-drop movement is instantaneous, smooth, and tracks the mouse cursor without latency across all lists.
- Full compatibility with keyboard navigation and click/double-click event delegation remains intact.
