# Full-Screen Minimalist Project Chat and Sidebar Session Creation

To maximize focus when collaborating with agent harnesses inside a repository, the project view strips away redundant header chrome in favor of a full-screen conversational interface, and surfaces 1-click session creation directly in the sidebar tree.

### Design Principles

1. **Full-Screen Minimalist Chat Interface**:
   - `/projects/[id]` presents an unencumbered, full-viewport conversation interface between user and AI agent assistant.
   - Redundant top header banners, path cards, and tabs are removed; metadata like project name and current branch are gracefully integrated into the sidebar and subtle status indicators.
   - Message history fills the pane with clean typography, responsive message bubbles, and smooth auto-scrolling to the latest assistant responses.

2. **Unified Sidebar Action Group**:
   - Each project item in the navigation sidebar features both a direct `+` (New Session) button and a `...` (Options) dropdown menu.
   - Users can create a new development session with 1 click directly from the tree view without having to open menus or navigate between secondary tabs.
   - Hover and active states provide high visual discoverability while keeping sidebar density clean.

3. **Conversational Session & Workflow Launch**:
   - Submitting an objective in the full-screen chat analyzes intent, presents a proposed execution plan, and renders a 1-click **"Create Session & Launch Run"** button.
   - Launching creates a persistent Session entry in the project tree and connects directly to the run drawer.

**Consequences**

- Removes distraction and chrome clutter when entering a project.
- Faster session creation cycle with instant sidebar `+` access.
