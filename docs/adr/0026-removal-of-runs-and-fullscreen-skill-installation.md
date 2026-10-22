# 26. Removal of Runs and Fullscreen Skill Installation

Date: 2026-10-22

## Status

Accepted

## Context

Previous iterations included a separate "Runs" route (`/runs`), a persistent slide-out "Run Drawer", and separate historical run views. With the unification of projects and sessions (where developers communicate directly with agents and launch workflows inside conversation sessions), having a detached "Runs" route and separate drawer introduced unnecessary complexity and fragmented the interaction model.

Additionally, the Skills catalog was previously a centered container displaying bloated internal instruction code blocks and complex manual authoring forms. Because skills in the agent ecosystem are installed or imported via `npx` packages or GitHub repositories, users needed a full-screen, minimal skills overview showing only the skill name and essential general details, with a fast install/import flow.

## Decision

1. **Complete Removal of Runs Route & Drawer**:
   - Deleted the `/runs` page (`client/app/runs`).
   - Removed "Runs" from the primary navigation rail in [`client/components/layout/app-rail.tsx`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/layout/app-rail.tsx) and removed the live run indicator.
   - Removed `<RunDrawer />` from `RootLayout` in [`client/app/layout.tsx`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/layout.tsx).
   - Workflow execution now lives natively inside Project Sessions.
2. **Fullscreen Skills Canvas**:
   - Transformed [`client/app/skills/page.tsx`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/skills/page.tsx) into a full-screen canvas (`h-full w-full flex flex-col`) with a docked header toolbar (Skill count, search filter, and "Install Skill" button).
3. **Streamlined Skill Cards**:
   - Each skill card prominently features the skill name, icon, brief description, and workflow usage count.
   - Removed large instructions code dumps and 3-dot menus in favor of a direct delete action on hover.
4. **NPX & GitHub Skill Installation**:
   - Refactored [`client/components/dialogs/skill-form-dialog.tsx`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/dialogs/skill-form-dialog.tsx) into an "Install Skill" dialog supporting direct NPX commands (`npx skills add <name>`) or GitHub repository URLs.

## Consequences

- The app architecture is significantly simpler, with the primary navigation reduced to **Projects**, **Workflows**, and **Skills**.
- The Skills view matches the full-screen minimal aesthetics of Projects and Workflows.
- Skills align with the real-world pattern of importing packages from registry/git sources.
