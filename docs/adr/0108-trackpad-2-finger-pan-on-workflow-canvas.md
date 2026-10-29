# ADR 0108: Trackpad 2-Finger Pan Navigation on Workflow Canvas

## Context
On macOS trackpads, 2-finger scroll gestures on the workflow canvas defaulted to zooming in and out (`zoomOnScroll: true`), whereas users expect standard 2-finger dragging to pan/move around the canvas smoothly (similar to Figma, Miro, and native canvas tools).

## Decision
In [workflow-editor-canvas.tsx](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/flow/workflow-editor-canvas.tsx):
1. **Configured 2-Finger Pan**:
   - Enabled `panOnScroll={true}` and set `panOnScrollMode={PanOnScrollMode.Free}` to allow omnidirectional 2-finger panning across the canvas.
2. **Disabled Zoom on Scroll**:
   - Set `zoomOnScroll={false}` so trackpad scrolling moves the canvas instead of altering zoom levels.
3. **Preserved Pinch-to-Zoom**:
   - Maintained `zoomOnPinch={true}` so users can still pinch to zoom in/out with trackpad gestures or use the zoom controls.

## Status
Accepted and verified through TypeScript compilation and Next.js production build.
