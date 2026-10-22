# ADR 0042: Removal of Success Notification Toasts

## Status
Accepted

## Context
The application previously displayed brief toast notifications (using `sonner`) across various pages and modal dialogs whenever a user completed an action successfully (e.g., adding a harness, creating a session, renaming a group, reordering workflows, saving settings, cloning a repository).

These intrusive notification alerts created visual clutter and interrupted interaction flow for standard, expected user actions that already have clear inline feedback (such as immediate DOM updates, modal dismissals, or router navigation). The user requested to completely remove notification alerts when successfully doing something across the entire console while keeping destructive confirmation modals and error notifications intact.

## Decision
1. **Completely eliminate all `toast.success` and informational notification alerts**:
   - Removed all `toast.success(...)` and non-error `toast.info(...)` calls across all pages, components, dialogs, and hooks.
   - Cleaned up unused `sonner` imports where no error toasts remained.
2. **Preserve confirmation modals and error handling**:
   - Destructive confirmation modals (`ConfirmDialog` via `openDialog('confirm', ...)`) remain intact to prevent accidental deletions.
   - Critical error toasts (`toast.error(...)`) remain in place to notify users of network failures, backend errors, or validation issues.

## Consequences
- Clean, non-intrusive UI interaction where routine actions execute immediately without ephemeral popups.
- Reduced code size and fewer side effects in event handlers and dialog callbacks.
- Destructive actions still require explicit confirmation via modals, preserving user safety.
