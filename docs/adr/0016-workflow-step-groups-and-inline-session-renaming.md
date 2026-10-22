# 16. Workflow Step Groups and Inline Session Renaming

Date: 2026-10-22

## Status

Accepted

## Context

Two key workflow and UX refinements were required:
1. **Hierarchical Workflow Composition**: Complex workflows require organizing skills into sequential stages or sections (groups) such as "Discovery", "Build", and "QA". Previously, a workflow was a single flat list of steps. Users needed the ability to create step groups within a workflow, name them, reorder groups, and place multiple skills inside each group.
2. **Inline Session Renaming**: Navigating to a separate edit modal or view to rename a session was cumbersome. Sessions in the project sidebar tree needed inline double-click editing with immediate persistence on `Enter` or `blur`, with cancellation on `Escape`, while coexisting peacefully with drag-and-drop (`@dnd-kit`).

## Decision

1. **StepGroup Domain Model & Automatic Flattening**:
   - Extended `Workflow` with optional `groups?: StepGroup[]`, where each `StepGroup` has `{ id: string, name: string, description?: string, steps: Step[] }`.
   - Maintained `wf.steps` as a synchronized flat derivation of `groups.flatMap(g => g.steps)`. This ensures complete backward compatibility with harness execution engines, run snapshots, and CLI runners without breaking downstream consumers.
   - Implemented group management store actions: `addGroup`, `renameGroup`, `deleteGroup`, `reorderGroups`, `addSkillToGroup`, `reorderGroupSteps`, and `deleteGroupStep`.
2. **Sequence Steps UI**:
   - Replaced the flat step list in `workflows/[id]/page.tsx` with a sortable list of `SortableGroupCard` components.
   - Each group card features an inline editable title, step counter badge, `+ Add Skill` button, delete group button with confirmation, and nested sortable skill cards.
3. **Sidebar Session Inline Renaming**:
   - In `SortableSessionItem`, double-clicking the session name toggles an inline text input.
   - Disabled `@dnd-kit` dragging during editing (`disabled: isEditing`) and isolated key/mouse events (`e.stopPropagation()`) to prevent drag sensor interference.
   - Auto-focused input saves on `Enter` / `onBlur`, cancels on `Escape`.

## Consequences

- Workflows support multi-skill section grouping with full drag-and-drop reordering of both groups and skills within groups.
- Direct inline double-click session renaming feels native and responsive.
- Existing runners and simulation engines continue executing sequential runs seamlessly via the derived flat `steps` array.
