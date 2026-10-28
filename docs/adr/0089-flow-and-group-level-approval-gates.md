# 89. Flow and Group-Level Approval Gates

Date: 2026-10-23

## Status

Accepted

## Context

Previously, approval gates were configured on individual skills within a workflow (`step.gate`). However, in real developer workflows, skills within a phase operate together as a cohesive unit (e.g. Discovery phase: `read-code` + `search-docs`; Implementation phase: `write-code` + `run-tests`). 

Configuring gates per skill introduced micro-interruptions between atomic skills in the same logical group. The user specified:
> "approval gate should be flow level not skill level
> when running agent it would work like this:
> workflow1 - skill1, skill2
> workflow2 - skill3, skill4
> when running prompt:
> Call skill1, skill2
> Prompt...
> if approval gate is on then this is where user must approve first then
> Call skill3, skill4"

In the `/grill-with-docs` clarification session:
- **Scope**: Gates sit at the Step Group / Phase boundary (`StepGroup.gate: boolean`).
- **Timing**: Execution runs all skills in the group, executes the prompt/work, and pauses at the gate checkpoint before proceeding to the subsequent group.
- **Availability**: Available across all groups, including the final group (pausing before overall workflow completion).

## Decision

1. **Domain Model Shift**:
   In [`client/lib/domain/types.ts`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/lib/domain/types.ts):
   - Added `gate?: boolean` to [`StepGroup`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/lib/domain/types.ts#L44-L51).
   - Removed gate requirements from individual [`Step`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/lib/domain/types.ts#L36-L44).

2. **Workflow Editor UI**:
   In [`client/app/workflows/[id]/page.tsx`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/workflows/[id]/page.tsx):
   - Removed individual `Gate` buttons and gate badges from [`SortableStepItem`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/workflows/[id]/page.tsx#L55-L215). Skills are now displayed as clean, atomic blocks.
   - Added a `Gate` button to the group header in [`SortableGroupCard`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/workflows/[id]/page.tsx#L350-L380) with active amber styling.
   - When a group has `gate: true`, rendered an approval checkpoint banner at the bottom boundary of the group card indicating execution will pause there for developer approval.

3. **Execution Runtime Mechanics**:
   In [`client/lib/stores/console-store.ts`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/lib/stores/console-store.ts):
   - Added `toggleGroupGate(wfId, groupId)`.
   - In `startRun`: When a group has `gate: true`, the last step in that group is marked with `gate: true`. The harness executes `skill1` and `skill2`, runs the prompt, and automatically pauses at the gate checkpoint before transitioning to the next group.

4. **Project Chat Flow Visualization**:
   In [`client/components/projects/project-ai-chat.tsx`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/projects/project-ai-chat.tsx):
   - Updated the Tagged Skills Bar above the chat input to group skills by phase and render amber `Gate` checkpoint badges at group boundaries (`[Group 1: skill1, skill2] -> [Gate] -> [Group 2: skill3, skill4]`).

## Consequences

### Positive
- Matches natural developer intuition: atomic skills execute together without micro-pauses; checkpoints occur at major phase boundaries.
- Clean, decluttered step cards in the workflow editor.
- Visual flow alignment in project chat: the developer sees the exact execution pipeline and where gates will pause.
