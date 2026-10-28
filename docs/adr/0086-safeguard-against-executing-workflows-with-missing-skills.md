# 86. Safeguard Against Executing Workflows with Missing Skills

Date: 2026-10-23

## Status

Accepted

## Context

When a workflow contains steps referencing uninstalled or missing skills, attempting to execute the workflow in project chat would cause runtime errors or unhandled harness failures. The developer needs immediate visibility and safeguards before initiating a run.

In the `/grill-with-docs` decision session, the user chose:
> "(Recommended) Block run & show warning: Prevent execution and prompt developer to reinstall missing skills in the workflow editor"

## Decision

1. **Workflow Selection Dropdown Indicator**:
   In [`client/components/projects/project-ai-chat.tsx`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/projects/project-ai-chat.tsx), each workflow item in the flow selector dropdown inspects its steps against the global `skills` catalog. If missing skills exist, a red badge (`N missing`) and a destructive icon are displayed directly in the dropdown menu.

2. **Flow Bar Warning & Direct Editor Deep Link**:
   When a workflow with missing skills is selected:
   - The Tagged Skills Bar switches to a destructive border/background (`bg-destructive/5 border-destructive/30`).
   - Missing step chips are styled with danger badges (`(missing)` in bold red).
   - A warning banner is displayed below the step chips: `"Execution blocked: N skills are missing or uninstalled."` alongside a clickable deep link `[Reinstall in Editor ->]` navigating directly to `/workflows/[id]`.

3. **Execution Guard & Disabled Launch Action**:
   - The `handleSend` function validates `!(selectedWorkflow && hasMissingSkills)` before creating sessions or invoking `startRun`.
   - The submit/launch button is rendered disabled with a descriptive tooltip (`"Execution blocked: workflow contains missing skills. Reinstall in Workflow Editor to run."`) and styled in dimmed destructive colors.

## Consequences

### Positive
- Prevents broken harness execution runs before they start.
- Clear, immediate feedback with zero modals.
- 1-click navigation directly to the workflow editor where inline 1-click reinstallation is available.
