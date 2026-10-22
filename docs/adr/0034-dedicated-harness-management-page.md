# ADR 0034: Dedicated Harness Page and Navigation Rail Promotion

## Status
Accepted

## Context
CLI agent harnesses (OpenCode, Codex, Antigravity, Claude Code) represent a primary architectural pillar of openHarness alongside Projects, Workflows, and Skills. Previously, harness runtime selection was relegated to a sub-section inside the Settings page, obscuring runtime protocol mappings, CLI commands, and active default configuration.

## Decision
1. **Dedicated Harness Page (`/harness`)**:
   - Created [`client/app/harness/page.tsx`](client/app/harness/page.tsx) with a full-screen layout.
   - Displays all registered CLI agent harnesses with their version, tagline, CLI execution command (with copy button), canonical tool protocol mappings (`read`, `search`, `glob`, `run`, `edit`, `write`, `plan`), and active status badge.
   - Allows developers to switch the active default harness runtime with instant reactivity and toast notification.
2. **App Rail Navigation Promotion**:
   - Added **Harness** (`SquareTerminal` icon, `/harness`) to the primary navigation rail in [`client/components/layout/app-rail.tsx`](client/components/layout/app-rail.tsx) between Skills and docked Settings.
3. **Streamlined Settings Page**:
   - Replaced the embedded harness selector on [`client/app/settings/page.tsx`](client/app/settings/page.tsx) with a high-level shortcut link navigating directly to `/harness`.

## Consequences
- Elevates the CLI agent runtime to a top-level entity matching the conceptual model in `GLOSSARY.md`.
- Settings is kept focused strictly on client preferences (theme), data export, and local storage state resets.
