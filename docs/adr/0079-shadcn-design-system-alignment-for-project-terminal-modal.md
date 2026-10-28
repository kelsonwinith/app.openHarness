# 79. shadcn Design System Alignment for Project Terminal Modal

Date: 2026-10-22

## Status

Accepted

## Context

The initial embedded interactive terminal modal relied on custom raw HTML containers, hardcoded dark color hex codes (`#0c0e14`, `#090b10`), and non-standard spacing that diverged from openHarness's shadcn/ui design system (such as `Dialog`, `Badge`, `Separator`, and standard color tokens).

## Decision

We redesigned [`ProjectTerminalModal`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/terminal/project-terminal-modal.tsx) to align strictly with shadcn/ui patterns and CSS variables:
1. **Modal Frame & Backdrop**:
   - Replaced custom backdrop with shadcn standard `bg-black/60 backdrop-blur-[2px]`.
   - Replaced container styling with shadcn design tokens: `bg-card text-card-foreground border border-border shadow-2xl rounded-xl`.
2. **Standardized Header**:
   - Header uses `border-b border-border bg-muted/10 px-4 py-2.5` with clean typography (`font-semibold text-sm tracking-tight text-foreground`).
   - Replaced custom status and path chips with standard shadcn `Badge` (`variant="secondary"` / `variant="outline"`).
   - Replaced custom button styling with standard shadcn `Button` (`variant="outline"`, `variant="ghost"` with `text-xs` sizing) and added shadcn `Separator`.
3. **Cohesive Terminal Theme**:
   - Configured xterm to use shadcn dark mode zinc palette (`#09090b` zinc-950 canvas, `#f4f4f5` zinc-100 foreground, and standard ANSI syntax colors) with 12px monospace typography.
4. **Minimalist Footer**:
   - Clean status footer using `bg-muted/15 border-t border-border px-4 py-2` with consistent muted text and keyboard badge (`<kbd>`).

## Consequences

### Positive
- Perfect visual consistency with dialogs across openHarness (e.g. `AddSkillDialog`, `SkillDetailDialog`, `ProjectCreateDialog`).
- Respects system theme tokens (`border-border`, `bg-card`, `text-card-foreground`, `bg-muted`).
- Retains all real-time interactive terminal functionality (auto-detect dev server, persistent background PTY, quick interrupts).
