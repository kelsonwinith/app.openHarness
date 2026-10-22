# ADR 0071: Elimination of Footer Bar in Skill Detail Dialog

## Context
[`SkillDetailDialog`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/dialogs/skill-detail-dialog.tsx) formerly contained a bottom footer bar showing internal `id: <skill-id>` and an explicit "Close" button. The modal already features a top-right `✕` close button provided by the standard dialog header and supports clicking outside or pressing `Esc` to dismiss. The footer occupied vertical real estate without adding functional value.

## Decision
1. Remove the bottom footer bar completely from [`SkillDetailDialog`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/dialogs/skill-detail-dialog.tsx).
2. Maximize the split-pane file explorer and raw code viewing area across the entire modal height.

## Consequences
- More vertical lines visible when inspecting skill code and prompt instructions.
- Minimalist, distraction-free modal interface.
