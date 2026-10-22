import { Harness, HarnessId, Project, Run, Session, Skill, Workflow } from '../domain/types';

export interface NotificationSettings {
  browserEnabled: boolean;
  soundEnabled: boolean;
  notifyOnGate: boolean;
  notifyOnComplete: boolean;
}

export interface ConsoleState {
  version: number;
  theme: 'light' | 'dark' | 'system';
  defaultHarness: HarnessId;
  simSpeed: number;
  activeWorkflowId: string | null;
  activeProjectId: string | null;
  activeSessionId: string | null;
  harnesses?: Harness[];
  projects: Project[];
  sessions: Session[];
  skills: Skill[];
  workflows: Workflow[];
  runs: Run[];
  notifications?: NotificationSettings;
}

export interface IConsoleRepository {
  loadState(): Promise<ConsoleState>;
  saveState(state: ConsoleState): Promise<void>;
  resetState(): Promise<ConsoleState>;
}
