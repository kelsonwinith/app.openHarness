# ADR 0036: Pre-configured Harness Picker and Table List View

## Status
Accepted

## Context
Configuring CLI agent harnesses by manually entering executable paths, CLI flags, versions, and names creates typing friction and potential syntax errors. Because openHarness supports specific established agent CLI runners (OpenCode, Codex, Antigravity, Claude Code, Aider, Goose), developers need a 1-click addition experience from a supported catalog, followed by a clear table inventory of added runtimes.

## Decision
1. **Pre-configured Supported Harness Catalog**:
   - Maintained `SUPPORTED_HARNESSES` with verified CLI execution commands and tool mappings.
   - Replaced manual text input in `AddHarnessDialog` with a 1-click picker displaying all supported harnesses that have not yet been added to the workspace.
2. **Table View for Added Harnesses**:
   - Converted the [`/harness`](client/app/harness/page.tsx) page into a clean table list view.
   - Columns:
     - **Name**: Harness icon, name, and tagline.
     - **CLI Command**: Formatted monospace command block with a 1-click copy action.
     - **Version**: Version badge.
     - **Added**: Formatted calendar date timestamp.
     - **Actions**: Persistent delete/remove button (`Trash2`).
3. **Project / Session Selection Synergy**:
   - Only harnesses that have been added to the environment appear in project chat agent selectors and session dialogs.

## Consequences
- Zero manual typing required to configure and enable supported agent harnesses.
- High visual density on the Harness page with immediate affordance for copying CLI commands or removing runtimes.
