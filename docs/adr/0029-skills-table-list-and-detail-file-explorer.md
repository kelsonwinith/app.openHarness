# ADR 0029: Skills Table View and Detail Modal with File Explorer

## Status
Accepted

## Context
Following the shift where skills are modular packages installed via NPX or imported from GitHub repositories, users need a fast, high-density inventory view of installed skills and a direct way to inspect their internal structure, documentation, and executable scripts.

## Decision
1. **Table View for Skills**:
   - Replaced the single-column sortable card list on `/skills` with a clean, high-density table view.
   - Columns:
     - **Name**: Skill icon, title, and inline description.
     - **Workflows**: Count of workflows currently utilizing the skill.
     - **Date Added**: Timestamp formatted to calendar date (`fmtDate`).
     - **Updated**: Relative time since last update (`fmtRel`).
     - **Actions**: Inspect action (`Eye`) and delete action (`Trash2`).
   - Clicking anywhere on a skill row opens the detailed inspection modal.

2. **Skill Detail Modal with File Explorer (`SkillDetailDialog`)**:
   - Provides a split-pane inspector:
     - **Left Pane (File Explorer)**: A mini file explorer tree displaying files and folders within the skill bundle (e.g., `SKILL.md`, `scripts/run.py`, `references/guide.md`, `package.json`).
     - **Right Pane (File Viewer)**: Monospace code viewer with path breadcrumbs, line numbers, and a 1-click clipboard copy button.

3. **Domain File Bundling (`getSkillFiles`)**:
   - Implemented `getSkillFiles` to provide consistent directory structures across newly installed or existing skills, preserving custom files when provided.

## Consequences
- Viewing, sorting, and auditing skills is significantly faster and cleaner.
- Developers can inspect skill directives and accompanying runner scripts (`SKILL.md`, `scripts/run.py`) directly from the UI without needing an external terminal or editor.
