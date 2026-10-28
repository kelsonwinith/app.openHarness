/**
 * Canonical domain models for Relay — Agent Harness Console
 * Strictly follows GLOSSARY.md
 */

export type HarnessId = 'opencode' | (string & {});

export interface Harness {
  id: string;
  name: string;
  version: string;
  icon?: string;
  tagline: string;
  command?: string;
  addedAt?: number;
}

export interface SkillFile {
  name: string;
  path: string;
  content: string;
}

export interface Skill {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  instructions: string;
  createdAt?: number;
  updatedAt?: number;
  source?: string;
  files?: SkillFile[];
}

export interface Step {
  id: string;
  skillId: string;
  gate?: boolean;
  instructions?: string;
  groupId?: string;
  skillName?: string;
  skillSource?: string;
}

export interface StepGroup {
  id: string;
  name: string;
  description?: string;
  gate?: boolean;
  steps: Step[];
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  groups?: StepGroup[];
  steps: Step[];
  updatedAt: number;
}

export type RunStatus = 'running' | 'waiting' | 'paused' | 'completed' | 'stopped' | 'failed';

export type ActivityKind =
  | 'read'
  | 'search'
  | 'glob'
  | 'run'
  | 'edit'
  | 'write'
  | 'plan'
  | 'think'
  | 'ask'
  | 'gate'
  | 'gate-ok'
  | 'gate-no'
  | 'done'
  | 'stop';

export interface Activity {
  k: ActivityKind;
  arg?: string;
  text?: string;
  gate?: boolean;
  at: number;
}

export type RunStepStatus = 'pending' | 'running' | 'waiting' | 'done' | 'blocked' | 'stopped';

export interface RunStep {
  id: string;
  stepId: string;
  skillId: string;
  name: string;
  groupId?: string;
  groupName?: string;
  gate: boolean;
  instructions?: string;
  status: RunStepStatus;
  activities: Activity[];
  startedAt: number | null;
  endedAt: number | null;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  path: string;
  gitRemoteUrl?: string | null;
  currentBranch?: string | null;
  createdAt: number;
  updatedAt: number;
}

export type SessionStatus = 'active' | 'archived';

export interface FileChange {
  path: string;
  status: 'modified' | 'added' | 'deleted';
  additions: number;
  deletions: number;
  diff?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestedWorkflowId?: string;
  suggestedWorkflowName?: string;
  suggestedPlan?: string[];
  stepsCount?: number;
  fileChanges?: FileChange[];
  runId?: string;
  createdAt: number;
}

export interface Session {
  id: string;
  projectId: string;
  name: string;
  description: string;
  gitBranch: string;
  defaultHarnessId: HarnessId;
  status: SessionStatus;
  runIds: string[];
  messages: ChatMessage[];
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Run {
  id: string;
  projectId?: string;
  sessionId?: string;
  workflowId: string;
  workflowName: string;
  harnessId: HarnessId;
  status: RunStatus;
  startedAt: number;
  endedAt: number | null;
  pausedMs: number;
  pausedAt: number | null;
  currentStep: number;
  speed: number;
  steps: RunStep[];
}
