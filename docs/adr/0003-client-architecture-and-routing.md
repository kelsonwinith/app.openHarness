# Next.js App Router with Global Layout Drawer and Zustand State

The Next.js client console refactor structures top-level navigation into discrete App Router pages (`/workflows`, `/workflows/[id]`, `/runs`, `/skills`, `/settings`), while hoisting the active Run Drawer and simulation tickers into a root client layout.

State management is partitioned into decoupled Zustand stores (WorkflowStore, SkillStore, RunStore, UIStore) rather than a monolithic global object.

**Consequences**

- Deep linking and browser navigation work natively without losing live execution or drawer state.
- Component re-renders are isolated to the specific slices of state they consume (e.g. 1-second simulation ticks do not trigger re-renders in the workflow editor).
- The Run Drawer can be opened, closed, or expanded from any route without interrupting an ongoing live run.
