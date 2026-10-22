import { Skill, SkillFile } from './types';

/**
 * Returns the file bundle associated with a skill.
 * If the skill does not have explicit files, generates a standard
 * agent skill package structure (SKILL.md, scripts/run.py, references/guide.md, package.json).
 */
export function getSkillFiles(skill: Skill): SkillFile[] {
  if (skill.files && skill.files.length > 0) {
    return skill.files;
  }

  const safeSlug = skill.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'skill';

  return [
    {
      name: 'SKILL.md',
      path: 'SKILL.md',
      content: `---
name: "${skill.name}"
---

# ${skill.name}

## Instructions

${skill.instructions || `Execute the specialized directives for ${skill.name}.`}

## Capabilities
- Interprets task instructions and parses contextual arguments
- Executes automated commands and inspects repo workspace
- Emits structured output and validation artifacts
`
    },
    {
      name: 'run.py',
      path: 'scripts/run.py',
      content: `#!/usr/bin/env python3
"""
${skill.name} execution runner.
Invoked by CLI harnesses during workflow step execution.
"""

import os
import sys
import json

def execute_skill():
    print("[openharness] Initializing skill: ${skill.name}")
    session_id = os.environ.get("OPENHARNESS_SESSION_ID", "default")
    print(f"[openharness] Active session context: {session_id}")
    
    # Custom skill execution logic
    return 0

if __name__ == "__main__":
    sys.exit(execute_skill())
`
    },
    {
      name: 'guide.md',
      path: 'references/guide.md',
      content: `# ${skill.name} Reference Guide

## Overview
This skill provides automated step execution for ${skill.name}.

### Step Integration
- **Gate Support**: Can be paired with manual gate approval.
- **Workflow Order**: Recommended after contextual workspace setup.

### Directives
- Standard output is piped into session chat history.
- Errors pause step execution if approval gate is configured.
`
    },
    {
      name: 'package.json',
      path: 'package.json',
      content: JSON.stringify(
        {
          name: `@skills/${safeSlug}`,
          version: '1.0.0',
          private: true,
          main: 'scripts/run.py',
          files: ['SKILL.md', 'scripts/', 'references/']
        },
        null,
        2
      )
    }
  ];
}
