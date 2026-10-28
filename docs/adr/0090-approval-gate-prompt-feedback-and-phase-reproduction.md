# 90. Approval Gate Prompt Feedback and Phase Reproduction

Date: 2026-10-23

## Status

Accepted

## Context

When an approval gate pauses execution between workflow phases, developers do not simply reject or abort. Rather, they often want to inspect the generated results, write feedback or adjustments, and have the agent re-run that specific phase with those revisions before deciding to approve and proceed.

The user specified:
> "when not approve the user would write down a prompt what they think or what they want to do which cause that flow to reproduce once again before approve again before going next step"

Previously, active execution runs replaced the chat input bar entirely, preventing developers from typing feedback at the gate checkpoint, and rejection only allowed halting the entire run.

## Decision

1. **Gate Feedback Input Availability**:
   In [`client/components/projects/project-ai-chat.tsx`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/projects/project-ai-chat.tsx):
   - When an active run is in `waiting` status at an approval gate, the docked input area remains active and is styled with an amber revision theme.
   - The placeholder instructs: `"Write prompt feedback to reproduce this phase, or approve above..."`.
   - The submit action sends the developer's prompt into the session chat history.

2. **Phase Reproduction via `reviseGate`**:
   In [`client/lib/simulation/simulation-engine.ts`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/lib/simulation/simulation-engine.ts) and [`client/lib/stores/console-store.ts`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/lib/stores/console-store.ts):
   - Added `reviseGate(feedback: string)`.
   - When triggered, the engine locates all steps sharing the current phase (`groupId`), logs the developer's feedback into the step activities, resets their statuses to pending, rewinds the run to the start of that phase, and re-executes.
   - Once all skills in the phase finish reproducing, the gate checkpoint pauses again for developer approval.

3. **Interactive Gate Checkpoint Controls**:
   - An amber Gate Checkpoint Banner is rendered with `[Approve & Continue]` and `[Stop Run]`.
   - In [`WorkflowRunMessage`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/projects/workflow-run-message.tsx), updated the gate card to clarify that developers can either approve to continue or type prompt feedback in chat to reproduce the phase.

## Consequences

### Positive
- Closes the feedback loop: developers can iteratively review, give guidance, and reproduce any phase until satisfied.
- Intuitive workflow: gates serve as real interactive review milestones rather than rigid stop switches.
- Preserves context: developers never have to manually re-trigger a whole workflow from scratch to fix intermediate phase output.
