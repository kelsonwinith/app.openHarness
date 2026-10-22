# DnD Kit Reordering and Removal of Mockup Skills

To provide smooth, accessible drag-and-drop reordering across all console lists and eliminate prototype placeholder data, `@dnd-kit` is integrated and mockup skills are removed.

### Design Principles

1. **Removal of Mockup Skills**:
   - `DEFAULT_SKILLS` is set to an empty collection (`[]`), ensuring the skill library only contains real user-authored skills.
   - Storage hydration cleanses any legacy mock skill IDs (`project-discovery`, `requirement-discovery`, etc.) to prevent prototype placeholders from reappearing.
   - Initial sample generation starts clean without phantom skills.

2. **Universal Drag-and-Drop with `@dnd-kit`**:
   - Replaced native HTML5 drag events with `@dnd-kit/core` and `@dnd-kit/sortable` using pointer and accessible keyboard sensors.
   - Integrated `SortableContext` across five key console lists:
     - **Workflow Steps**: Reordering skill execution sequence in `WorkflowDetailPage`.
     - **Workflows List**: Reordering workflows in `WorkflowSidebar`.
     - **Projects List**: Reordering projects in `ProjectSidebar`.
     - **Project Sessions**: Reordering chat threads within a project in `ProjectSidebar`.
     - **Skills Library**: Reordering skill cards in `SkillsPage`.
   - Dedicated drag handles (`GripVertical`) with `touch-none` and pointer distance constraints (`distance: 5`) prevent accidental drags during text selection or clicks.

3. **Store Actions for Immutability**:
   - Added `reorderProjects`, `reorderSessions`, `reorderWorkflows`, `reorderSteps`, and `reorderSkills` utilizing `arrayMove` from `@dnd-kit/sortable` for clean, immutable array updates and immediate local persistence.

**Consequences**

- Clean, production-ready skill catalog without mockup noise.
- Smooth, touch-friendly, and accessible reordering across all project, session, workflow, step, and skill lists.
