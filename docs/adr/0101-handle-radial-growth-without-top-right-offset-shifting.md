# 0101. Handle Radial Growth Without Top-Right Offset Shifting

Date: 2026-10-28

## Status
Accepted

## Context
When hovering over connection handles in the flow canvas, handles previously jumped/shifted toward the top right. Investigation revealed that [globals.css](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/globals.css) contained a legacy rule `.react-flow__handle:hover { transform: scale(1.35) !important; }`. This rule completely overrode React Flow's native positioning `transform: translate(-50%, -50%)`, discarding the 50% centering offset and snapping the handle origin to the top right.

## Decision
1. **Dimension-Based Hover Expansion**:
   - Removed `transform: scale(1.35)` from [globals.css](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/globals.css).
   - Styled handles to smoothly expand from `width: 10px; height: 10px;` to `width: 16px; height: 16px;` on `:hover` and `.connectingfrom`.
   - By preserving React Flow's native `transform: translate(-50%, -50%)` (and equivalent offsets on all 4 sides), the handle automatically recomputes its 50% offset from its new width/height, maintaining its exact center point anchored to the node border while growing outward symmetrically.

## Consequences
- Hovering over any connection handle smoothly enlarges the point from 10px to 16px without shifting toward the top right or any other direction.
