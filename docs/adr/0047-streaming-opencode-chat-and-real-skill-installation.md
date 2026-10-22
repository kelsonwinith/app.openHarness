# ADR 0047: Streaming OpenCode CLI Agent Harness Integration and Real Skill Installation

## Status
Accepted

## Context
Following the consolidation of the system to OpenCode (ADR 0046), the console required real execution capabilities for:
1. Interactive session chatting against the actual codebase.
2. Real skill installation into project agent environments.

The user explicitly confirmed:
"Should the console invoke opencode run --session <sessionId> "<prompt>" in streaming mode (streaming stdout markdown/thinking blocks token-by-token directly into the chat bubble via Server-Sent Events), it should"

## Decision
1. **Real-time Server-Sent Events (SSE) chat pipeline**:
   - Implemented `/api/harness/chat` which executes `/opt/homebrew/bin/opencode run --format default --auto --session <sessionId> "<prompt>"` in the project's root directory (`cwd: project.path`).
   - Streams `stdout` and `stderr` directly to the client over an HTTP `text/event-stream`.
   - In [`ProjectAIChat`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/projects/project-ai-chat.tsx), the assistant response bubble updates token-by-token in real time as OpenCode processes and writes output.
   - Added `updateSessionMessage` to the session store to persist streaming messages.
2. **Official CLI skill installation**:
   - Implemented `/api/skills/install` which executes `npx skills add <source> -y` to install real skill files into `.agents/skills`.
   - Reads installed files and `SKILL.md` directly into the domain `Skill` object.
   - Implemented `/api/skills/list` to inspect and sync real local skills discovered on disk with the console UI.
   - [`SkillFormDialog`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/dialogs/skill-form-dialog.tsx) connects directly to `/api/skills/install`.

## Consequences
- Authentic execution against local repositories replacing mock simulations.
- Real token-by-token streaming response visibility in project sessions.
- Real skill packages installed via official NPX tooling and reflected in skill explorers.
