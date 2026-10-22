# ADR 0046: Consolidation to OpenCode as Native Production CLI Agent Harness

## Status
Accepted

## Context
Previously, openHarness included mock harness catalog placeholders (Codex, Antigravity, Claude Code, Aider, Goose) alongside simulated agent interactions in the UI.

The user explicitly requested:
"now i want you to real implement the harness system
actually install skills, and chat project to agent harness 
lets remove all harness mockup left only with opencode and real implement it"

The host environment has OpenCode installed natively (`opencode v2.1.2` at `/opt/homebrew/bin/opencode`), which supports direct project execution (`opencode run`), session management (`--session`), and headless/streaming integration. Furthermore, `npx skills add` is available natively to install skills into local agent directories.

## Decision
1. **Purge all mock harnesses**:
   - Removed placeholder harness definitions (`codex`, `antigravity`, `claude`, `aider`, `goose`) from constants, types, and stores.
   - Designated `opencode` (v2.1.2) as the sole native agent harness runtime.
2. **Transition from simulation to real execution**:
   - Skill installation directly invokes `npx skills add` to install genuine skill instructions and files into agent directories.
   - Interactive project session chat connects directly to the OpenCode CLI (`opencode run`) executed in the project directory.

## Consequences
- Single, real agent harness pipeline eliminating mockup artifacts.
- Workflows and chats perform genuine local codebase actions with full verification.
