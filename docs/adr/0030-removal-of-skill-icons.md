# ADR 0030: Complete Removal of Skill Icons

## Status
Accepted

## Context
Following earlier architectural simplifications where skills were stripped of arbitrary categories and type taxonomy (a skill is simply a skill imported via NPX or GitHub), assigning arbitrary visual icons (e.g. `Sparkles`, `Code2`, `Terminal`) to skills added visual clutter without conveying meaningful functional information.

## Decision
1. Removed all skill icon elements and bindings across the entire application:
   - **Skills Table Page** (`/skills`): Removed icon badges; skill names are displayed cleanly and prominently.
   - **Skill Detail Modal** (`SkillDetailDialog`): Removed icon header block; displays skill name, source tag, and metadata.
   - **Workflow Step Builder** (`/workflows/[id]`): Steps in groups display the skill name directly without an icon prefix.
   - **Add Skill to Group Dialog** (`AddSkillDialog`): Removed icon squares in the skill picker list.
   - **Configure Step Dialog** (`EditStepDialog`): Removed icon from the header.
   - **Install Skill Dialog** (`SkillFormDialog`): Removed icon state and input defaults.
2. Made `icon` optional on the `Skill` domain interface in `client/lib/domain/types.ts` for backwards compatibility with any persisted storage state.

## Consequences
- The UI presents a cleaner, typography-driven presentation where the skill name and its executable files (`SKILL.md`, `scripts/run.py`) are central.
- Eliminates icon picker friction and visual inconsistencies when importing third-party skills from external registries or Git repositories.
