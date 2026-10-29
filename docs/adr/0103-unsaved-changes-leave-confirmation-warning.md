# 0103. Unsaved Changes Leave Confirmation Warning

Date: 2026-10-28

## Status
Accepted

## Context
When modifying a workflow on the visual editor canvas (adding, dragging, deleting nodes, adding/removing skills, modifying gates, etc.), changes are drafted locally in editor state until the user saves. Previously, navigating away via in-app links (switching workflows in the sidebar, clicking app rail tabs) or closing the browser window could cause accidental loss of unsaved work.

## Decision
1. **Unsaved Changes Interception**:
   - In [workflow-editor-canvas.tsx](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/flow/workflow-editor-canvas.tsx), registered event interceptors active when `isDirty` is true:
     - Browser reload and tab closure via `beforeunload`.
     - In-app navigation via capture-phase click listener on anchor links and sidebar action buttons.
     - Browser back/forward navigation via `popstate`.
2. **Leave Confirmation Dialog**:
   - Provides a clear modal prompt displaying:
     - Warning icon and explanation that unsaved changes in the workflow will be discarded.
     - **Cancel**: Closes the dialog and keeps the user in the editor.
     - **Exit**: Discards unsaved changes and proceeds to the target destination.
     - **Save and exit**: Immediately synchronizes and saves the workflow graph, resets dirty state, and proceeds to the destination.

## Consequences
- Accidental loss of drafted workflow modifications is prevented across all navigation vectors.
