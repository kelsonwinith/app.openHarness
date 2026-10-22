# 55. In-Context Git Review and Commit Bar for Agent File Diffs

Date: 2026-10-22

## Status

Accepted

## Context

When OpenCode modifies files during chat interactions or multi-skill workflows, OpenHarness detects the changes via `git status` and renders syntax-highlighted unified diffs in `FileChangesCard`. However, developers previously had to jump out of the browser to a separate terminal or IDE to stage and commit those changes, causing context fragmentation and delay.

## Decision

1. **Commit API (`POST /api/projects/commit`)**:
   - Executes `git add -A` and `git commit -m "<message>"` in the repository `projectPath`.
   - Returns the new short commit hash and active branch.
   - Enforces clean error reporting without throwing alert dialogs.
2. **Interactive "Review & Commit" Bar**:
   - Integrated directly beneath the collapsible file diff viewer in `FileChangesCard`.
   - Displays:
     - Current git branch indicator.
     - Commit message text input with keyboard shortcut (`Enter` to commit).
     - One-click commit action with loading spinner.
     - Post-commit confirmation badge displaying the commit hash (e.g. `Committed a1b2c3d on main`).
     - Inline validation error alerts if the commit fails.

## Consequences

- Seamless developer loop: agents propose changes, diffs are reviewed visually, and commits are created in one continuous in-context interface.
- Preserves git history discipline by requiring developer-specified commit messages.
- Removes friction of switching between browser and shell for straightforward code review and commit cycles.
