# 61. Automatic Workflow Step Pruning Upon Skill Deletion with Pre-flight Warning

Date: 2026-10-22

## Status

Accepted (Extends ADR 0001 & ADR 0060)

## Context

Per ADR 0001, workflows compose skills by referencing their ID rather than embedding copies of the skill definition. When a developer deletes a skill from the library, any workflows referencing that skill would contain dangling or invalid step pointers if left untouched.

## Decision

1. **Pre-flight Impact Warning**:
   - The deletion confirmation dialog explicitly calculates and displays the exact count of referencing steps and affected workflows before proceeding.
   - Highlights that deleting the skill will run `npx skills remove --global <skill-name>` and prune all referencing steps automatically.
2. **Comprehensive Cascade Pruning**:
   - `deleteSkill` in `console-store.ts` prunes matching steps from both flat workflow steps (`wf.steps`) and grouped workflow steps (`wf.groups[].steps`).
   - Workflows with zero remaining steps remain intact as empty templates ready for new skill assignments.

## Consequences

- Prevents dangling skill references and runtime execution errors in workflows.
- Developer has full transparency regarding workflow impact before confirming skill removal.
- Maintains strict relational integrity across both grouped and flat workflow templates.
