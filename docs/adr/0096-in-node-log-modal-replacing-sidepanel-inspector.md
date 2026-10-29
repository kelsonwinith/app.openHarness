# ADR 0096: In-Node Log Modal Replacing Sidepanel Inspector and Canvas Isolation

## Status
Accepted

## Context
Previously, clicking anywhere on a node within the canvas triggered a right-hand sliding sidepanel inspector (`NodeInspectorDrawer`). This introduced several UX and interaction challenges:
1. **Accidental Sidepanel Openings**: When developers interacted with nodes or dragged canvas elements, clicking the node body would accidentally open a drawer that covered a substantial portion of the decision graph.
2. **Editor vs. Execution Domain Confusion**: In the workflow editor canvas, templates define the structural design and static skill bindings of a workflow; there are no live execution activities, process outputs, or approval gate states. Displaying a live log drawer or execution actions in the workflow designer was invalid and confusing.
3. **Ergonomics of Execution Inspection**: During runtime execution, users need focused inspection on specific phase steps (such as reviewing live agent actions, checkpoint gate approval prompts, or failure logs) without displacing the canvas layout.

## Decision
1. **In-Node Logs Trigger**:
   - Added a compact, dedicated `Logs` button (`Terminal` icon) in the header of [`PhaseNode`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/flow/phase-node.tsx) that is **only** rendered when `isExecutionMode: true` (Project Execution Canvas).
   - Removed any `onClick` handler from the node card root element, preventing accidental activations when panning or selecting nodes.
2. **Centered Modal Dialog for Live Logs**:
   - Replaced `NodeInspectorDrawer` with [`NodeLogModal`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/dialogs/node-log-modal.tsx).
   - The modal displays the phase title, assigned agent harness, bound skills, checkpoint gate status with approve/stop controls, and real-time execution activities in a centered Radix dialog without covering canvas navigation.
3. **Workflow Editor Canvas Isolation**:
   - In [`WorkflowEditorCanvas`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/flow/workflow-editor-canvas.tsx), all sidepanel and modal triggers have been removed. Node cards only display design-time controls (e.g. toggle approval gate checkpoint, delete phase node, add skill).
4. **Deprecation**:
   - Completely deleted `client/components/flow/node-inspector-drawer.tsx`.

## Consequences
- Clean separation between workflow template modeling and runtime execution inspection.
- Unintentional sidepanel openings are eliminated.
- Runtime phase logs and approval checkpoints are presented in a focused, centered modal.
