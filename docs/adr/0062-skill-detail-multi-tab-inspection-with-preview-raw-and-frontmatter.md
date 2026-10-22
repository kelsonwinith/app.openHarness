# ADR 0062: Skill Detail Multi-Tab Inspection with Preview, Raw, and Frontmatter

## Context
When inspecting skills in the OpenHarness catalog or project flows, users need to examine both the human-readable markdown instructions and the raw YAML frontmatter / scripts. Presenting only a raw code view or only an unparsed file tree forces users to manually parse YAML frontmatter boundaries (`---`) and read raw unformatted markdown.

## Decision
1. Enhance [`SkillDetailDialog`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/dialogs/skill-detail-dialog.tsx) with a multi-tab view mode switcher for Markdown files (`SKILL.md` and related `.md` docs):
   - **Preview Tab**: Formatted rendered markdown displaying hierarchical headers, lists, code snippets, blockquotes, and clean line spacing.
   - **Raw Text Tab**: Line-numbered code viewer for inspecting the raw document and copying source contents.
   - **Frontmatter Tab**: Dedicated structured key-value property view displaying the parsed YAML metadata (`name`, `description`, tags, etc.) conforming to the OpenCode / Anthropic Agent Skills Specification.
2. For non-markdown files (e.g. `.py`, `.sh`, `.json`), the viewer automatically defaults to the line-numbered code viewer without cluttering the interface with redundant mode switches.

## Consequences
- Developers get instant, human-readable previews of skill prompts without losing access to raw code or YAML metadata.
- Matches agent developer expectations across standard toolings (VS Code, GitHub, Cursor).
