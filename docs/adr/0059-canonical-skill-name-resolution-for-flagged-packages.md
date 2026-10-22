# 59. Canonical Skill Name Resolution for Flagged Packages

Date: 2026-10-22

## Status

Accepted

## Context

When installing specific skills from multi-skill repositories or packages (e.g. `npx skills add https://github.com/mattpocock/skills --skill grill-with-docs`), the naive URL parser previously derived the skill name as `skills` (from the repository basename), rather than the target skill specified by `--skill` or `-s`.

A skill must be identified strictly and canonically by its exact skill name (e.g. `grill-with-docs`) across installation, filesystem directories (`~/.agents/skills/grill-with-docs`), and console catalog listings.

## Decision

1. **Flagged Skill Name Extraction**:
   - `parseSourceToName` inspects explicit flags (`--skill <name>`, `-s <name>`) and scoped syntax (`<package>@<skill>`) before falling back to repo/package names.
2. **Canonical Name Verification**:
   - Parses the actual installed skill name directly from the `npx skills add` stdout confirmation (e.g. `Selected 1 skill: grill-with-docs` or `✓ grill-with-docs (copied)`).
   - Validates against YAML frontmatter (`name: grill-with-docs`) within the target `SKILL.md`.
3. **Strict Name Isolation**:
   - Ensures repository names (e.g. `mattpocock/skills`) are treated purely as package distribution sources, while the resulting skill is named strictly `grill-with-docs`.

## Consequences

- Prevents repository name collisions when installing individual skills from multi-skill repositories.
- Guarantees exact parity between the skill's directory on disk (`~/.agents/skills/grill-with-docs`), its YAML frontmatter, and the console skill catalog.
