# Session and Chat Unification (Chat-Driven Session Lifecycle)

To eliminate unnecessary mental models and configuration barriers, "Session" and "Chat" are unified into a single concept.

### Design Principles

1. **Session Is the Chat Thread**:
   - There is no distinction between a Session and a Chat thread. Every session within a project stores its own conversation history (`messages: ChatMessage[]`), along with git branch metadata and triggered workflow runs.
   - Navigating to `/projects/[id]/sessions/[sessionId]` displays the full-screen interactive conversation for that session.

2. **Automatic Session Creation on First Chat Message**:
   - When viewing a project without an active session (`/projects/[id]`), the developer is presented with a clean, minimal chat interface ready for input.
   - Sending the first message automatically creates a new `Session` titled after the user's objective, records the message pair (user prompt and assistant recommendation), and transitions immediately to `/projects/[id]/sessions/[newSessionId]`.
   - The new session instantly appears in the sidebar project tree as an active item.

3. **Streamlined Sidebar Navigation**:
   - The `+` icon on any project item in the sidebar resets the active session and navigates directly to `/projects/[id]` to start a fresh chat thread.
   - Each session listed under a project in the sidebar represents a chat thread; clicking it reopens that discussion and its associated run triggers.

**Consequences**

- Zero upfront modal configuration required to start work on a repository.
- Complete parity with modern AI interfaces (ChatGPT, Cursor, Claude).
- Clean state transitions between new chat drafts and persisted session threads.
