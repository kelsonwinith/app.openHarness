# ADR 0044: Skill Installation by Package Source Without Redundant Skill Name Field

## Status
Accepted

## Context
When installing a skill via the **Install Skill** modal dialog (`SkillFormDialog`), the form previously required users to fill in both:
1. `NPX Package or GitHub URL` (`source`)
2. `Skill Name` (`name`)

Since agent skills installed via NPX packages or GitHub URLs inherently identify themselves by their package/repository name (e.g., `vercel-react-best-practices`, `git-commit-helper`), having a separate manual `Skill Name` input was redundant and created friction during installation.

## Decision
1. **Remove manual Skill Name input from the Install Skill form**:
   - When installing a new skill (`!isEditing`), the dialog only requests the package or repository source (`source`).
   - The skill name is automatically derived from the package/repo specifier (e.g. `npx skills add vercel-react-best-practices` automatically extracts `vercel-react-best-practices`).
2. **Retain Rename functionality for existing skills**:
   - When editing an already installed skill (`isEditing`), the dialog acts as **Rename Skill** and displays only the `Skill Name` input to allow customization after installation.

## Consequences
- 1-step, frictionless skill installation requiring only the package or repository string.
- Zero redundant inputs when adding skills to the library.
- Existing skills can still be renamed via the Rename modal or actions dropdown.
