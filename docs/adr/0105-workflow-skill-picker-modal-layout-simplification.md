# ADR 0105: Workflow Skill Picker Modal Layout Simplification

## Context
In the workflow canvas skill picker modal (`PhaseSkillPickerDialog`), the search bar occupied a separate row with an extra bottom border (`border-b`), creating an unnecessary divider directly above the table header. In addition, the modal had a bottom footer bar with a redundant "Done" button (as users can already dismiss the modal via the standard close button, backdrop click, or Escape key).

## Decision
1. **Header-Integrated Search Input**:
   - Moved the search input directly into the header bar on the right-hand side (`pr-7` margin to ensure clearance with the modal close button).
   - Set the search input to standard compact width (`w-64`) instead of full-width stretching.
2. **Removed Divider**:
   - Removed the intermediate search bar container, eliminating the double divider line between search and table headers. The table header now immediately attaches to the dialog header.
3. **Removed Footer**:
   - Removed the bottom footer bar and "Done" button. The table scroll container flows seamlessly to the bottom edge of the dialog.

## Status
Accepted and verified through TypeScript compilation and Next.js production build.
