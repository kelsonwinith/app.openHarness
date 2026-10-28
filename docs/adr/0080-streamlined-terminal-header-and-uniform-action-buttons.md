# 80. Streamlined Terminal Header and Uniform Action Buttons

Date: 2026-10-22

## Status

Accepted

## Context

The terminal modal header had redundant textual labels ("Terminal", "Running (PID...)") that added visual noise to the title area. Additionally, the process interruption button (`Ctrl+C`) used an outlined style that differed visually from the companion `Clear` and `Restart` action buttons.

## Decision

In [`ProjectTerminalModal`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/terminal/project-terminal-modal.tsx):
1. **Removed Redundant Labels**:
   - Removed the `"Terminal"` text label next to the project title.
   - Removed the bulky `"Running (PID...)"` badge. Replaced with an unobtrusive pulsing green dot when background processes are active.
2. **Uniform Action Button Styling**:
   - Converted the `Interrupt` button to a clean `variant="ghost"` button styled identically to `Clear` and `Restart`:
     - Height: `h-7`, padding: `px-2`, text: `text-xs`.
     - Icon: `Square` stop icon matching `Trash2` and `RotateCcw`.
     - Uniform hover and focus styles.

## Consequences

### Positive
- Streamlined, minimalist top navigation bar focusing on the project name and quick actions.
- Consistent visual hierarchy across all terminal action controls.
