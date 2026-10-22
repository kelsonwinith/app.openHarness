# 74. Skills List Window Focus Auto-Revalidation and Manual Sync

Date: 2026-10-22

## Status

Accepted

## Context

Users frequently add, modify, or delete skills outside of the web application (e.g. directly in terminal via `npx skills add`, or switching between CLI windows and browser tabs). Previously:
1. `SkillsPage` only fetched the skill list on initial component mount if local store had no items or via specific dialog callbacks.
2. If the user installed skills in an external terminal or another session, the web UI would remain stale until a hard reload.
3. Users had no visual control or button to force-resynchronize the skill catalog with the physical filesystem.

## Decision

We introduced window focus auto-revalidation and a manual refresh control in [`client/app/skills/page.tsx`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/skills/page.tsx):
1. **Window Focus Auto-Revalidation**:
   - Added a `window.addEventListener('focus', ...)` listener in `useEffect`.
   - When the user switches back from an external terminal, editor, or browser tab, `loadSkills(false)` is automatically dispatched without disrupting ongoing interactions.
   - Leverages the < 5ms `/api/skills/list` filesystem scan, providing instant synchronization without UI lag.
2. **Dedicated Manual Refresh Button**:
   - Added a **`[Refresh]`** button with an animated spinning indicator (`RefreshCw`) in the page header next to **`[Add Skill]`**.
   - Displays real-time feedback during refresh execution (`isRefreshing` state).
3. **Atomic Reconcile (`syncSkills`)**:
   - Results from `/api/skills/list` are dispatched to `syncSkills` on the Zustand console store, which replaces the skill catalog with real-time on-disk items while preserving in-memory usage metrics and associations.

## Consequences

### Positive
- Automatic and zero-effort synchronization when returning to the tab from CLI operations.
- Explicit manual control with instant feedback via the Refresh button.
- Clean separation between initial page skeleton loading (`loading`) and background silent/manual revalidations (`isRefreshing`).

### Negative / Trade-offs
- Slight network traffic when switching tabs, though mitigated by local localhost latency (< 5ms) and no heavy database operations.
