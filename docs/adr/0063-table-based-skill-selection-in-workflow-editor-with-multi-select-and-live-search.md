# ADR 0063: Table-Based Skill Selection in Workflow Editor with Multi-Select and Live Search

## Context
In previous iterations, the workflow editor's "Add Skill" dialog displayed a simple, cramped vertical list with limited metadata and single-skill binding. Users had to reopen the dialog repeatedly when constructing multi-step workflows or searching across an expanding catalog of skills. In contrast, the dedicated Skills Library page provided a structured, sortable table with usage counters, creation dates, and search filtering.

## Decision
1. Redesign [`AddSkillDialog`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/dialogs/add-skill-dialog.tsx) into a wide table-based picker mirroring the Skills Library layout:
   - **Live Search**: Instant filtering across installed skill names.
   - **Sortable Headers**: Sort by Name, Workflow usage count, and Date Added (ascending/descending).
   - **Multi-Select Batch Add**: Checkboxes on each row plus a select-all toggle, accompanied by an `Add Selected (N)` action in the modal footer.
   - **Quick Add**: An inline `+ Add` button per row that immediately binds the skill into the target step group and shows a green `Added` confirmation state without closing the dialog.
   - **In-Context Inspection**: An embedded `Eye` preview button that invokes [`SkillDetailDialog`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/dialogs/skill-detail-dialog.tsx) so developers can inspect markdown instructions and YAML frontmatter prior to adding.
   - **Group Context Badge**: Displays the active target group name in the modal title bar.

## Consequences
- Faster workflow construction: developers can add several skills in one step without modal thrashing.
- Visual and ergonomic parity between the main Skills Library and the Workflow builder dialog.
