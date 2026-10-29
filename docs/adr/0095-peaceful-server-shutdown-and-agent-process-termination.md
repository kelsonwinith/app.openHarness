# 95. Peaceful Server Shutdown and Agent Process Termination

Date: 2026-10-28

## Status

Accepted

## Context

When running OpenHarness via the terminal launcher (`openharness`), developers terminate the server using `Ctrl+C` (`SIGINT`). Previously, sending `SIGINT` to the launcher only signaled the immediate npm wrapper process. Active agent processes (e.g. `opencode run`, PTY terminals, and background harness runners) risked becoming orphaned and continuing execution in the background.

The user specified:
> "Press Ctrl+C to stop the server peacefully. it should stop agent that working too"

## Decision

1. **Process Group Leadership**:
   In [`bin/openharness.js`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/bin/openharness.js):
   - Spawned the server process with `detached: true` on Unix/macOS platforms so that `serverProcess.pid` acts as the process group leader.
   - Shutdown signals (`SIGINT`, followed if necessary by `SIGKILL`) are sent to the negative PID (`-serverProcess.pid`), terminating the entire sub-tree of child processes (Next.js, npm, node, and spawned subprocesses).

2. **Dedicated Clean Shutdown Endpoint**:
   - Added [`/api/shutdown/route.ts`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/api/shutdown/route.ts).
   - Upon receiving `Ctrl+C`, the launcher immediately issues a fast HTTP POST to `/api/shutdown` before killing the process tree:
     - Calls [`TerminalManager.killAll('SIGTERM')`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/lib/terminal/terminal-manager.ts#L238-L255) to cleanly terminate all background PTY interactive shells.
     - Calls `killAllAgentProcesses()` in [`chat/route.ts`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/api/harness/chat/route.ts#L80-L105) to terminate all active agent harness tasks.

3. **In-Process Process Exit Handlers**:
   - Both `TerminalManager` and `activeAgentProcesses` register listeners for `SIGINT`, `SIGTERM`, and `exit` on `process`, ensuring that even direct process kills clean up all subprocesses.

## Consequences

### Positive
- Zero orphaned background processes: all working agents and PTYs terminate cleanly when you press `Ctrl+C`.
- Safe resource cleanup: working directory file locks and ports are freed immediately.
- Peaceful, clean console output with clear status feedback (`⏳ Stopping OpenHarness server and active agents... Done.`).
