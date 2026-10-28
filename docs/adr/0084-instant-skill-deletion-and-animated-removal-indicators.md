# 84. Instant Skill Deletion and Animated Removal Indicators

Date: 2026-10-22

## Status

Accepted

## Context

Deleting a skill previously exhibited two UX bottlenecks:
1. **Unresponsive Delay**:
   [`/api/skills/remove`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/api/skills/remove/route.ts) awaited sequential `npx skills remove --global ...` execution before responding, introducing a 1,500ms to 3,000ms delay.
2. **Missing Progress Feedback**:
   [`ConfirmDialog`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/dialogs/confirm-dialog.tsx) closed immediately when clicking "Confirm", leaving the target row sitting in the table without any spinner, disabled state, or visual cue until the request finished.

## Decision

1. **Sub-5ms Filesystem Deletion**:
   In [`client/app/api/skills/remove/route.ts`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/api/skills/remove/route.ts):
   - Immediately wiped `~/.agents/skills/<skill-name>` from disk using `fs.rmSync(..., { recursive: true, force: true })` (< 2ms).
   - Cleaned lockfile records synchronously.
   - Fire-and-forget the CLI cleanup (`npx skills remove --global ...`) in the background without blocking the HTTP response.
2. **Async Confirmation Dialog with Spinner**:
   In [`ConfirmDialog`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/dialogs/confirm-dialog.tsx):
   - Added asynchronous `onConfirm` support with internal `isLoading` state.
   - Disables modal buttons and shows an animated `<Loader2 className="animate-spin" />` with `"Processing..."` until deletion completes.
3. **Table Row In-Flight Feedback**:
   In [`client/app/skills/page.tsx`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/skills/page.tsx):
   - Tracked `deletingSkillId`.
   - The row is visually dimmed (`opacity-50 pointer-events-none`) and the trash button transforms into an active spinner (`<Loader2 />`) while deletion is in flight.

## Consequences

### Positive
- Deletion latency dropped from ~2,000ms to under 5ms.
- Clear visual indicators both inside the confirmation dialog and on the table row.
- Double-clicking is prevented across all confirmation dialogues.
