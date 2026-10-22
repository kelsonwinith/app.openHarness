# ADR 0032: Removal of Skill Description

## Status
Accepted

## Context
Skills in openHarness are imported directly from package registries (`npx`) or GitHub repositories as functional instruction packages containing `SKILL.md` and runnable scripts. Requiring a separate human-written "description" field duplicated information already captured in the skill name and internal documentation, adding friction to installation and visual clutter across lists and dialogs.

## Decision
1. **Removed Skill Description**:
   - **Skills Table** (`/skills`): The Name column displays solely the skill name; search queries filter purely on skill name.
   - **Install / Edit Skill Dialog** (`SkillFormDialog`): Removed the Description input field. The modal only requires the package/repo source or skill name.
   - **Add Skill to Group Dialog** (`AddSkillDialog`): Removed description previews; the list cleanly presents skill names.
   - **Workflow Step Item** (`/workflows/[id]`): Steps display only the skill name and instruction overrides (if any); fallback description text was eliminated.
2. Made `description` optional in the domain type `Skill` in `client/lib/domain/types.ts` to preserve compatibility with existing persisted records.

## Consequences
- Skills are completely minimalist: a skill is identified simply by its name and executable package contents.
- Dialogs for installing or selecting skills are faster to navigate with fewer input fields.
