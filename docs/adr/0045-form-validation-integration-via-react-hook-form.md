# ADR 0045: Form State and Validation Integration via React Hook Form

## Status
Accepted

## Context
Following the elimination of bottom-screen toast alert dialogs, forms required standardized validation and direct contextual feedback. Previously, forms managed state through disparate `useState` variables and manual submit conditionals, leading to inconsistent validation feedback and field error states.

The user instructed:
"also use reack hook form lib to display invalid fields etc ..."

## Decision
1. **Adopt `react-hook-form` across modal dialog forms**:
   - Installed `react-hook-form`.
   - Converted `SkillFormDialog`, `WorkflowFormDialog`, `SessionFormDialog`, `ProjectCreateDialog`, `ProjectCloneDialog`, and `ProjectOpenDialog` to `useForm`.
2. **Contextual invalid field highlighting and error labels**:
   - Enhanced `Input` and `Textarea` UI primitives with `aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive` classes.
   - Connected `aria-invalid={!!errors[fieldName]}` to invalid form fields, instantly rendering destructive red borders and focus rings upon validation failure.
   - Rendered inline error messages (`errors[fieldName]?.message`) directly underneath the corresponding input fields.
   - Supported root form errors (`errors.root`) for backend/API error responses (such as directory scaffold failures or git clone network issues).

## Consequences
- Predictable, standardized form validation and lifecycle across all dialogs.
- Clear visual invalid field indication with accessible ARIA attributes and direct inline feedback.
- Clean separation of form state, input registration, and submission logic.
