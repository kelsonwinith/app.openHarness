# 58. Dedicated Input Bar Execution Progress Banner During Active Workflows

Date: 2026-10-22

## Status

Accepted

## Context

When a developer triggers a multi-skill workflow in project chat, the workflow executes sequentially through its tagged skills. Allowing simultaneous ad-hoc prompt submissions while an automated workflow is executing can lead to race conditions, conflicting agent instructions, and user confusion regarding which step OpenCode is actively working on.

## Decision

1. **Interactive Execution Progress Banner**:
   - When a workflow run is active (`running`, `paused`, or `waiting`), the standard chat input form is temporarily replaced with a dedicated execution progress banner directly inside the docked bar.
2. **Real-Time State Indicators & Inline Actions**:
   - **Running**: Displays a spinning loader with `Running skill X of Y: "<skill_name>"` and inline `[Pause]` and `[Stop]` buttons.
   - **Paused**: Displays `Paused at skill X of Y` with `[Resume]` and `[Stop]` buttons.
   - **Gate Checkpoint (Waiting)**: Displays an animated amber shield indicator with `Gate Checkpoint: "<skill_name>" — Approval required` and prominent `[Approve]` and `[Reject]` actions directly in the docked bar.
3. **Automatic Input Restoration**:
   - Once the workflow completes or is stopped, the prompt input bar automatically restores its full interactivity for direct chatting or launching subsequent flows.

## Consequences

- Prevents prompt collisions during automated workflow execution.
- Consolidates control and approval actions directly into the developer's primary point of interaction (the input bar) alongside the in-stream execution card.
- Clear visual state feedback eliminates guesswork about active agent tasks.
