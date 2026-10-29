# 0099. Phase Skill Picker Flat Table Layout and Hover-Remove Interaction

Date: 2026-10-28

## Status
Accepted

## Context
The workflow phase skill picker modal previously wrapped its table in a nested bordered card container with padding (`p-6` around `rounded-lg border bg-card shadow-xs`), resulting in an over-boxed "box inside another box" appearance with excessive redundant badge containers per row. Additionally, the `Added` button provided no clear visual indication that clicking it again would remove/detach the skill from the phase.

## Decision
1. **Remove Nested Box-in-a-Box Layout**:
   - Flattened [phase-skill-picker-dialog.tsx](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/dialogs/phase-skill-picker-dialog.tsx) by removing the intermediate card wrapper and outer padding. The table now flows directly edge-to-edge within the modal's scroll container with sticky header support.
   - Cleaned up row item boxes: removed redundant `Attached` badges and heavy pill borders, presenting source and workflow counts as lightweight typography and inline icons.

2. **Interactive Hover-to-Remove Button**:
   - Configured the `Added` action button with Tailwind `group/btn` hover transitions:
     - Normal state: subtle emerald styling displaying `✓ Added`.
     - Hover state: shifts to destructive styling displaying `🗑 Remove`.

## Consequences
- The modal layout is clean, flat, and spacious without nested card containers.
- Users have an intuitive and immediate visual cue that hovering over an attached skill will remove it from the workflow phase.
