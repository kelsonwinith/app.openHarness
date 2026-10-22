import { Harness, HarnessId, Skill } from './types';

export const SUPPORTED_HARNESSES: Harness[] = [
  {
    id: 'opencode',
    name: 'OpenCode',
    version: '2.1.2',
    icon: 'SquareTerminal',
    tagline: 'Open-source CLI AI software engineering agent'
  }
];

export const HARNESSES = SUPPORTED_HARNESSES;

export const TOOL_NAMES: Record<string, Record<string, string>> = {
  opencode: {
    read: 'read',
    search: 'grep',
    glob: 'glob',
    run: 'bash',
    edit: 'edit',
    write: 'write',
    plan: 'todowrite'
  }
};

export const DEFAULT_SKILLS: Skill[] = [];

export const PLANS: Record<string, Array<{ k: string; arg?: string; text: string }>> = {};

export const GENERIC_PLAN: Array<{ k: string; arg?: string; text: string }> = [
  { k: 'read', arg: 'README.md', text: 'Loading project context' },
  { k: 'think', text: 'Planning the smallest correct change' },
  { k: 'edit', arg: 'src/index.ts', text: 'Applying the change' },
  { k: 'run', arg: 'pnpm test', text: 'Verifying the result' },
  { k: 'think', text: 'Work complete and checked' }
];
