# ADR 0035: Harness Catalog Registration and Project-Level Selection

## Status
Accepted

## Context
Developers work on different repositories and tasks requiring different agent CLI runtimes (e.g., OpenCode for terminal tasks, Codex for OpenAI code edits, Antigravity for workspace agents, Claude Code for Claude tools, or custom CLI agents like Aider/Goose). Setting a single global default harness restricted flexibility, while the `/harness` page previously confounded catalog registration with global runtime selection.

## Decision
1. **Harness Page (`/harness`) as the Runtime Catalog**:
   - The `/harness` page is dedicated exclusively to managing and registering available CLI agent runtimes.
   - Developers can add custom agent harnesses (`+ Add Harness` dialog) with a custom name, CLI command, version, and tagline.
   - Removed global "Set as Default" / "Active Default" controls from the `/harness` page.
2. **Project / Session-Level Agent Selection**:
   - The choice of which agent executes tasks is made dynamically inside each project and session.
   - Added an interactive **Agent Selector** dropdown (`[Agent: OpenCode ▼]`) in the chat composer of [`client/components/projects/project-ai-chat.tsx`](client/components/projects/project-ai-chat.tsx).
   - Switching the agent in a project session updates `session.defaultHarnessId` immediately and targets that harness for subsequent workflows and agent interactions.
   - For brand new projects and sessions without an explicit harness setting, Relay automatically remembers and pre-selects the **last agent harness used** across previous sessions, persisted in local storage.
3. **Reactive Harness Catalog Storage**:
   - Added `harnesses: Harness[]` to `ConsoleStoreState` and persisted it in `LocalStorageRepository`, allowing newly added runtimes to appear instantly in all project agent selectors and session dialogs.

## Consequences
- Clean separation of concerns: `/harness` manages the environment's runtime catalog; projects decide which runtime to execute.
- Multi-agent flexibility: Developers can easily test and compare different agent runtimes on the same codebase within separate sessions.
