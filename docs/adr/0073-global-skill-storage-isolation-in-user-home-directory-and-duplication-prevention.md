# ADR 0073: Global Skill Storage Isolation in User Home Directory and Duplication Prevention

## Context
Previously, skills could be discovered or created in multiple locations: both in local project repositories (`app.openHarness/.agents/skills`) and in user global storage (`~/.agents/skills`). This dual-path scanning caused duplicate skill entries when a skill existed in both directories. Furthermore, `createSkill` in the client store blindly appended new skill instances rather than updating or deduplicating by canonical name.

## Decision
1. **Strictly Global Skill Scope**:
   - Skills are installed and scanned exclusively in the user's global directory: `~/.agents/skills` (`path.join(process.env.HOME || '', '.agents', 'skills')`).
   - Project repository directories (`app.openHarness/.agents/skills`) are excluded from scanning and installation.
   - Installation commands execute with `cwd: process.env.HOME` and the `-g` flag to ensure skills land strictly in `~/.agents/skills`.
2. **Duplication Elimination & Upsert Semantics**:
   - In [`useConsoleStore`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/lib/stores/console-store.ts), `createSkill` now performs an upsert: if a skill with the same name already exists, it updates metadata and files in-place rather than appending a duplicate.
   - Introduced `syncSkills(skills)` in [`useConsoleStore`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/lib/stores/console-store.ts) to deterministically synchronize and deduplicate store state with the disk catalog.
   - In [`SkillsPage`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/skills/page.tsx), revalidation now calls `syncSkills` directly, guaranteeing zero duplicate rows.

## Consequences
- Single, authoritative location for all agent skills on the developer machine (`~/.agents/skills`).
- Complete elimination of duplicate skill entries across restarts and revalidations.
- Clean isolation between OpenHarness source code and the user's installed agent skills.
