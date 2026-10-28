# Relay — Agent Harness Console

The vocabulary for a console that composes agent workflows and observes their execution on a CLI harness.

## Language

**Project**:
A local codebase directory or Git repository where agent harness workflows execute. Can be newly scaffolded, opened from disk, or cloned from a remote Git URL. Its name is strictly immutable and derived directly from the root folder basename on disk (`path.basename(project.path)`). Renaming projects within the console is prohibited to prevent discrepancy with the filesystem.
_Avoid_: Workspace, repo (when meant as the console entity), project renaming

**Session**:
A conversation thread and working context within a Project (e.g. "Refactor Auth", "Issue #42") that stores the chat history between the developer and AI agent, tracks git branch state, and records triggered workflow runs. Starting a chat without an active session automatically creates a new session.
_Avoid_: Task, separate conversation window

**Harness**:
The CLI agent runtime that executes workflows and interactive sessions. OpenCode is the native production CLI agent harness, executing real developer tasks and skills in project repositories.
_Avoid_: Agent, runner, provider, simulated mockup

**Skill**:
A reusable, named instruction block that tells an agent how to perform one unit of work. Skills are pure, atomic instructions identified solely by name, without category, group, type, arbitrary icons, or manual descriptions — a skill is simply a skill.
_Avoid_: Task, prompt, tool, categorized skill, skill type, skill icon, skill description

**Workflow**:
A reusable template composed of step groups and ordered skill references that defines an agent execution playbook. Workflows serve as reusable templates designed in the workflow editor and are executed inside Projects and Sessions on an agent harness, rather than launched standalone from the template editor.
_Avoid_: Pipeline, flow, playbook, runnable job (when referring to the template)

**Flow**:
The active workflow mode selected in project chat. When set to `None (Direct Chat)`, developer inputs are sent directly to the agent harness; when set to a specific workflow, input triggers execution across all tagged skills sequentially.
_Avoid_: Ad-hoc execution mode, prompt runner

**Step**:
A skill bound into a workflow at a specific position within a Step Group, with an optional instruction override. If its underlying skill is uninstalled from the host machine, the step is preserved as a missing step with danger styling, providing 1-click direct inline reinstallation (without modal popups) and step deletion actions.
_Avoid_: Skill (when the bound instance is meant), stage, silent step pruning, modal reinstallation fallbacks, individual skill approval gates

**Step Group**:
A named logical section or phase within a workflow (e.g. "Requirements", "Implements", "QA") containing one or more ordered steps and an optional flow-level approval gate setting. When its gate is enabled, execution runs all skills in the group, executes the prompt instructions, and pauses at an approval gate checkpoint before proceeding to the subsequent group or completing the flow.
_Avoid_: Section, folder, sub-workflow

**Skill library**:
The global catalog of agent skills installed in `~/.agents/skills/` on the user's host machine that workflows reference by ID.
_Avoid_: Registry, marketplace, project-local skill directory

**Gate**:
A checkpoint at the flow/group level where execution pauses after a group completes its skills and prompt instructions until a developer approves or rejects continuing. Embedded directly in the chat stream as an interactive approval card with one-click continue or stop actions. Approval gates operate at the flow/group boundary rather than on individual skills.
_Avoid_: Skill-level gate, individual skill checkpoint, pause modal dialog

**Harness adapter**:
The boundary abstraction decoupling the console interface and state stores from harness runtimes, whether client-simulated or connected to real CLI agent runners.
_Avoid_: Backend service, driver, connector

**Console launcher**:
The `openharness` CLI executable that spins up the console server on custom port 9480 and opens the browser.
_Avoid_: Web runner, dev script, frontend bootstrapper

**Console storage**:
The modular filesystem directory located at `~/.openharness/` on the host machine storing configuration (`config.json`), projects (`projects.json`), workflows (`workflows.json`), execution runs (`runs.json`), and individual session files (`sessions/<id>.json`).
_Avoid_: Browser localStorage, cookie storage, web database

**Terminal emulator**:
An embedded interactive shell pseudo-terminal (PTY) inside a project session supporting ANSI color codes, live REPLs, and background execution (e.g. dev servers) while the developer chats with the agent harness.
_Avoid_: Command log, static output box, dev runner popup



