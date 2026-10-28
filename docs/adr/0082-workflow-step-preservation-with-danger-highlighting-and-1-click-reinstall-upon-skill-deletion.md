# 82. Workflow Step Preservation with Danger Highlighting and 1-Click Reinstall upon Skill Deletion

Date: 2026-10-22

## Status

Accepted (Supersedes ADR 0061)

## Context

Previously under ADR 0061, deleting a skill automatically and silently pruned all referencing steps from workflows and workflow groups. This caused unexpected changes to workflow templates: developers lost their defined sequences, custom instructions, and step groupings if a skill was removed or uninstalled outside the app.

## Decision

We replaced automatic step pruning with step preservation, danger highlighting, and 1-click remediation:
1. **Preserve Workflow Steps**:
   - In [`client/lib/stores/console-store.ts`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/lib/stores/console-store.ts), `deleteSkill` no longer deletes steps from workflows.
   - When skills are added or deleted, snapshot metadata (`skillName`, `skillSource`) is recorded on [`Step`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/lib/domain/types.ts).
2. **Danger Highlighting on Missing Steps**:
   - In [`client/app/workflows/[id]/page.tsx`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/workflows/[id]/page.tsx), when a step's underlying skill is not found in the local catalog (`!baseSkill`):
     - Step item is styled with destructive tokens: `border-destructive/60 bg-destructive/5 text-destructive`.
     - Displays an `<AlertTriangle />` warning icon, struck-through skill name, a `"Missing Skill"` badge, and an explanatory warning message.
3. **1-Click Inline Reinstallation & Step Deletion**:
   - Added an inline **`[Reinstall]`** button with an animated spinner (`<Loader2 />`) calling `/api/skills/install` with the snapshot source/package name.
   - On successful install, the newly installed skill is added to the store via `createSkill` and the card automatically returns to normal active state.
   - Added a direct **`[Delete]`** button allowing developers to intentionally remove the step from the workflow.

## Consequences

### Positive
- Workflow templates never lose their structure or custom instructions when skills are uninstalled.
- Instant 1-click recovery from missing skill dependencies.
- Clear visual feedback highlighting broken dependencies before executing workflows.
