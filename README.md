# OpenHarness — Agent Harness Console

An agent harness console to compose workflows from reusable skills and observe execution across CLI harnesses (OpenCode, Codex, Antigravity, Claude Code).

## Quick Start: Launching OpenHarness

You can launch OpenHarness directly from your terminal:

```bash
openharness
```

This starts the console on custom port **9480** (avoiding common web ports like 3000, 5000, or 8080) and automatically opens your default browser at **http://localhost:9480**.

### CLI Options

| Flag | Description |
| :--- | :--- |
| `-p, --port <number>` | Specify a custom port (default: `9480`, with automatic fallback to next free port) |
| `--dev` | Launch Next.js in development mode with hot-reloading |
| `--no-open` | Start server without launching a browser window (useful for remote/headless setups) |
| `-h, --help` | Show command usage |

## Architecture & Documents

- **[GLOSSARY.md](GLOSSARY.md)**: Canonical terminology for Harnesses, Skills, Workflows, Steps, Gates, and Runs.
- **[ADR 0001: Workflows reference shared skills](docs/adr/0001-workflows-reference-shared-skills.md)**
- **[ADR 0002: Harness-agnostic workflows](docs/adr/0002-harness-agnostic-workflows.md)**
- **[ADR 0003: App Router Navigation & Persistent Run Drawer](docs/adr/0003-client-architecture-and-routing.md)**
- **[ADR 0004: Repository Adapter Strategy](docs/adr/0004-harness-simulation-repository-adapter.md)**
- **[ADR 0005: OpenHarness CLI Launcher & Port Strategy](docs/adr/0005-openharness-cli-launcher.md)**
