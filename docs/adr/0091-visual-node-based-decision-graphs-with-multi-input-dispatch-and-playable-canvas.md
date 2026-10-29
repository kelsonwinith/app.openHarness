# 91. Visual Node-Based Decision Graphs with Multi-Input Dispatch and Playable Execution Canvas

Date: 2026-10-28

## Status

Accepted (In-Design Grill)

## Context

Previously, OpenHarness organized workflows as linear, vertical lists of step groups. While functional for simple pipelines, this model introduced several limitations:
1. **Linearity vs Decision Branching**: Real-world workflows require dynamic decision pathways (e.g., "Add Feature" requires grilling and documentation first, while "Fix Bug" requires diagnostic reproduction, and "Mock" requires exploratory spikes with fast rollback).
2. **Chat-Centric Rigidity**: Developers were forced into a generic linear chat stream where workflows were merely tagged badges above an input box.
3. **Single Entry Point**: All prompts entered through a single unspecialized input, lacking the ability to visually direct tasks into specialized entry nodes.
4. **Draft vs Live State Confusion**: Changes made in the workflow editor were immediately mutated into live storage without an explicit Draft / Save / Cancel confirmation lifecycle.

The user specified:
> "i want the workflow more designable like drawing a state of workflow decisions instead of top to down like this (implement reactflow in node or group i can add skill)"
> "in workflow i can edit then confirm (save), cancel change the workflow"
> "in chat instead of general chat i want the reactflow here (flow cant be edit) make it little playable like"
> "chatbar at center after i type everything i want, then it collapse then i drag and drop into input"
> "workflow from now on can have many input... like add, fix... each node of them might have different skill set before going further with different path"

## Decision

1. **Visual Workflow Canvas powered by React Flow**:
   - Replace the linear vertical list in the workflow editor with a 2D node-based decision canvas (`@xyflow/react` / `reactflow`).
   - Workflows are defined as directed graphs composed of:
     - **Input Nodes**: Multiple named entry gates (e.g., `Add Feature`, `Fix Bug`, `Mock Spike`).
     - **Skill Nodes / Groups**: Nodes encapsulating one or more atomic skills, instructions, and target harness assignments.
     - **Gate / Decision Nodes**: Evaluation checkpoints supporting multi-choice outcomes (e.g., `Approve & Next`, `Rework & Loop Back`, `Reject & Rollback`).
     - **Directional Edges**: Connections defining sequential flow, conditional branches, or backward iteration loops.

2. **Explicit Draft / Save / Cancel Workflow Editor Lifecycle**:
   - Entering workflow edit mode clones the active graph into a local canvas draft state.
   - The editor header displays distinct **Save Changes** (commit to store) and **Cancel Changes** (discard edits, revert canvas to saved state) actions.
   - Unsaved dirty states prevent accidental navigation or overwrites.

3. **Playable Execution Canvas in Project Sessions**:
   - The primary session view transitions from a traditional scrolling chat window to an interactive **Playable Execution Canvas**.
   - The workflow graph is rendered in an immutable layout (structure locked), serving as a live visual state machine.
   - Active execution illuminates nodes with pulsing indicators, streams logs directly inside or docked adjacent to the active node, and visualizes token progress along edges.

4. **Floating Draggable Prompt Capsule**:
   - A prompt composer is positioned prominently in the session canvas.
   - Once the developer finishes composing their prompt, the bar collapses into a compact, draggable **Prompt Capsule**.
   - The developer drags and drops the capsule directly onto their chosen **Input Node** (e.g., dropping onto `Add Feature` vs `Fix Bug`).
   - Dropping the capsule triggers execution starting from that specific entry node and propagating along its defined branch.

5. **Multi-Input Topologies**:
   - A single workflow template can house multiple independent entry branches.
   - Shared downstream phases (e.g., a common `Verification` or `Documentation` node) can receive incoming edges from multiple upstream branches.

## Consequences

### Positive
- Unlocks sophisticated agent architectures: conditional branches, feedback loops, and speculative mocks.
- Intuitive spatial comprehension: developers see exactly what path their prompt will take before initiating execution.
- Tactile, playful dispatch: dragging the prompt capsule into specialized input nodes makes workflow invocation deliberate and tactile.
- Safe workflow authoring: the Save/Cancel draft boundary prevents accidental corruption of complex workflow graphs.
