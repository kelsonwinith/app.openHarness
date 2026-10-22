# OpenHarness CLI Launcher and Custom Port Strategy

A root CLI executable (`openharness`) launches the Relay console web application from the terminal and opens the default browser.

To avoid port collisions with common web tools and frameworks (e.g. 3000, 5000, 8000, 8080), the launcher defaults to custom port **9480** (with automatic fallback to the next available port if occupied).

The launcher defaults to production mode (`next start`) with an automatic build check, and supports `--dev`, `--port <number>`, and `--no-open` flags.

**Consequences**

- Developers and CLI agents can launch the console globally via `openharness` from any workspace directory.
- Port 9480 prevents collisions with local Next.js, Vite, or backend processes.
- Automatic browser launching streamlines developer workflow while `--no-open` accommodates headless environments.
