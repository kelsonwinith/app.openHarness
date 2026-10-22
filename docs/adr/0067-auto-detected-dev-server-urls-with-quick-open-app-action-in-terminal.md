# ADR 0067: Auto-Detected Dev Server URLs with Quick Open App Action in Terminal

## Context
When developers start a local development server or web service in the embedded terminal (e.g. `npm run dev`, `vite`, `next dev`, `python -m http.server`), the terminal outputs local listening URLs (such as `http://localhost:3000` or `http://localhost:5173`). Having to manually select the URL or type it into a new browser tab adds unnecessary friction to the rapid edit-test cycle.

## Decision
1. In [`ProjectTerminalModal`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/terminal/project-terminal-modal.tsx), monitor terminal stdout chunks and backlog for listening localhost patterns:
   - Regex matches `https?://(?:localhost|127\.0\.0\.1|0\.0\.0\.0):([0-9]{3,5})`.
   - Normalizes host to standard `http://localhost:<port>`.
2. When a dev server URL is detected, render an auto-updating **`Open App (localhost:<port>) ↗`** badge button in the terminal modal header:
   - Green-highlighted link opening directly in a new browser tab.
   - Clears automatically if the process exits or when the user restarts the shell.

## Consequences
- Single-click transition from running a dev server in the embedded terminal to previewing the live web application in the browser.
- Works automatically across Vite, Next.js, Remix, Astro, Flask, FastAPI, Go, Rust, and arbitrary dev servers.
