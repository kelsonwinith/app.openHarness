# ADR 0051: Visual File Diff Cards for Real OpenCode Code Changes

## Status
Accepted

## Context
When OpenCode modifies, creates, or deletes files during an interactive chat session, developers need immediate visual confirmation of the exact file modifications directly within the conversation stream, without switching to git terminal commands or separate diff tools.

The user explicitly approved:
"When OpenCode modifies or creates files in the project repository during a chat or workflow step, should the chat bubble display a visual file diff card? yes"

## Decision
1. **Automated Git Diff & Status Capture**:
   - At the completion of an OpenCode turn in [`/api/harness/chat`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/api/harness/chat/route.ts), the backend inspects `git status --porcelain`, `git diff --numstat`, and individual file unified diffs.
   - Emits a structured `fileChanges` payload: `Array<{ path, status, additions, deletions, diff }>`.
2. **Interactive Visual File Diff Card**:
   - In [`FormattedChatMessage`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/projects/formatted-chat-message.tsx), rendered directly below the assistant's message.
   - Displays summary badges (e.g. `2 files modified (+42, -5)`).
   - Each file entry displays its status icon (added, modified, deleted) and line stats.
   - Clicking any file expands a syntax-colored, unified diff viewer highlighting additions in green, deletions in red, and diff chunk headers in purple.

## Consequences
- Immediate visual inspection of real code changes produced by OpenCode.
- Non-intrusive collapsible cards keeping chat history compact while offering granular diff inspection on demand.
