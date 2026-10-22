# 54. In-Stream Workflow Execution Steps with Interactive Approval Gates

Date: 2026-10-22

## Status

Accepted

## Context

Previously, triggering a workflow from project chat opened an auxiliary launch dialog, and the obsolete bottom run drawer had been removed in ADR 0026. Developers need a direct, in-context way to observe multi-step workflow execution, inspect real-time activities and skill logs, and approve gate checkpoints without leaving their conversational flow.

## Decision

1. **Dedicated Chat Stream Execution Message**:
   - Extended `ChatMessage` with `runId?: string`.
   - When a workflow is launched (via chat suggestion cards, the workflow action dropdown, or the launch dialog), a new execution message is appended directly into the active session.
2. **`WorkflowRunMessage` Component**:
   - Embedded directly in the chat message flow.
   - **Header**: Workflow title, harness version (`OpenCode v2.1.2`), live status badge (`Running`, `Approval Required`, `Completed`, `Paused`, `Stopped`), and controls (`Pause`, `Resume`, `Stop`).
   - **Interactive Approval Gate**: When a step marked with a gate completes, the run pauses with status `'waiting'`. A banner presents one-click `[Approve & Continue]` and `[Reject & Stop]` actions.
   - **Skill Pipeline with Collapsible Activity Logs**: Each step displays its status, index, gate requirement, and an expandable real-time event log with timestamps and action tags (`run`, `edit`, `read`, `gate`, `done`).
3. **Seamless Conversation Context**:
   - Developers maintain full continuity: conversation prompts, streamed AI thinking/diffs, and multi-skill workflow executions reside together in the session message history.

## Consequences

- Eliminates modal and drawer friction when launching and supervising agent workflows.
- Human-in-the-loop approval gates are immediately accessible in the chat bubble.
- Session message history accurately reflects both interactive chat exchanges and automated multi-skill executions.
