# 94. Complete Elimination of Default Chat View in Favor of Playable Canvas

Date: 2026-10-28

## Status

Accepted

## Context

During the transition to the node-based visual workflow architecture ([ADR 0091](0091-visual-node-based-decision-graphs-with-multi-input-dispatch-and-playable-canvas.md) & [ADR 0092](0092-phase-nodes-collapsible-prompt-puck-and-node-inspector-drawer.md)), a temporary view switcher allowed developers to toggle between the new Playable Execution Canvas and the legacy chat transcript view.

The user specified:
> "completly remove the default chat view"

Retaining the legacy chat view fragmented the product experience and maintained two parallel execution UX paradigms. OpenHarness is uniquely anchored around the visual state graph as its primary interface.

## Decision

1. **Eliminate View Switcher**:
   - In [`client/app/projects/[id]/page.tsx`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/projects/[id]/page.tsx) and [`client/app/projects/[id]/sessions/[sessionId]/page.tsx`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/projects/[id]/sessions/[sessionId]/page.tsx):
     - Removed `viewMode`, toggle buttons, and all references to `ProjectAIChat`.
     - Projects and Sessions now render strictly and exclusively via [`PlayableExecutionCanvas`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/flow/playable-execution-canvas.tsx).

2. **Clean Canvas Header**:
   - Removed the `Chat View` button and `MessageSquare` icons from [`playable-execution-canvas.tsx`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/flow/playable-execution-canvas.tsx).
   - Removed `onSwitchToChat` props from domain interfaces.

3. **Single Source of Execution**:
   - Prompts are composed in the **Collapsible Prompt Puck** and dispatched onto canvas **Input Nodes**.
   - Execution traces, logs, and checkpoints are inspected via the **Node Inspector Drawer**.

## Consequences

### Positive
- Consistent, unified product identity: OpenHarness is a visual decision graph harness, not a generic chat window.
- Reduced code complexity and eliminated dual-mode maintenance overhead.
- Streamlined project onboarding and navigation.
