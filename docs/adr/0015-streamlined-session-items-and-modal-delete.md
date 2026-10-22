# Streamlined Session Items and Modal Delete Confirmation

To eliminate unnecessary visual clutter and simplify session management, session items display only the session name, and the three-dot options menu is replaced with a direct delete button with modal confirmation.

### Design Principles

1. **Name-Only Session Row**:
   - In [`ProjectSidebar`](client/components/layout/project-sidebar.tsx), session items under a project display only the chat thread icon and the session name.
   - Removed secondary metadata such as branch tags and extra chrome, ensuring clear, distraction-free scanning of conversations.

2. **Direct Delete with Confirmation Modal**:
   - Replaced the three-dot (`...`) dropdown menu and "Edit Session" action with a direct `Trash2` delete button on each session row.
   - Clicking the delete button opens a confirmation modal (`confirm` dialog) with explicit destructive action styling.
   - Deleting the currently active session cleanly navigates back to `/projects/[id]` ready for a new chat.

**Consequences**

- Streamlined sidebar tree with cleaner visual hierarchy.
- Direct 1-click access to delete with safety guardrail confirmation modal.
