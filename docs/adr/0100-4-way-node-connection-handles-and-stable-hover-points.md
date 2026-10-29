# 0100. 4-Way Node Connection Handles and Stable Hover Points

Date: 2026-10-28

## Status
Accepted

## Context
Phase nodes previously featured only two handles: Top (`target`) and Bottom (`source`). The handles included a CSS `hover:!scale-125 transition-transform` rule which altered the handle's bounding geometry on mouseover, causing connecting points to jitter and shift. Furthermore, users could not route edges from or to arbitrary sides (left, right, top, bottom).

## Decision
1. **4-Way Connection Handles**:
   - Added handles to all four sides of [phase-node.tsx](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/flow/phase-node.tsx): Top (`Position.Top`, `id="top"`), Right (`Position.Right`, `id="right"`), Bottom (`Position.Bottom`, `id="bottom"`), and Left (`Position.Left`, `id="left"`).
   - Enabled `ConnectionMode.Loose` across [workflow-editor-canvas.tsx](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/flow/workflow-editor-canvas.tsx) and [playable-execution-canvas.tsx](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/flow/playable-execution-canvas.tsx) so connections can originate from or terminate at any of the 4 handles.
   - Updated `CanvasEdge` in [types.ts](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/lib/domain/types.ts) with `sourceHandle` and `targetHandle` attributes.

2. **Eliminated Hover Jitter / Shifting**:
   - Removed `hover:!scale-125` and `transition-transform` from handles, setting fixed `!w-3 !h-3` dimensions with smooth color transitions (`hover:!bg-primary`) to guarantee that connection origins remain completely static during hover.
   - Replaced `transition-all duration-200` on the node card with targeted `transition-[border-color,box-shadow,background-color] duration-150` and removed `scale-102` so that hovering the node card does not trigger layout or coordinate shifts for the handles.

## Consequences
- Edges can now be connected to and from any of the 4 sides (Top, Bottom, Left, Right).
- Handles remain rock-solid in place without shifting, jumping, or jittering on hover.
