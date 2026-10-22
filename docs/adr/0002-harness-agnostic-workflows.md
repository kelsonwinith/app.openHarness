# Workflow definitions are harness-agnostic; the harness is chosen at launch

A workflow describes intent — ordered skills, gates, instruction overrides — and does not encode harness-specific tooling. The harness is selected when a run starts, and the console adapts how it presents activity (tool names, streaming labels) at runtime. Gates are enforced by the console, not delegated to a harness-specific approval flag.

**Consequences**

- The same workflow can be launched on OpenCode, Codex, Antigravity, or Claude Code without edits.
- Run records store the harness that executed them, so history is attributable.
- Harness capabilities that cannot be expressed as skills, gates, or activity are out of scope for the workflow model.
