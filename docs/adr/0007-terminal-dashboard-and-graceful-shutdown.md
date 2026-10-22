# Terminal Dashboard and Graceful Shutdown Strategy

The `openharness` CLI launcher suppresses raw Next.js compilation and framework output (`▲ Next.js`, local address spam, Turbopack debug messages) in favor of a clean, branded terminal dashboard.

### Dashboard & Logging Behavior

- A modern boxed dashboard displays server status, URL, custom port, active mode, and supported harness targets using ANSI colors.
- Framework stdout/stderr streams are piped and suppressed during normal execution; only fatal crashes are surfaced.
- A graceful shutdown handler intercepts `SIGINT` (Ctrl+C) and `SIGTERM`, signals child processes, verifies port release with a 2-second timeout, and presents a clean exit sequence.

**Consequences**

- Terminal presentations are clean and quiet, suitable for developer workflows and embedded agent terminals.
- Next.js server processes are never orphaned in the background when the user stops the CLI.
