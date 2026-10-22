# ADR 0064: Duplicate Skill Warning Badge in Workflow Skill Selection

## Context
In agent workflows, developers frequently bind the same skill into multiple step groups or even multiple times within the same phase (e.g. running code linting before and after refactoring). However, accidentally re-adding an already included skill can create duplicate steps unintentionally. Disabling duplicate additions would restrict valid multi-phase patterns, while modal popups add disruptive friction.

## Decision
1. In [`AddSkillDialog`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/dialogs/add-skill-dialog.tsx), compute the occurrence count of each skill within the target step group (or workflow).
2. When a skill is already present, render an inline amber/yellow warning badge:
   - Icon: `<AlertTriangle className="h-3 w-3 text-amber-500" />`
   - Label: `Already in group` (or `Already in workflow`) with the step count if greater than 1 (e.g. `(2)`).
   - Styling: Subtle amber text, background, and border (`text-amber-500 bg-amber-500/10 border-amber-500/25`).
3. Keep the skill fully selectable and addable, providing clear informational awareness without blocking developer intent.

## Consequences
- Prevents accidental duplicates through ambient visual awareness.
- Preserves the ability to intentionally run identical skills with distinct step configurations (custom instructions or approval gates).
