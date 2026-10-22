# 53. Missing Project Directory Detection and Relocation Flow

Date: 2026-10-22

## Status

Accepted

## Context

Because project names are strictly bound to physical disk folders, external actions (moving a directory, renaming a folder outside OpenHarness, unmounting a volume, or deleting a repository) can invalidate the stored `project.path`.

If an agent harness runs inside an invalid or missing directory, running CLI commands could fail unexpectedly or mistakenly execute in the application server directory. Furthermore, silently deleting missing projects could cause data loss of conversation history if the directory was only temporarily disconnected or moved.

## Decision

1. **Lightweight Verification Endpoint**:
   - Introduced `POST /api/projects/verify`, which checks `fs.existsSync(resolvedPath)` and `isDirectory()` across all loaded projects.
2. **Visual Warning in Project Sidebar**:
   - Projects whose paths cannot be found on disk are tagged with an amber `Missing` badge and styling.
   - The project title reflects the missing state, signaling the issue before the user attempts an execution.
3. **Locate Folder Quick Action**:
   - Clicking the `Missing` badge or selecting `Locate Folder...` from the project options opens the native OS directory picker (`/api/projects/picker`).
   - Once re-located, the project's `path`, `name`, and git branch are updated and immediately re-verified.
   - Alternatively, the user can choose `Remove Project` to dismiss the stale reference.
4. **Agent Chat Guard**:
   - `POST /api/harness/chat` strictly validates that `projectPath` exists before spawning OpenCode, preventing any fallback execution in unintended working directories.

## Consequences

- Prevents crashes or unintended command execution in stale working directories.
- Provides a clean recovery path for renamed or moved directories without losing existing chat sessions.
- Keeps UI and filesystem completely aligned.
