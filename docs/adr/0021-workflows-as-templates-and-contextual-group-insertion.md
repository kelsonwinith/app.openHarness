# 21. Workflows as Templates and Contextual Group Insertion

Date: 2026-10-22

## Status

Accepted

## Context

Two fundamental domain and UX clarifications were made regarding workflows:
1. **Workflows are Templates**: Workflows are reusable sequence templates composed of step groups and skills, not executable instances triggered directly from the workflow designer. Execution occurs inside Projects and Sessions on an agent harness. Retaining "Launch Run" on the workflow editor was conceptually mismatched and added unnecessary UI weight.
2. **Contextual Group Insertion**: Adding a new group was previously a static top-button action that always appended to the end. Users needed the ability to insert a group between existing groups via hover cues (`+ Add Group` divider), as well as quickly append at the bottom via an explicit add-block.
3. **Sequence Steps Header Removal**: The remaining section banner ("Sequence Steps" heading, description, top action buttons) was eliminated to achieve a pure, minimal group canvas.

## Decision

1. **Pure Canvas Workflow Template Editor**:
   - Removed the Sequence Steps header bar and "Launch Run" button from [`client/app/workflows/[id]/page.tsx`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/workflows/[id]/page.tsx).
   - The view now opens directly into the step groups.
2. **Contextual Hover Insertion (`AddGroupDivider`)**:
   - Introduced an interactive hover divider between consecutive groups.
   - Hovering reveals a subtle dashed boundary and a centered `+ Add Group` pill button that inserts a new group at that exact index (`addGroup(workflow.id, undefined, index)`).
3. **Bottom Add-Group Block**:
   - Appended a dashed `+ Add Group` card after the last group to allow instant tail insertion.
4. **Domain Model & Glossary Alignment**:
   - Updated [`GLOSSARY.md`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/GLOSSARY.md) defining Workflows as reusable skill templates executed in Projects/Sessions.
   - Enhanced `console-store.ts`'s `addGroup` method with optional `index` positioning support using array splicing.

## Consequences

- The workflow editor is ultra-minimal, distraction-free, and dedicated solely to template modeling.
- Inserting and appending groups is natural, contextual, and requires fewer clicks.
- Domain semantics cleanly separate workflow templates from project harness execution.
