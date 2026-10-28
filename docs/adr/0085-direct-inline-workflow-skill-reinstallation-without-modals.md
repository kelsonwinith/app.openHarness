# 85. Direct Inline Workflow Skill Reinstallation Without Modals

Date: 2026-10-23

## Status

Accepted

## Context

When a workflow contains a step referencing a deleted or missing skill, the workflow editor displays the step card in a highlighted danger state with an inline `[Reinstall]` action button.

Previously, if reinstallation encountered an error or lacked exact source metadata, the system fell back to opening the general "Add Skill" dialog modal (`openDialog('add-skill')`). The user specified:
> "the missing skill when click reinstall it should install directly nothing else"

Opening modal dialogs or redirecting away from the canvas breaks context, disrupts user focus, and violates the requirement that missing skills be installed directly where they are with zero modal popups.

## Decision

1. **Elimination of Modal Fallbacks**:
   In [`client/app/workflows/[id]/page.tsx`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/workflows/[id]/page.tsx), completely removed all invocations of `openDialog('add-skill')` within `handleReinstallStep`. Reinstallation stays strictly localized to the step card.

2. **Inline Error State Tracking**:
   Introduced `reinstallErrors: Record<string, string>` in workflow state. When reinstallation fails (network error, unknown package, or missing source name), the exact error message is recorded by `stepId`.

3. **Step Card Error Display**:
   Passed `reinstallError` through `SortableGroupCard` down to `SortableStepItem`. When present, an inline red warning badge (`Installation failed: <error>`) is rendered beneath the missing skill alert. The user can immediately retry with 1 click or delete the step directly from the card.

4. **Automatic Error Clearing on Success/Retry**:
   Clearing `reinstallErrors[stepId]` immediately upon triggering a new reinstall attempt or successful installation.

## Consequences

### Positive
- Zero modal interruptions: reinstallation runs entirely inline with animated `<Loader2 className="animate-spin" />` feedback on the step button.
- Clear error visibility: failures are communicated directly where the action occurred with contextual error details.
- Context preservation: the user never leaves their position in the workflow editor canvas.
