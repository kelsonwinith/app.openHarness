# 52. Immutable Project Names Derived from Root Folder

Date: 2026-10-22

## Status

Accepted (Supersedes project inline renaming in ADR 0018)

## Context

In ADR 0018, inline editing was introduced for both projects and sessions in the sidebar via double-clicking. However, in practice, an OpenHarness project represents a concrete physical codebase directory on the host machine (`project.path`).

Allowing arbitrary project renaming inside the UI created friction, ambiguity, and discrepancy where the display name would drift from the actual root folder basename (e.g. `my-repo-old-name` vs folder path `/Users/.../my-repo`). Agent harnesses such as OpenCode operate within the project's root folder (`cwd: project.path`). Renaming the project label in the UI does not rename the filesystem directory and causes confusion.

## Decision

1. **Strictly Immutable Project Names**: Project names cannot be edited or renamed in the UI.
2. **Derived from Folder Basename**:
   - `name: path.basename(resolvedPath)` is enforced on project creation (`/api/projects/create`), folder opening (`/api/projects/open`), and git clone (`/api/projects/clone`).
   - Project directory picker (`/api/projects/picker`) automatically synchronizes the project name with the picked folder basename.
3. **Sidebar Interaction Simplification**:
   - Removed `isEditing`, `editName`, `onRenameProject`, and double-click rename listeners from `SortableProjectItem` in `project-sidebar.tsx`.
   - The project title in the sidebar is a clean, direct navigation link without inline text input states.
   - Session renaming within projects is preserved (sessions are logical conversations that can be freely titled).

## Consequences

- Prevents name drift between the OpenHarness project tree and the underlying directory on disk.
- Streamlines the project item component and eliminates double-click conflict with single-click navigation.
- Preserves full session flexibility while maintaining strict filesystem alignment for projects.
