# Repository Adapter for Storage and Harness Execution

The console decouples UI components and state management from the underlying persistence and execution mechanism via a Repository / Adapter interface.

Initially, a `LocalStorageRepository` and `ClientSimulationAdapter` provide complete in-browser persistence and simulated multi-step harness execution (emitting activities, pausing at gates, respecting harness tool naming conventions). This allows the entire execution engine to be swapped for real CLI agent runtimes (OpenCode, Codex, Antigravity, Claude Code) or a backend API adapter without modifying the UI layer.

**Consequences**

- The application starts empty by default, allowing manual creation or explicit loading of seed/sample data via Settings.
- Harness runtime execution is abstracted behind standard async lifecycle hooks (`launchRun`, `resumeRunAtGate`, `pauseRun`, `cancelRun`).
- Transitioning to a real CLI harness daemon or server-sent events (SSE) backend requires implementing the adapter interface rather than rewriting console components.
