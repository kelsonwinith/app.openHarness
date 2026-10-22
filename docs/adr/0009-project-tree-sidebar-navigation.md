# Project and Session Tree Sidebar Navigation

To mirror the sequence workflow layout and provide consistent two-pane navigation across Relay, the `/projects` route hierarchy adopts a shared layout sidebar (`ProjectSidebar`).

### Sidebar Structure

- **Header**: Search filter input and a consolidated `+ Add` dropdown menu providing quick access to:
  - Create New Project
  - Open Directory via Native Finder / Explorer
  - Clone Git Repository
- **Collapsible Tree View**:
  - Each Project item displays its name, current branch badge, and session counter.
  - Expanding a project reveals its nested Sessions (`/projects/[id]/sessions/[sessionId]`) with branch and active status pills.
  - Project options menu (Reveal in Finder, Remove).
- **Persistent Two-Pane Layout**:
  - Navigating between `/projects` (All Projects grid), `/projects/[id]` (Project Detail), and `/projects/[id]/sessions/[sessionId]` (Session Workspace) preserves the sidebar without page reloads.

**Consequences**

- Users can browse, switch, and launch sessions across multiple projects in a single click without leaving their current view.
- Visual navigation consistency matches the `/workflows` side panel.
