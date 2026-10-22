# ADR 0068: Project-Scoped Shared Terminal Lifecycle Across Sessions

## Context
Developers within a project often maintain multiple concurrent conversation threads and sessions (e.g. "Bug Fix #12", "Refactor Auth", "Docs Update"). If each session maintained a separate terminal instance or killed the shell when switching sessions, long-running dev servers (e.g. `npm run dev`) would be interrupted repeatedly or consume duplicate ports.

## Decision
1. Key all terminal PTY sessions strictly by `projectId` in [`TerminalManager`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/lib/terminal/terminal-manager.ts).
2. When the user navigates between sessions within the same project (`/projects/[id]/sessions/[sessionId]`), the active shell process, running servers, scrollback history, and detected `localhost` URLs remain uninterrupted and shared across all sessions of that project.
3. Switching to a different project connects to that other project's dedicated terminal instance.

## Consequences
- Continuous, uninterrupted local development server execution across all chat sessions in a project.
- Prevents port collision errors (`EADDRINUSE`) caused by duplicate session-spawned servers.
