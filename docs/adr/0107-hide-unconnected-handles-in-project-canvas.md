# ADR 0107: Hide Unconnected Handles on Project Execution Canvas

## Context
In the project execution canvas (`PlayableExecutionCanvas`), nodes displayed all 4 connection handles (Top, Right, Bottom, Left) even when no edge was attached to them. Because connecting new wires is not supported in project playback mode, unconnected dots contributed visual clutter.

## Decision
1. **Handle Visibility Conditioning**:
   - In [phase-node.tsx](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/flow/phase-node.tsx), handles now verify `isHandleConnected(handleId)`.
   - In workflow editor mode (`isExecutionMode: false`), all 4 handles remain visible to allow connecting wires.
   - In project execution mode (`isExecutionMode: true`), handles without an edge are hidden via `.handle-hidden` (`opacity: 0`, `pointer-events: none`, `visibility: hidden`), preserving React Flow's geometric calculations while hiding them visually.
2. **Connected Handles Map**:
   - In [playable-execution-canvas.tsx](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/flow/playable-execution-canvas.tsx), computed `connectedHandlesByNodeId` from `baseGraph.edges` and passed `connectedHandleIds` down to each node.
   - Normalized edge `sourceHandle` / `targetHandle` in [workflow-graph.ts](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/lib/domain/workflow-graph.ts) to guarantee consistent handle association.
3. **Execution Cursor & Static Handles**:
   - Added `.execution-canvas` CSS rules in [globals.css](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/globals.css) so connected handles in project view use default cursor and do not trigger interactive scaling on hover.

## Status
Accepted and verified through TypeScript compilation and Next.js production build.
