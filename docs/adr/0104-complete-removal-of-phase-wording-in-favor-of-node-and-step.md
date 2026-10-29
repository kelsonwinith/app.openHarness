# ADR 0104: Complete Removal of User-Facing "Phase" Wording

## Context
Across earlier iterations of the workflow engine, nodes in workflow execution graphs were referred to as "Phases" (e.g., "Phase 1", "Add Skills to Phase", "Approval Gate: Phase Complete", "reproduce phase"). As the graph architecture evolved into a unified node canvas with 4-way handles and direct skill attachments, user feedback requested the total elimination of "phase" across all user-facing labels, defaults, tooltips, dialogs, and messages in favor of standard node and step terminology.

## Decision
1. **Node Defaults**:
   - Replaced default newly created node names from `Phase ${index}` to `Node ${index}` in [workflow-editor-canvas.tsx](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/flow/workflow-editor-canvas.tsx).
   - Replaced graph serialization fallback names from `'Execution Phase'` / `'Untitled Phase'` to `'Execution Node'` / `'Untitled Node'` in [workflow-graph.ts](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/lib/domain/workflow-graph.ts).
2. **Skill Picker Dialog**:
   - Changed modal title from "Add Skills to Phase" to "Add Skills to Node" in [phase-skill-picker-dialog.tsx](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/dialogs/phase-skill-picker-dialog.tsx).
   - Changed selection indicator fallback from `{phaseName || 'Selected Phase'}` to `{phaseName || 'Selected Node'}`.
   - Changed empty catalog prompt to "attach them to workflow nodes".
   - Changed counter footer to `{attachedSkillIds.size} skills attached to node`.
3. **Node Logs Modal**:
   - Changed default title from "Phase Execution Logs" to "Node Execution Logs" in [node-log-modal.tsx](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/dialogs/node-log-modal.tsx).
   - Changed empty state message to "No execution traces recorded for this node yet."
4. **Project Execution & Chat**:
   - Updated approval gate status indicator from `'Phase'` to `'Step'` in [project-ai-chat.tsx](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/projects/project-ai-chat.tsx).
   - Changed gate action prompts from "reproduce phase" to "reproduce step".
   - Updated gate checkpoint card description in [workflow-run-message.tsx](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/projects/workflow-run-message.tsx) to "This step has finished. Approve to proceed, or write feedback in the chat prompt below to reproduce this step with adjustments."
5. **Simulation Traces**:
   - Updated feedback activity trace in [simulation-engine.ts](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/lib/simulation/simulation-engine.ts) to log `Feedback received: "..." — re-running step`.

## Status
Accepted and verified through TypeScript compilation and Next.js production build.
