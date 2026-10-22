# 77. Strict Independence Between Project-Local and Global Agent Skills

Date: 2026-10-22

## Status

Accepted

## Context

A project repository may maintain its own version-controlled `.agents/skills` directory, completely independent of the user's host machine global skill store (`~/.agents/skills/`). Previously:
1. Skills CLI removal and lockfile loading accidentally fell back to inspecting or attempting cleanup within `process.cwd()/.agents/skills` or `process.cwd()/skills-lock.json`.
2. Any cross-copying, syncing, or automated deletion between project-local `.agents/skills` and `~/.agents/skills` violated directory boundaries and led to repository modifications or file loss.

## Decision

We enforced complete and strict decoupling between repository-local `.agents` and global user skills:
1. **Zero Mutation of Local Project `.agents/skills`**:
   - Removed any workspace cleanup routines targeting `path.join(process.cwd(), '.agents', 'skills', ...)` in [`client/app/api/skills/remove/route.ts`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/api/skills/remove/route.ts).
   - Ensured all global skills CLI commands (`npx skills add`, `npx skills remove`) run with `cwd: process.env.HOME` so the CLI never touches the current repository working directory.
2. **Global Lockfile Scope**:
   - In [`client/app/api/skills/list/route.ts`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/api/skills/list/route.ts), source metadata resolution only inspects `~/.agents/skills-lock.json` and will not touch or read repository-level lockfiles.
3. **No File Migration**:
   - Project-local `.agents/skills` and global `~/.agents/skills` remain 100% independent. No files are moved, copied, or deleted between them.

## Consequences

### Positive
- Total protection of project-local `.agents` skills.
- Zero risk of git modifications or file loss in repositories hosting OpenHarness.
- Clear and predictable boundary between host-level skills and workspace files.
