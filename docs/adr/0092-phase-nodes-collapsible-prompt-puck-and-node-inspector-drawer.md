# 92. Phase Nodes, Collapsible Prompt Puck, and Node Inspector Drawer

Date: 2026-10-28

## Status

Accepted

## Context

Following the decision in [ADR 0091](docs/adr/0091-visual-node-based-decision-graphs-with-multi-input-dispatch-and-playable-canvas.md) to migrate OpenHarness to a visual node-based decision canvas powered by React Flow, key UX and interaction patterns were clarified during the `/grill-with-docs` session:

1. **Prompt Dispatch Mechanics**: Rather than showing preview text on the draggable capsule, the developer needs a clean, distraction-free toggle:
   - When collapsed, it condenses into a minimal draggable puck.
   - Clicking the puck instantly expands it back into the full center chat composer to inspect or edit prompt context before dispatching.
   - Dragging the puck onto an Input Node dispatches execution.
2. **Node Granularity**: Atomic skill nodes (one node per skill) quickly clutter graphs with unmanageable wire spaghetti. Workflows are organized into **Phase Nodes**, each hosting an ordered stack of skills and harness assignment.
3. **Execution Observability**: In-canvas expanded logs overwhelm the visual state graph. The canvas remains clean, delegating deep inspection to a contextual **Node Inspector Drawer**.
4. **Scope Phasing**: Complex multi-port conditional branching rules and automated git rollback are deferred to follow-on iterations. The immediate focus is solidifying multi-input topology, phase stacks, the prompt puck drag-and-drop lifecycle, and the node inspector.

## Decision

1. **Collapsible Prompt Puck**:
   - Positioned floating at the bottom-center of the Playable Execution Canvas.
   - States:
     - **Expanded**: Full-featured prompt composer with auto-growing textarea and collapse toggle (`ChevronDown` / `Minimize2`).
     - **Collapsed**: Sleek, tactile draggable puck with a drag handle and subtle glowing accent.
     - **Click to Expand**: Clicking the collapsed puck restores the composer for seamless prompt refinement.
   - **Drag-and-Drop Interaction**:
     - Dragging the puck activates drop-zone indicators on all canvas **Input Nodes**.
     - Dropping onto an Input Node consumes the prompt payload, transitions the node into active execution state, and starts the traversal along connected downstream Phase Nodes.
     - Dropping outside an input node smoothly snaps the puck back to its resting position.

2. **Phase Node Architecture**:
   - Built as custom React Flow node components (`PhaseNode`).
   - Visual Structure:
     - Phase Header: Name, optional gate toggle badge, assigned Harness tag (e.g. `OpenCode`, `Antigravity`).
     - Skill Stack: Ordered list of bound skills displayed as clean, compact chips.
     - Handles: Standard target (input) handle on the left/top, source (output) handle on the right/bottom.
   - **Input Node Component (`InputNode`)**:
     - Distinct styling (distinct accent border, entry icon).
     - Accepts drops from the Collapsible Prompt Puck.
     - Single output handle connecting to subsequent Phase Nodes.

3. **Node Inspector Drawer**:
   - Slide-out drawer sliding in from the right edge of the canvas upon clicking any Phase Node.
   - Tabs / Panels:
     - **Live Activity**: Tool calls, file reads/edits, and harness logs.
     - **Diffs**: Visual Git file diffs generated during that phase.
     - **Terminal Output**: Raw PTY output associated with the harness execution.
     - **Phase Checkpoint**: Approval actions if paused at a gate.

4. **Workflow Editor Draft Lifecycle**:
   - Top-right action bar in the editor provides explicit **Save Changes** and **Cancel Changes** buttons.
   - Canvas modifications are held in component draft state until the user clicks Save.
   - Clicking Cancel reverts the React Flow nodes and edges back to the stored version.

## Consequences

### Positive
- Exceptional spatial UX: tactile drag-to-dispatch creates clear intentionality.
- Minimalist and uncluttered: collapsible puck and slide-out inspector keep the canvas spacious and readable.
- Cohesive phase management: grouping skills within Phase Nodes matches developer mental models while keeping wiring clean.
- Resilient draft safety: explicit Save/Cancel prevents unintended workflow mutations.
