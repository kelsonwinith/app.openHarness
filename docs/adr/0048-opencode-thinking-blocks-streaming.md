# ADR 0048: OpenCode Thinking Blocks Streaming Flag

## Status
Accepted

## Context
When interacting with the OpenCode CLI harness in interactive project sessions, developers benefit from observing the model's step-by-step reasoning, plan synthesis, and internal evaluation before inspecting tool actions and final responses.

The user explicitly approved enabling thinking blocks:
"Should the console invoke opencode run with the --thinking flag enabled? yes"

## Decision
- Configured [`/api/harness/chat`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/api/harness/chat/route.ts) to pass `--thinking` directly to `/opt/homebrew/bin/opencode run`.
- Command arguments structure:
  `['run', '--format', 'default', '--auto', '--thinking', '--session', <sessionId>, <prompt>]`.
- Updated the loading indicator in [`ProjectAIChat`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/projects/project-ai-chat.tsx) to reflect that OpenCode is inspecting the codebase and thinking.

## Consequences
- Transparent, step-by-step reasoning streamed to the chat interface.
- Better alignment with developer mental model during complex refactorings and code audits.
