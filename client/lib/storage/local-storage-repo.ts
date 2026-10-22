import { DEFAULT_SKILLS, HARNESSES } from '../domain/constants';
import { Harness, Run, Skill } from '../domain/types';
import { ConsoleState, IConsoleRepository } from './repository';

const STORAGE_KEY = 'relay.state.v1';

const MOCK_SKILL_IDS = new Set([
  'project-discovery',
  'requirement-discovery',
  'requirements-docs',
  'implementation-strategy',
  'architecture-adr',
  'implementation',
  'qa-verification',
  'repro-bug',
  'isolate-cause',
  'patch-fix',
  'regression-check',
  'docs-audit',
  'api-contract-sync',
  'release-notes'
]);

export class LocalStorageRepository implements IConsoleRepository {
  private getEmptyState(): ConsoleState {
    return {
      version: 1,
      theme: 'system',
      defaultHarness: 'opencode',
      simSpeed: 1,
      activeWorkflowId: null,
      activeProjectId: null,
      activeSessionId: null,
      harnesses: [...HARNESSES],
      projects: [],
      sessions: [],
      skills: [...DEFAULT_SKILLS],
      workflows: [],
      runs: []
    };
  }

  async loadState(): Promise<ConsoleState> {
    if (typeof window === 'undefined') {
      return this.getEmptyState();
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return this.getEmptyState();
      }
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== 1) {
        return this.getEmptyState();
      }

      // Recover interrupted runs
      if (Array.isArray(parsed.runs)) {
        parsed.runs.forEach((run: Run) => {
          if (['running', 'waiting', 'paused'].includes(run.status)) {
            run.status = 'stopped';
            run.endedAt = Date.now();
            run.pausedAt = null;
            const st = run.steps?.[run.currentStep];
            if (st && ['running', 'waiting', 'pending'].includes(st.status)) {
              st.status = 'stopped';
              st.endedAt = Date.now();
              st.activities = st.activities || [];
              st.activities.push({ k: 'stop', text: 'Session ended before the run completed', at: Date.now() });
            }
          }
        });
      }

      return {
        version: 1,
        theme: parsed.theme || 'system',
        defaultHarness: parsed.defaultHarness || 'opencode',
        simSpeed: parsed.simSpeed || 1,
        activeWorkflowId: parsed.activeWorkflowId || (parsed.workflows?.[0]?.id ?? null),
        activeProjectId: parsed.activeProjectId ?? null,
        activeSessionId: parsed.activeSessionId ?? null,
        harnesses: Array.isArray(parsed.harnesses) && parsed.harnesses.length > 0 ? parsed.harnesses : [...HARNESSES],
        projects: Array.isArray(parsed.projects) ? parsed.projects : [],
        sessions: Array.isArray(parsed.sessions)
          ? parsed.sessions.map((s: Record<string, unknown>) => ({
              ...s,
              messages: Array.isArray(s.messages) ? s.messages : []
            }))
          : [],
        skills: Array.isArray(parsed.skills)
          ? parsed.skills.filter((s: Skill) => s && !MOCK_SKILL_IDS.has(s.id))
          : [],
        workflows: Array.isArray(parsed.workflows) ? parsed.workflows : [],
        runs: Array.isArray(parsed.runs) ? parsed.runs : []
      };
    } catch {
      return this.getEmptyState();
    }
  }

  async saveState(state: ConsoleState): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save console state to localStorage', e);
    }
  }

  async resetState(): Promise<ConsoleState> {
    const fresh = this.getEmptyState();
    await this.saveState(fresh);
    return fresh;
  }
}

export const consoleRepository = new LocalStorageRepository();
