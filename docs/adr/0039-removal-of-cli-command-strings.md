# ADR 0039: Complete Removal of CLI Command Strings

## Status
Accepted

## Context
Previously, agent harnesses included an arbitrary "CLI command" string (e.g., `opencode run`, `codex exec`, `antigravity run`, `claude`) displayed across tables, dialogs, and footers. In openHarness, runtimes are managed as canonical harness adapters where tool protocol mappings and execution environments are handled by the adapter boundary rather than raw shell command snippets. Displaying raw CLI commands introduced visual clutter and gave the false impression that users had to memorize or copy terminal flags.

## Decision
1. **Removed CLI Command from the UI**:
   - **Harness Table Page** (`/harness`): Removed the "CLI Command" column, copy buttons, and terminal icons. The table focuses cleanly on **Name**, **Version**, **Added** date, and **Actions**.
   - **Add Harness Picker Modal** (`AddHarnessDialog`): Removed command previews; developers select harnesses purely by runtime name and version.
   - **Project AI Chat** (`ProjectAiChat`): Removed command strings from the agent selector dropdown and footer metadata; displays purely the active agent name.
   - **Launch Run Dialog** (`LaunchRunDialog`): Removed the equivalent CLI command box and copy button.
2. **Domain Model Alignment**:
   - Made `command` optional in the `Harness` type definition in [`client/lib/domain/types.ts`](client/lib/domain/types.ts) and removed static command definitions from `SUPPORTED_HARNESSES`.

## Consequences
- Clean, focused interface emphasizing the agent harness identity without redundant shell commands.
- Tighter alignment with the repository adapter architecture where execution is decoupled from shell snippets.
