# 56. Machine-Level Multi-File Storage Layout in `~/.openharness` and NPM CLI Packaging

Date: 2026-10-22

## Status

Accepted (Replaces browser `localStorage` repository)

## Context

Previously, OpenHarness stored user projects, sessions, chat history, workflows, and runs in the browser's `localStorage` (`relay.state.v1`). Storing data in browser storage created significant limitations:
- If the browser cache was cleared or incognito/different browsers were used, projects and conversation history vanished.
- Inability to edit, backup, or inspect console configurations through normal shell or developer tooling.
- Mismatch with standard developer tools (e.g. `opencode`, `gh`, `git`) that persist state under dotfiles in the user's home directory.

## Decision

1. **Machine-Level Filesystem Persistence (`~/.openharness/`)**:
   - Eliminated browser `localStorage` as the primary datastore. All state is persisted to the user's home directory under `~/.openharness/`.
2. **Modular Multi-File Directory Layout**:
   - `~/.openharness/config.json`: General preferences (`theme`, `defaultHarness`, `activeProjectId`, `activeSessionId`).
   - `~/.openharness/projects.json`: All registered projects with filesystem paths and branch metadata.
   - `~/.openharness/workflows.json`: Composed agent workflow templates.
   - `~/.openharness/sessions/<sessionId>.json`: Individual conversation contexts, streaming messages, and execution bindings.
   - `~/.openharness/runs.json`: Multi-skill workflow execution histories.
3. **Atomic File Operations & State API**:
   - Created `/api/state` (`GET`, `POST`, `DELETE`).
   - All disk writes use atomic temp-file write-and-rename (`.tmp` -> target file) to prevent data corruption.
4. **Client Repository Migration (`FileSystemRepository`)**:
   - Replaced `LocalStorageRepository` with `FileSystemRepository` in `client/lib/storage/fs-repo.ts`.
   - Performs a one-time migration of any legacy browser `localStorage` data into `~/.openharness/` on initial load, then permanently purges the browser storage keys.
5. **CLI Package Distribution (`openharness`)**:
   - Configured `package.json` with `"bin": { "openharness": "./bin/openharness.js" }`, `"preferGlobal": true`, and published package file sets for global installation via `npm install -g openharness` or `npx openharness`.
   - Updated launcher status dashboard to report `~/.openharness/` storage path.

## Consequences

- Full state resilience: browser restarts, cache clears, or switching browsers retain 100% of projects, chat sessions, and workflows.
- Shell-friendly: developers can easily backup, inspect, or script against `~/.openharness/`.
- Isolated session files prevent large monolithic payloads when managing numerous active projects.
