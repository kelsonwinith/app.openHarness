# ADR 0040: Removal of Workflow Group Order Numbers and Skills Table Refinement

## Status
Accepted

## Context
Following the removal of individual step sequence badges, displaying numerical order badges on workflow step groups (`1`, `2`, `3`...) created visual imbalance and competed with the editable group names. Additionally, with the deletion of the human-written description field from skills, the Skills table required UI refinements to properly balance typography, source package tags, and vertical cell alignment.

## Decision
1. **Removed Workflow Group Order Numbers**:
   - In [`client/app/workflows/[id]/page.tsx`](client/app/workflows/[id]/page.tsx), removed the `{groupIdx + 1}` badge from `SortableGroupCard`.
   - The group header now cleanly begins with the reorder grip handle (`GripVertical`), followed directly by the group name (inline editable on double-click), the skill count badge, and actions.
2. **Refined Skills Table UI**:
   - In [`client/app/skills/page.tsx`](client/app/skills/page.tsx), aligned row heights to a consistent `h-11` with `align-middle` across all table headers and cells.
   - The Name column now pairs the skill name with an inline monospace source badge (`skill.source`, e.g. NPX package or GitHub repository) when present, filling the visual void left by the removed description.

## Consequences
- Workflow canvas presentation is completely numberless, prioritizing named modular phases and order via natural top-to-bottom layout.
- The Skills table provides clear visual balance and highlights where skills were installed from.
