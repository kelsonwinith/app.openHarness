# Workflows reference shared skills by ID

A workflow step is an ordered reference to a skill in the shared library, not a copy. Editing a skill changes every workflow that uses it; per-workflow variation lives on the step as an optional instruction override and gate setting. Runs snapshot the resolved step names and instructions at launch so history stays truthful after the library changes.

**Consequences**

- Deleting a skill removes its steps from every workflow, so deletion must show affected workflows first.
- Editing a skill is a cross-workflow change and needs a clear usage count in the library.
- Historical runs are unaffected by later skill edits because they are snapshots.
