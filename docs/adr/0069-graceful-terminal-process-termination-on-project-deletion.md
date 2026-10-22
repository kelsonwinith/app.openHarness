# ADR 0069: Graceful Terminal Process Termination on Project Deletion

## Context
When a user deletes a project from OpenHarness, background terminal child processes (such as dev servers, bundlers, and active shells) could continue running in the background indefinitely if not explicitly terminated, consuming CPU, memory, and local network ports.

## Decision
1. In `deleteProject` of [`useConsoleStore`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/lib/stores/console-store.ts), send a `POST /api/terminal/kill` request with `{ projectId: id, signal: 'SIGTERM' }`.
2. In [`TerminalManager.kill`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/lib/terminal/terminal-manager.ts), send `SIGTERM` to the active shell process, clear all stream listeners, and remove the session entry from memory.

## Consequences
- Guaranteed cleanup of background dev servers and shell processes when projects are removed.
- Prevents resource leaks and orphaned port bindings on developer machines.
