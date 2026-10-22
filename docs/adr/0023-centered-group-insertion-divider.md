# 23. Centered Group Insertion Divider

Date: 2026-10-22

## Status

Accepted

## Context

When hovering between consecutive workflow group cards, the insertion divider was previously affected by parent `space-y` margins, causing uneven vertical alignment and visual asymmetry. Additionally, the insert button needed to be strictly centered both horizontally and vertically across the canvas width.

## Decision

1. **Absolute Horizontal & Vertical Centering**:
   - Updated `AddGroupDivider` in [`client/app/workflows/[id]/page.tsx`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/workflows/[id]/page.tsx) with absolute centering: `absolute left-1/2 -translate-x-1/2`.
   - The pill button is positioned at the mathematical center of the guide line regardless of viewport width or sidebar state.
2. **Predictable Flexbox Spacing**:
   - Replaced `space-y-4` with `flex flex-col gap-3`, ensuring uniform vertical gap distribution.
   - Configured `h-7 -my-1` on the divider to balance the surrounding gap symmetrically between adjacent cards.
3. **Smooth Interactive State**:
   - On hover, the guideline transitions to `border-primary/50` while the centered pill scales up with smooth opacity fade-in (`scale-95 group-hover:scale-100 opacity-0 group-hover:opacity-100`).

## Consequences

- Group insertion UI is visually balanced, pixel-centered, and easy to trigger.
- Preserves the clean minimal design language of the workflow editor canvas.
