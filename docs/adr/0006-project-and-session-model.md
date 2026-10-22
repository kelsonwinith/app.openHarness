# Project and Session Hierarchy with Host Git Integration

To ground workflow execution in real codebases, the console introduces a two-tier hierarchy above Workflows and Runs: **Project** and **Session**.

1. **Project**: A codebase repository on the host filesystem, either created as a new folder, opened from an existing local directory, or cloned from a remote Git URL via Next.js backend API routes.
2. **Session**: A targeted working objective within a Project (e.g., 'Refactor Auth', 'Bugfix #123') that tracks an active Git branch, notes/context, selected Harness, and an ordered history of Workflow Runs executed against that codebase.

Navigation is updated with a top-level `Projects` section on the left rail (`/projects`), project detail and session management views (`/projects/[id]`), and a global Project Switcher in the topbar.

**Consequences**

- Agent harness runs are contextualized to an absolute codebase directory path on the machine.
- Multiple concurrent or historical development streams within the same repository can be isolated into distinct Sessions without losing workflow execution history.
- Real Git operations (`git init`, `git clone`, branch detection) are executed via backend API routes on the local machine rather than simulated in mock storage.
