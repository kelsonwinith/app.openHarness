# 57. Workflow Selector in Project Chat with Tagged Flow Skills and Desktop Alerts

Date: 2026-10-22

## Status

Accepted

## Context

Developers working in project sessions need to easily alternate between direct ad-hoc chat with the OpenCode CLI harness and executing structured, multi-skill workflows. Previously, workflows were triggered only through modal launches or inline suggested cards, with no visual skill tagging or explicit "None (Direct Chat)" toggle.

Furthermore, long-running agent workflows and human-in-the-loop gate checkpoints often execute while the developer is tabbed into external editors (e.g. VS Code, Chrome dev tools, or Terminal). Developers need native desktop notifications and audio chimes to be alerted immediately when execution finishes or requests authorization.

## Decision

1. **Workflow Selection Dropdown**:
   - Integrated directly into the docked prompt bar in `project-ai-chat.tsx`.
   - **Options**:
     - `None (Direct Chat)`: Standard direct conversational agent prompt to OpenCode.
     - Workflows: Lists all composed workflow templates with skill counts.
2. **Tagged Flow Skills Banner**:
   - Selecting a workflow displays a pill bar above the input with ordered badges for each skill in that workflow (e.g. `01 Discovery`, `02 Implementation [Gate]`, `03 Verification`).
   - Includes a one-click dismiss button (`X`) to return immediately to direct chat.
   - Sending input while a flow is selected automatically executes the workflow sequentially through all tagged skills.
3. **Native Desktop Web Notifications & Audio Chime Service**:
   - Created `notificationService` leveraging the Web Notification API (`window.Notification`) and synthesized audio chimes via Web Audio API (`AudioContext`).
   - Desktop alerts pop up even when the browser is unfocused, minimized, or in the background.
   - Distinct alert sound tones: dual-tone chime for Gate Checkpoints requiring human review, and a melodic chime for Workflow Completion.
4. **Notification Preferences**:
   - Added user controls in `SettingsPage` to toggle desktop alerts, sound chimes, gate notifications, and completion notifications.
   - Preferences are persisted to machine storage at `~/.openharness/config.json`.

## Consequences

- Clear, visible distinction between direct agent conversation and automated multi-skill workflows.
- Immediate visibility of all skills involved in an active workflow before execution.
- Enables developers to focus on other applications and return to OpenHarness only when needed.
