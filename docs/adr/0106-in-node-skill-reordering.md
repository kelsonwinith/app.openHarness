# ADR 0106: In-Node Skill Reordering with Drag-and-Drop and Stepper Controls

## Context
When attaching multiple skills to a workflow node, developers need the ability to define and adjust their execution order directly inside the node card on the canvas without leaving the editor or rebuilding the workflow.

## Decision
1. **Reorder State & Handler**:
   - Implemented `handleReorderSkills(nodeId, fromIndex, toIndex)` in [workflow-editor-canvas.tsx](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/flow/workflow-editor-canvas.tsx), mutating the `steps` array within the specified node and setting `isDirty(true)`.
2. **Interactive Node UI**:
   - Updated [phase-node.tsx](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/flow/phase-node.tsx) with two complementary reordering mechanisms:
     - **Native HTML5 Drag & Drop**: Each skill item supports dragging with `draggable` when multiple skills exist. Uses the `nodrag` class to prevent React Flow canvas dragging. Provides visual drop cues (`ring-1 ring-primary bg-primary/10` and `border-dashed opacity-30` for the dragged item).
     - **Quick Move Up / Down Buttons**: Hovering over a skill row displays `ChevronUp` and `ChevronDown` buttons alongside the delete button for quick 1-click reordering.
     - **Drag Grip Indicator**: Added a subtle `GripVertical` icon when a node has multiple skills.
     - **Clean Skill Rows**: Removed order index badges (`#1`, `#2`...) to keep the UI clean and clutter-free, focusing solely on smooth drag and stepper reordering interactions.

## Status
Accepted and verified through TypeScript compilation and Next.js production build.
