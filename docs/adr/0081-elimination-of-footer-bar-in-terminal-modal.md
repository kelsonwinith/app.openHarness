# 81. Elimination of Footer Bar in Terminal Modal

Date: 2026-10-22

## Status

Accepted

## Context

Following the pattern established for `SkillDetailDialog` (ADR 0071) and `AddSkillDialog` (ADR 0076), dialog and modal content should prioritize maximum vertical canvas space without unnecessary static helper text taking up room at the bottom.

## Decision

In [`ProjectTerminalModal`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/terminal/project-terminal-modal.tsx):
- Completely removed the bottom footer bar.
- The terminal emulator canvas now spans 100% of the remaining height down to the bottom border of the modal.

## Consequences

### Positive
- Increased vertical terminal lines and viewport visibility.
- Minimalist, distraction-free IDE terminal appearance.
