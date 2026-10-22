# Removal of Topbar and Docked Sidebar Settings with Theme Controls

To eliminate confusing breadcrumbs and visual noise, the top menu bar is removed across the console, maximizing vertical workspace and positioning settings at the bottom of the navigation rail.

### Design Principles

1. **Complete Removal of Topbar**:
   - The global top header bar and its multi-level breadcrumbs (`Relay > Page > Project`) have been completely removed from the layout.
   - All navigation occurs through the left 68px rail (`AppRail`) and dedicated context sidebars (`ProjectSidebar`, `WorkflowSidebar`), reclaiming 56px of vertical screen real estate.

2. **Docked Settings in App Rail**:
   - The Settings button is anchored to the bottom of the navigation rail using `mt-auto`.
   - Clicking Settings opens a concise dropdown menu with quick theme toggles:
     - **Light Mode** (Sun)
     - **Dark Mode** (Moon)
     - **System Default** (Monitor)
   - Includes a direct link to **All Console Settings...** (`/settings`) for harness configurations and data management.

**Consequences**

- Distraction-free, full-height workspaces for chatting, workflow composition, and run observation.
- Instant 1-click theme switching without navigating away from the active task.
