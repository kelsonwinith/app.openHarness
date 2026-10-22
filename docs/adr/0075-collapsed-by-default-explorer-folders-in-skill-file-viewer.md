# 75. Collapsed by Default Explorer Folders in Skill File Viewer

Date: 2026-10-22

## Status

Accepted

## Context

When inspecting skill contents via the skill detail dialog, all folders (`scripts`, `references`, etc.) in the Explorer sidebar were expanded by default. For skills with nested helper scripts and reference files, this cluttered the tree view and required users to scroll through large folder trees to find root files like `SKILL.md`.

## Decision

In [`client/components/dialogs/skill-detail-dialog.tsx`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/dialogs/skill-detail-dialog.tsx):
1. Changed `expandedFolders` state to default to an empty map `{}`.
2. Reset `expandedFolders` to `{}` on skill change (`useEffect` dependency on `skill?.id`).
3. Set folder node expansion fallback logic to `expandedFolders[folderName] ?? false`.

## Consequences

### Positive
- Explorer sidebar starts in a compact, organized state highlighting root files (such as `SKILL.md`).
- Users can selectively expand specific directories on demand by clicking the folder row or chevron.
