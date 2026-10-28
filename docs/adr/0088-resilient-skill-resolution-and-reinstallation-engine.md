# 88. Resilient Skill Resolution and Reinstallation Engine

Date: 2026-10-23

## Status

Accepted

## Context

When a developer deleted a skill from the skills view and attempted to click `[Reinstall]` on a missing skill step card in the workflow editor, the installation previously failed with:
`fatal: repository '<skill-name>' does not exist`

Investigation revealed the root causes:
1. **Lockfile Misnaming**:
   The `skills` CLI writes metadata to `.agents/.skill-lock.json` (with a leading dot), whereas [`api/skills/list`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/api/skills/list/route.ts) previously only searched for `.agents/skills-lock.json`. Consequently, installed skills lost their `source` repository attribute (`targetSkill.source` was undefined).
2. **Bare Skill Name Execution**:
   When reinstallation ran without a known repository source, it called `npx skills add <skill-name> -g -y`. Because `skills add` expects a package/repository (e.g. `owner/repo@skill`), executing a bare name caused git clone failures.
3. **Missing Post-Install Sync**:
   After reinstallation succeeded, the client did not trigger a fresh `/api/skills/list` fetch, leaving the workflow editor's `baseSkill` evaluation in danger state until manually refreshed.

## Decision

1. **Comprehensive Lockfile Discovery**:
   Updated both [`client/app/api/skills/list/route.ts`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/api/skills/list/route.ts) and [`client/app/api/skills/install/route.ts`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/api/skills/install/route.ts) to search across all canonical lockfiles:
   - `~/.agents/.skill-lock.json`
   - `~/.agents/skills-lock.json`
   - Workspace root and parent `skills-lock.json` and `.agents/.skill-lock.json`

2. **Automated Package Target Resolution**:
   In [`client/app/api/skills/install/route.ts`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/api/skills/install/route.ts):
   - When given a bare skill name (no `/`, `@`, or URL), the endpoint checks all lockfiles to resolve the origin repository (e.g. `frontend-design` -> `anthropics/skills@frontend-design`).
   - If not present in lockfiles, it queries the official CLI registry via `npx skills find <name>` and parses the top installed package.
   - If an owner/repo is provided without a sub-skill tag, it appends `@<skillName>` to avoid interactive prompts or downloading extraneous skills.

3. **Workspace Fallback**:
   If network access fails or a repository cannot be reached, the server checks if a local copy exists in `.agents/skills/<name>` and copies it into `~/.agents/skills/`.

4. **Workflow Editor Re-Sync**:
   In [`client/app/workflows/[id]/page.tsx`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/workflows/[id]/page.tsx), `handleReinstallStep` sends both `source` and `skillName`, updates the step, and calls `syncSkills` from `/api/skills/list`, instantly clearing the missing state from the card.

## Consequences

### Positive
- 1-click reinstallation works 100% reliably even when skills are deleted and snapshotted without explicit source URLs.
- Step cards in workflow editors seamlessly transition from danger missing state to normal step state immediately upon installation.
- Works both online (via lockfiles and `skills find`) and offline (via workspace fallbacks).
