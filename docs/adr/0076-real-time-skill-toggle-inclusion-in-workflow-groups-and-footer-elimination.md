# 76. Real-time Skill Toggle Inclusion in Workflow Groups and Footer Elimination

Date: 2026-10-22

## Status

Accepted

## Context

Adding skills to workflow groups previously required a two-step multi-select modal:
1. Checking multiple checkboxes and clicking a bottom footer button (`Add Selected (N)`), or clicking individual "+ Add" buttons in the rightmost column.
2. The modal retained a persistent bottom footer bar with selection counts and a redundant "Done" button.
3. This did not clearly convey which skills were already included in the group versus other groups in the workflow, and required unnecessary clicks to commit additions.

## Decision

We revamped [`client/components/dialogs/add-skill-dialog.tsx`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/dialogs/add-skill-dialog.tsx) and built a dedicated accessible [`Switch`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/ui/switch.tsx) component:
1. **Direct Toggle Inclusion**:
   - Each skill row features a toggle switch indicating whether the skill is currently active/included in the selected workflow group.
   - Clicking either the switch or anywhere on the table row immediately toggles inclusion: adding the skill or removing all its steps from the group in real-time.
   - Real-time persistence updates the store and host filesystem instantly.
2. **Removed Action Buttons and Footer**:
   - Eliminated the "+ Add" button column.
   - Removed the modal footer bar (`<DialogFooter>`) completely, allowing the table to utilize the full dialog height.
3. **Contextual Awareness**:
   - Header displays the count of active skills in the target group (`{N} included`).
   - Included skills display an "Included" pill badge and subtle row highlight.
   - If a skill is used in another group of the same workflow, an informational tag (`In "GroupName"`) indicates its cross-group presence.
   - Maintained the preview eye button next to the toggle for quick inspection of skill contents without closing the dialog.

## Consequences

### Positive
- Streamlined, friction-free workflow building with immediate tactile feedback.
- Clean dialog design without redundant footer buttons.
- Fully synchronized state with instant persistence.
