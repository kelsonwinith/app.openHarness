# 0102. Enhanced Border Contrast for Node Cards and Handles

Date: 2026-10-28

## Status
Accepted

## Context
Node cards on the workflow and playable execution canvas were previously styled with low-contrast borders (`border-border`), making them visually blend into the canvas background, particularly in dark mode. Furthermore, connection handles lacked defined border rings, diminishing their visibility against the cards and background dots.

## Decision
1. **Node Card Border Contrast**:
   - Updated [phase-node.tsx](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/flow/phase-node.tsx) card container to use `border border-border/80 dark:border-zinc-700/90 light:border-zinc-300`, delivering crisp card outlines in both themes.
   - Enhanced hover and status border states: `hover:border-foreground/50` and `border-emerald-500/80` for completed or input nodes.
2. **Handle Outer Ring & Contrast**:
   - In [globals.css](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/globals.css), gave `.react-flow__handle` an outer ring shadow (`box-shadow: 0 0 0 1px hsl(var(--border)), 0 1px 2px 0 rgb(0 0 0 / 0.2)`), distinct card border (`2px solid hsl(var(--card))`), and higher opacity resting background (`hsl(var(--muted-foreground) / 0.8)`).
3. **Global Border Contrast Tuning**:
   - Increased `--border` and `--input` contrast in [globals.css](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/globals.css) from 15.9% to 22% in `.dark` and from 90% to 82% in light mode.

## Consequences
- Node boundaries are distinct and easily identifiable on the canvas.
- Connection handles stand out with clear, sharp contrast against both the card and canvas.
