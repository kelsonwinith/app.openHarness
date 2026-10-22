# ADR 0031: Removal of Workflow Step Number Badges

## Status
Accepted

## Context
In the workflow canvas, each step inside a step group displayed a numerical sequence index badge (`1`, `2`, `3`...). Because steps are grouped into logical, modular sections (step groups) and can be freely reordered by drag-and-drop, the absolute step index numbers added visual noise and competed with the skill name and gate checkpoint badges.

## Decision
- Removed the numerical index badge from `SortableStepItem` in [`client/app/workflows/[id]/page.tsx`](client/app/workflows/[id]/page.tsx).
- Step items now start cleanly with the subtle drag handle (`GripVertical`), immediately followed by the skill title, gate badge, description or instruction overrides, and quick action controls.

## Consequences
- Step cards are cleaner, more compact, and visually aligned across groups.
- Visual hierarchy places emphasis directly on the skill being executed rather than an artificial sequence index.
