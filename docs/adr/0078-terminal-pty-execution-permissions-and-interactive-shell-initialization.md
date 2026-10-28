# 78. Terminal PTY Execution Permissions and Interactive Shell Initialization

Date: 2026-10-22

## Status

Accepted

## Context

When opening the embedded interactive terminal modal in project sessions, the terminal appeared non-functional: users were unable to see a shell prompt or type commands into the terminal window.

Investigation revealed two root causes:
1. **Missing Executable Bit on `spawn-helper`**:
   The native `node-pty` prebuild binary on macOS (`prebuilds/darwin-arm64/spawn-helper`) had unpacked with non-executable permissions (`-rw-r--r--`). When `node-pty` attempted to spawn a pseudo-terminal, macOS rejected the helper process with `Error: posix_spawnp failed`.
2. **Non-Interactive Shell Fallback**:
   Because `node-pty` failed, the backend fell back to standard `childProcess.spawn('/bin/zsh', [])` with piped stdio. Spawning `/bin/zsh` with empty arguments and pipes creates a non-interactive, non-echoing shell process that neither displays a prompt nor echoes keystrokes back to the frontend.
3. **Modal Focus & Timing**:
   Opening the modal required xterm to immediately recalculate geometry, refit, and pull browser focus into the terminal emulator canvas.

## Decision

1. **Automated Permissions Self-Healing**:
   In [`client/lib/terminal/terminal-manager.ts`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/lib/terminal/terminal-manager.ts), added `ensureSpawnHelperExecutable()` which verifies and sets `0o755` executable permissions on `node-pty` prebuild `spawn-helper` binaries before initializing PTY sessions.
2. **Interactive Shell Flags**:
   Configured default shell args to `['-i']` across Unix platforms (`zsh`, `bash`), ensuring the spawned PTY runs as a full interactive shell with native prompt generation, character echo, line editing, and job control.
3. **Automatic Session Recovery**:
   Cached `projectPaths` by `projectId` in `TerminalManager` so that incoming keystrokes on `/api/terminal/input` automatically resurrect or spawn the session if it had exited.
4. **Modal Viewport & Focus**:
   In [`client/components/terminal/project-terminal-modal.tsx`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/terminal/project-terminal-modal.tsx):
   - Added `convertEol: true` to xterm options to prevent staircase rendering.
   - Synchronized window resize events to PTY on modal open and transition end (100ms / 250ms).
   - Added an `onClick` focus handler to the terminal container so clicking anywhere inside focuses the xterm input.

## Consequences

### Positive
- Fully interactive shell prompt (`user@host path %`) displays immediately upon opening the modal.
- Native PTY echoing, ANSI colors, tab completion, and keystroke processing function smoothly.
- Zero manual permission fixes required across machines.
