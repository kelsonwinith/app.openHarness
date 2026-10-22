# ADR 0028: Skills List View and Streamlined Management

## Status
Accepted

## Context
Previously, skills were rendered in a multi-column responsive grid card layout. Because skills are now installed/imported via `npx` or GitHub (rather than authored with extensive custom markdown text in the UI), presenting them in large cards led to excessive empty whitespace and awkward horizontal dragging interactions.

## Decision
1. Converted the `/skills` page to a sleek, single-column vertical list view.
2. Refactored the sortable dnd-kit strategy to `verticalListSortingStrategy` with `restrictToVerticalAxis`.
3. Styled `SortableSkillItem` as a compact row containing:
   - Drag reorder grip handle (`GripVertical`)
   - Skill icon badge (`Code2`)
   - Prominent skill name
   - Brief inline description
   - Usage pill indicator (number of workflows referencing the skill)
   - Hover-reveal delete action (`Trash2`)
4. Preserved full keyboard accessibility, dark/light theme styling, and instant reactive state management via `useRepository`.

## Consequences
- The skills list matches the minimal full-screen aesthetic established across projects and workflows.
- Drag-and-drop reordering is snappy and predictable with vertical-only movement constraints.
