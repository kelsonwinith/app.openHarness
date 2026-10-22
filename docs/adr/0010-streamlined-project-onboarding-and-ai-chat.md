# Streamlined Project Onboarding and Interactive AI Session Starter

To align `/projects` with `/workflows` and eliminate unnecessary modal steps, the console streamlines project onboarding and introduces an interactive AI session starter.

### Design Principles

1. **Parity with Workflows**:
   - `/projects` automatically redirects to the active or first project if projects exist.
   - If no projects exist, it presents an empty state ("No Projects Yet...") without unnecessary page headers.
2. **Direct Native Finder Invocation**:
   - Clicking "Open Directory" immediately summons the native macOS Finder or Windows Explorer folder chooser (`/api/projects/picker`), bypassing manual path input forms.
   - The sidebar displays all 3 onboarding actions (Open Directory, New Project, Clone Git Repo) when empty.
3. **Default AI Chat Interface**:
   - Opening a project with no active session displays an interactive conversation between the user and AI assistant.
   - Users can describe their objective in natural language; the console automatically creates a named Session, generates a step plan, and provides a 1-click action to launch the corresponding workflow.

**Consequences**

- Zero friction when importing local repositories into Relay.
- Developers can immediately start work in a project conversationally without first configuring sessions manually.
