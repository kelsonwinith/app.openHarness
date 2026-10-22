# 60. Real Global Skill Deletion via Official CLI and Filesystem Cleanup

Date: 2026-10-22

## Status

Accepted

## Context

When deleting a skill from the skills library (`/skills`), OpenHarness previously only removed the skill record from the console's state store. The physical skill files and CLI agent symlinks remained untouched on disk in `~/.agents/skills/`, leaving orphaned files that would be re-discovered on subsequent directory scans or CLI syncs.

## Decision

1. **Official CLI Deletion Execution**:
   - Created endpoint `POST /api/skills/remove`.
   - Executes `npx skills remove --global <skill-name> -y` to cleanly unbind the skill across all detected agents (OpenCode, Cursor, Claude Code, etc.).
2. **Comprehensive Filesystem Cleanup**:
   - Explicitly removes `~/.agents/skills/<skill-name>` and any local workspace `.agents/skills/<skill-name>` directories to ensure no residual files remain.
3. **UI Confirmation & State Synchronization**:
   - Updated [skills/page.tsx](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/skills/page.tsx) to execute the `/api/skills/remove` endpoint on confirmation before pruning from console store and workflows.

## Consequences

- Full parity between console skill listings and physical files on the developer's machine.
- Re-scanning skills via `npx skills ls -g` or `/api/skills/list` will no longer resurrect deleted skills.
- Cleans agent bindings automatically across all supported coding harnesses.
