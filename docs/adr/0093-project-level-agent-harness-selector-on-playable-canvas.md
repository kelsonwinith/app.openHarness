# 93. Project-Level Agent Harness Selector on Playable Execution Canvas

Date: 2026-10-28

## Status

Accepted

## Context

A project in OpenHarness may execute workflows across different agent harnesses (e.g. Project A might run OpenCode or Antigravity, while Project B uses Codex). 

Previously, harness selection was either inferred globally or buried in secondary settings. The user specified:
> "in project on the leftside of select workflow should be agent"

## Decision

1. **Header Hierarchy Alignment**:
   In [`client/components/flow/playable-execution-canvas.tsx`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/flow/playable-execution-canvas.tsx):
   - Added a dedicated **Agent Harness Selector** directly to the left of the **Workflow Picker** in the top control bar.
   - The picker lists all registered harnesses (`OpenCode`, `Antigravity`, `Codex`, etc.) with active indicators.
   - Defaults to the session's designated harness or the first available registered harness (`opencode`).

2. **Execution Dispatch Binding**:
   - When the user drags and drops the **Collapsible Prompt Puck** onto any Input Node, execution dispatches through the currently selected Agent Harness.
   - Allows switching between different agent harnesses seamlessly for consecutive tasks within the same project.

## Consequences

### Positive
- Clear mental model: `[Agent Harness] -> [Workflow Template] -> [Input Entry Node]`.
- First-class multi-harness agility: developers can switch between OpenCode, Antigravity, and Codex with a single click.
