# 87. Elimination of Footer Bar in Project Chat

Date: 2026-10-23

## Status

Accepted

## Context

The bottom of the project chat previously contained a redundant footer line displaying `session ? session.name : project.name` and the flow or agent name (`Flow: <name>` or `Agent: <name>`). 

Because session information is already prominently displayed in the project breadcrumbs and header, and the active flow is already visualized in the Tagged Skills Bar above the input, this secondary bottom metadata bar added unnecessary visual clutter.

## Decision

In [`client/components/projects/project-ai-chat.tsx`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/projects/project-ai-chat.tsx):
- Completely removed the bottom metadata footer div below the chat input and terminal toggle button.
- Streamlined the docked input bar to end cleanly at the bottom container boundary.

## Consequences

### Positive
- Cleaner, distraction-free chat interface.
- Eliminates redundant labels that duplicated the top breadcrumbs and Tagged Skills Bar.
