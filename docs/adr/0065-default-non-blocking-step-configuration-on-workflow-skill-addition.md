# ADR 0065: Default Non-Blocking Step Configuration on Workflow Skill Addition

## Context
When adding skills to workflow groups (either individually or in batch), step instances can either inherit non-blocking execution or be initialized with default approval checkpoints and custom prompt overrides.

## Decision
1. In [`AddSkillDialog`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/dialogs/add-skill-dialog.tsx), initialize newly bound steps with:
   - `gate: false` (non-blocking continuous pipeline flow)
   - `instructions: ""` (inherits skill canonical prompt instructions without override)
2. Developers can toggle the approval gate via the in-line shield icon or customize prompt instructions via step settings at any point in the workflow canvas.

## Consequences
- Clean, predictable workflow creation without unintended pause points.
- Keeps batch-adding frictionless and aligns with continuous automation standards.
