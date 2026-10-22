# ADR 0041: Compact Vertical Centering for Workflow Skill Items

## Status
Accepted

## Context
Following the removal of the description field from skills, workflow step items (`SortableStepItem`) retained legacy top-aligned padding (`items-start`, `p-3`, `mt-0.5` drag handle, and separate block paragraph for instruction overrides). This created noticeable dead whitespace beneath the single-line skill title, making the cards look unnecessarily tall and unbalanced.

## Decision
1. **Vertical Centering and Compact Padding**:
   - Updated `SortableStepItem` in [`client/app/workflows/[id]/page.tsx`](client/app/workflows/[id]/page.tsx) to `flex items-center justify-between px-3 py-2 min-h-[40px]`.
   - Centered the drag grip handle vertically by removing `mt-0.5`.
2. **Inline Instruction Overrides**:
   - Replaced the standalone block paragraph with an inline monospace tag (`Override: ...`) that sits directly beside the skill name and gate badge, eliminating the bottom gap entirely while maintaining clear readability.

## Consequences
- Skill cards in workflow groups are compact, symmetrical, and tight.
- Drag handle, skill title, gate badge, and control buttons align on the horizontal center line.
