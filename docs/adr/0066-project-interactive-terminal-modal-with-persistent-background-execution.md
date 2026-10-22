# ADR 0066: Project Interactive Terminal Modal with Persistent Background Execution

## Context
Developers working in OpenHarness need to run project dev servers (e.g. `npm run dev`, `cargo watch`, `python app.py`) and inspect outputs directly within the web application while simultaneously interacting with the AI agent. Closing the window or navigating should not kill active dev servers, and the terminal must support full interactive PTY capabilities (ANSI color codes, live REPLs, `Ctrl+C` interrupt, arrow keys).

## Decision
1. **Interactive PTY Backend**:
   - Implemented [`TerminalManager`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/lib/terminal/terminal-manager.ts) using `node-pty` (with graceful fallback to `child_process.spawn`), binding to the user's default shell (`zsh`/`bash`/`powershell`) and setting `cwd = project.path`.
   - Enhanced `PATH` resolution ensuring Homebrew, system binaries, node/npm, and package managers are discovered cleanly on macOS and Linux.
   - Retains a scrollback backlog buffer (up to 200,000 characters) to seamlessly replay terminal state when reconnecting.
2. **Server-Sent Events & Input API**:
   - Stream endpoint: [`/api/terminal/stream`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/api/terminal/stream/route.ts) for live stdout/stderr data and process status.
   - Input endpoint: [`/api/terminal/input`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/api/terminal/input/route.ts) for bidirectional keystrokes.
   - Resize endpoint: [`/api/terminal/resize`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/api/terminal/resize/route.ts) for dynamic terminal viewport resizing.
   - Kill & Restart endpoint: [`/api/terminal/kill`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/api/terminal/kill/route.ts) supporting `SIGINT` (Ctrl+C) and shell restart.
   - Status endpoint: [`/api/terminal/status`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/api/terminal/status/route.ts) reporting live running status and PID.
3. **Frontend Terminal Modal**:
   - Built [`ProjectTerminalModal`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/terminal/project-terminal-modal.tsx) using `@xterm/xterm` and `@xterm/addon-fit`.
   - Dark terminal theme with high-contrast ANSI colors, Menlo/monospace typography, and automatic resize observation.
   - Header controls: running status badge with PID, project path pill, quick `[^C Interrupt]`, `[Clear]`, `[Restart]`, maximize toggle, and `[✕ Close]` button.
   - Persistent background execution: closing the modal merely hides the window; running dev processes stay active.
4. **Chat Toolbar Trigger Button**:
   - Added a dedicated `[Terminal]` button on the right side of the chat prompt bar in [`ProjectAIChat`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/projects/project-ai-chat.tsx).
   - Features a live pulsing green indicator when a process is running in the background.

## Consequences
- Developers can start dev servers, run migrations, and test builds without leaving the browser or tab-switching.
- Background persistence ensures uninterrupted app serving while chatting with the OpenCode agent harness.
