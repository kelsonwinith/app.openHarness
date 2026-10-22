# ADR 0050: Formatted CLI Stream Output in Web UI

## Status
Accepted

## Context
When streaming stdout and stderr from OpenCode directly into the web chat interface, raw terminal streams include ANSI color escape codes, carriage returns, and raw thinking blocks that appear noisy and unformatted in standard text blocks.

The user instructed:
"yes like everything from cli should forward to the web app but prettier"

## Decision
1. **ANSI Code Stripping**:
   - Both the streaming route ([`/api/harness/chat`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/api/harness/chat/route.ts)) and client-side message parsing strip raw ANSI escape sequences and carriage return artifacts.
2. **Prettier Structured Message Rendering**:
   - Implemented [`FormattedChatMessage`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/projects/formatted-chat-message.tsx).
   - **Thinking & Reasoning Blocks**: Detected `<thinking>` tags are parsed into dedicated, collapsible "OpenCode Thinking & Reasoning" callout containers featuring a brain icon and subtle monospace styling.
   - **Code Blocks**: Formatted in high-contrast dark theme containers with language indicators and 1-click "Copy" clipboard buttons.
   - **Text & Markdown**: Flowing prose with clean line height, preserving word wrapping and formatting.

## Consequences
- Authentic terminal execution output from OpenCode without terminal noise or escape code artifacts.
- Visual distinction between agent thinking/reasoning and final responses.
