# ADR 0049: Global Skill Installation Scope

## Status
Accepted

## Context
When installing an agent skill (e.g., via `npx skills add <source>`), skills can either be installed into the project-specific workspace directory (`.agents/skills`) or globally into the user's home environment (`~/.agents/skills`) using the `-g` flag.

The user explicitly instructed:
"global"

## Decision
1. **Global Installation**:
   - [`/api/skills/install`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/api/skills/install/route.ts) now runs `npx skills add <source> -g -y`, saving installed skills into `~/.agents/skills`.
   - All installed skills are immediately available to all projects and sessions across the console.
2. **Unified Skill Discovery**:
   - [`/api/skills/list`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/api/skills/list/route.ts) scans both global (`npx skills ls -g --json`, `~/.agents/skills`) and local project scopes to present an exhaustive, unified skill catalog.

## Consequences
- Skills installed once in Relay/openHarness are universally accessible across any opened codebase without needing re-installation per repository.
