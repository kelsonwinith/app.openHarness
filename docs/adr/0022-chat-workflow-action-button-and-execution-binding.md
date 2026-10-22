# 22. Chat Workflow Action Button and Execution Binding

Date: 2026-10-22

## Status

Accepted

## Context

With workflows formally established as reusable templates rather than self-executing jobs from the workflow designer, execution needed an intuitive entry point within the project context. Users required a direct action button within project chat sessions to select and execute workflow templates.

## Decision

1. **Docked Workflow Action Button**:
   - Added a "Workflows" action button beside the chat input in [`client/components/projects/project-ai-chat.tsx`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/projects/project-ai-chat.tsx).
   - Clicking opens a dropdown menu displaying all available workflow templates with their title, skill count, and summary description.
2. **Context-Aware Execution & Session Binding**:
   - When a workflow is selected:
     - If in an existing session: opens the `launch-run` dialog pre-filled with the selected workflow, active project, and active session.
     - If no session is active yet: automatically creates a new session titled after the workflow, navigates into the session, and opens the launch dialog.
   - Retained the existing chat recommendation cards, giving developers multiple seamless ways to initiate runs.

## Consequences

- Direct, discoverable access to workflow templates without needing to remember CLI commands or switch pages.
- Enforces the conceptual model that workflows are designed as templates and executed inside Projects/Sessions.
