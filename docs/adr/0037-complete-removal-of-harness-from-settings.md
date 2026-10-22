# ADR 0037: Complete Removal of Harness References from Settings

## Status
Accepted

## Context
With the introduction of the dedicated [`/harness`](client/app/harness/page.tsx) page and navigation rail item, keeping residual harness links or controls in [`/settings`](client/app/settings/page.tsx) caused duplicate navigation and cluttered the settings view.

## Decision
- Completely removed all harness sections, links, and unused harness imports from [`client/app/settings/page.tsx`](client/app/settings/page.tsx).
- The Settings page is now exclusively dedicated to:
  1. **Appearance / Theme**: Light, Dark, System toggles.
  2. **Data Storage & Persistence**: Export Configuration (`.json`) and Reset Console to Empty.
  3. **Architectural References**: Canonical Glossary and ADR overview.

## Consequences
- Clean, focused responsibility separation between `/harness` (managing the CLI agent catalog) and `/settings` (client configuration and local state).
