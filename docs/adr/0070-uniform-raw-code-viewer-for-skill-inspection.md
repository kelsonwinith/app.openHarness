# ADR 0070: Uniform Raw Code Viewer for Skill Inspection

## Context
Previously, [`SkillDetailDialog`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/dialogs/skill-detail-dialog.tsx) maintained multi-tab switching (`Preview`, `Raw Text`, `Frontmatter`) specifically for markdown files while showing raw code for other file extensions. Having distinct preview paradigms created inconsistency and added unnecessary UI complexity for developers who want to inspect the exact, authentic file contents as executed by agent harnesses.

## Decision
1. Eliminate the preview and frontmatter tab switchers in [`SkillDetailDialog`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/dialogs/skill-detail-dialog.tsx).
2. Render all skill files uniformly in the clean, line-numbered raw monospace viewer with:
   - File icon and path
   - Total line count indicator
   - Quick one-click "Copy" action
   - Unaltered raw syntax and YAML frontmatter headers displayed exactly as stored on disk.

## Consequences
- Fast, consistent, and predictable file inspection across all file types (`SKILL.md`, Python scripts, YAML specs, JSON configurations).
- Simpler codebase without fragile markdown or frontmatter AST rendering.
