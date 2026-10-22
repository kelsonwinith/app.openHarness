# ADR 0043: Removal of Bottom Toast Alerts in Favor of Direct Inline Error Labels

## Status
Accepted

## Context
Previously, the application utilized the Sonner toast notification system (`<Toaster />`) to display ephemeral alert dialogs raised from the bottom corner of the viewport for both successful operations (`toast.success`, `toast.info`) and error states (`toast.error`).

Raising popup alert bubbles from the edge of the screen disconnected the notification from the context of user interaction, creating jarring peripheral interruptions. Ephemeral popups could also be missed or disappear before the user finished reading error details.

The user explicitly instructed:
"remove all dialog that raise bottom left both success and fail
fail should label directly not sending dialog alert"

## Decision
1. **Completely eliminate the toast notification system**:
   - Removed `<Toaster />` from `client/components/providers.tsx`.
   - Removed all `toast.error`, `toast.info`, and `toast.success` invocations across the client application.
   - Removed all `sonner` imports from UI components and hooks.
2. **Direct contextual inline error labeling**:
   - In form dialogs (`SessionFormDialog`, `WorkflowFormDialog`, `ProjectCloneDialog`, `ProjectOpenDialog`, `ProjectCreateDialog`, `SkillFormDialog`, `LaunchRunDialog`), validation and failure states now set an inline `error` state.
   - Errors are rendered directly within the form context using prominent inline error labels (`<p className="text-xs text-destructive font-medium ...">{error}</p>`).
   - Typing or modifying the relevant form fields automatically clears the error state.
   - Background actions without forms (such as folder reveals in file managers) fail gracefully with `console.error` rather than sending edge toast alerts.

## Consequences
- No bottom-screen popup toasts or notifications ever appear for successes or failures.
- Errors are prominently situated where the user's attention is focused (directly next to the input or action being executed).
- Destructive confirmation modals (`ConfirmDialog`) remain active as intentional, centered user guardrails.
