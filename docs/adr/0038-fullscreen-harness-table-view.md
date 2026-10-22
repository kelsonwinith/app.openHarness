# ADR 0038: Fullscreen Layout for Harness Table View

## Status
Accepted

## Context
While the Skills page table expanded to fill the entire available canvas, the Harness page table was previously constrained by a `max-w-5xl` container class. This caused an inconsistent visual layout when switching between primary navigation views (Projects, Workflows, Skills, and Harness).

## Decision
- Removed the `max-w-5xl` container width restriction on [`client/app/harness/page.tsx`](client/app/harness/page.tsx).
- The Harness table now occupies the full viewport canvas (`w-full`), matching the layout and padding of the Skills table.

## Consequences
- Consistent visual presentation across all top-level console entities.
- Table columns utilize available horizontal screen space on larger displays.
