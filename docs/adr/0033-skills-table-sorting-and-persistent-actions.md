# ADR 0033: Skills Table Sorting and Persistent Actions

## Status
Accepted

## Context
When skills are presented in a high-density table view, hiding critical row action icons (such as delete) behind hover states reduces affordance and keyboard/touch clarity. Additionally, users managing numerous installed agent skills need the ability to order skills dynamically across different dimensions (Name, Workflows usage count, Date Added, and Updated timestamp).

## Decision
1. **Persistent Action Buttons**:
   - The trash button (`Trash2`) and inspect button (`Eye`) in the Actions column of [`client/app/skills/page.tsx`](client/app/skills/page.tsx) are rendered persistently visible (`opacity-100`) rather than hidden behind hover.
2. **Interactive Column Sorting**:
   - Added interactive `SortHeader` components to all data columns:
     - **Name**: Alphabetical sort (A-Z / Z-A).
     - **Workflows**: Numeric sort by workflow usage count.
     - **Date Added**: Chronological sort by `createdAt` timestamp.
     - **Updated**: Chronological sort by `updatedAt` timestamp.
   - Header indicators display directional arrows (`ArrowUp` / `ArrowDown`) for the active column and `ArrowUpDown` for sortable inactive columns.
   - Default sort order is initialized to **Date Added (Newest first)** (`createdAt` descending), ensuring newly installed skills immediately appear at the top of the table.

## Consequences
- Navigating and auditing large collections of installed skills is faster.
- Action icons have clear visibility and immediate affordance.
