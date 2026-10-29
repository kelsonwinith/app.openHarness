# ADR 0109: Disable Node Hover Effects in Project Canvas

## Context
In the project execution canvas (`PlayableExecutionCanvas`), nodes are displayed in execution/playback mode. Previously, hovering over a node triggered border color highlighting (`hover:border-foreground/50`) and shadow elevation (`hover:shadow-sm`), which created unnecessary visual noise since nodes in project view are not editable.

## Decision
1. **Conditional Hover Classes**:
   - In [phase-node.tsx](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/flow/phase-node.tsx), restricted `hover:border-foreground/50 hover:shadow-sm` strictly to non-execution mode (`!isExecutionMode`).
2. **Project Canvas CSS Overrides**:
   - In [globals.css](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/globals.css), ensured that `.execution-canvas .react-flow__node` uses `cursor: default` and does not apply hover shadow or border mutations.

## Status
Accepted and verified through TypeScript compilation and Next.js production build.
