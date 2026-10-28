# 83. Landing Page Redirect to Projects and Global Initial Skills Synchronization

Date: 2026-10-22

## Status

Accepted

## Context

1. **Root Landing Page**:
   The root route (`/`) previously redirected directly to `/workflows`, rather than `/projects` which is the central workspace entry point for active developer sessions and chat.
2. **Delayed Skill Catalog Loading**:
   Skills were previously only fetched from disk when the user explicitly navigated to the `/skills` page. If the user loaded `/workflows` or navigated directly to `/workflows/[id]` on initial boot, the store's skill catalog remained unpopulated until they visited the `/skills` page and returned.

## Decision

1. **Landing Page Route**:
   In [`client/app/page.tsx`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/page.tsx), updated root redirection from `/workflows` to `/projects`.
2. **App-Wide Skills Synchronization at Initialization**:
   - In [`client/lib/stores/console-store.ts`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/lib/stores/console-store.ts), updated `initialize()` to immediately fetch physical skills from `/api/skills/list` (< 5ms filesystem scan) and call `syncSkills`.
   - In [`client/components/providers.tsx`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/providers.tsx), added window focus auto-revalidation globally across the app.
   - In [`client/app/workflows/[id]/page.tsx`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/workflows/[id]/page.tsx), added a guard `useEffect` so deep-linking directly into a workflow immediately resolves skills even if accessed without visiting any other page.

## Consequences

### Positive
- Direct access to Projects upon opening the application.
- Skills are populated immediately from host storage at boot time; workflow templates resolve skills instantly on first load.
