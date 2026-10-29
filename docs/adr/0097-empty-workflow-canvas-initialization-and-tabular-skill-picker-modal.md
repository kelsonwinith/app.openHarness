# 0097. Empty Workflow Canvas Initialization and Tabular Skill Picker Modal

Date: 2026-10-28

## Status
Accepted

## Context
When creating new workflows, the editor previously synthesized a default "Execution Phase" node even if the workflow was completely empty. Users expect newly created workflows to start with a blank canvas (`nodes: [], edges: []`), allowing them to build graphs from scratch using `+ Node`.

Additionally, the "+ Add Skill" action on a workflow phase node previously opened a simple card list. To ensure visual consistency and provide full metadata (workflows usage count, creation date, instructions snippet, and instant preview), the picker needed to match the tabular layout, live search, and sorting behavior of the main Skills page (`client/app/skills/page.tsx`).

## Decision
1. **Empty Workflow Canvas Initialization**:
   - Updated `ensureWorkflowGraph` in [workflow-graph.ts](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/lib/domain/workflow-graph.ts) to check if `Array.isArray(wf.nodes)` and return an empty graph if `wf.nodes` is `[]`. If `wf.nodes` is undefined and both `groups` and `steps` are empty, it returns `{ nodes: [], edges: [] }` without synthesizing default phase nodes.
   - Initialized `nodes: []` and `edges: []` in `createWorkflow` within [console-store.ts](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/lib/stores/console-store.ts).

2. **Tabular Skill Picker Modal**:
   - Replaced card list in [phase-skill-picker-dialog.tsx](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/dialogs/phase-skill-picker-dialog.tsx) with a data table matching the Skills page styling.
   - Added live search filtering across skill names and instruction text.
   - Added interactive sortable headers for `Name`, `Workflows`, and `Date Added`.
   - Included full row actions: an inspect button (`Eye`) triggering [skill-detail-dialog.tsx](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/dialogs/skill-detail-dialog.tsx), and toggle attachment button (`Added` / `Attach`).

## Consequences
- Newly created workflows now open cleanly with an empty canvas ready for user-defined nodes.
- Attaching skills to phase nodes in the workflow canvas provides immediate visibility into skill origins, instructions, and existing workflow usage with instant search and sorting.
