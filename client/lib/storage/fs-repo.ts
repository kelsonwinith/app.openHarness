import { DEFAULT_SKILLS, HARNESSES } from '../domain/constants';
import { ConsoleState, IConsoleRepository } from './repository';

const LEGACY_STORAGE_KEY = 'relay.state.v1';

export class FileSystemRepository implements IConsoleRepository {
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;
  private pendingState: ConsoleState | null = null;

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
    try {
      const res = await fetch('/api/state', { cache: 'no-store' });
      if (!res.ok) {
        return this.getEmptyState();
      }
      const data: ConsoleState = await res.json();

      // One-time legacy migration from browser localStorage to ~/.openharness/
      if (typeof window !== 'undefined') {
        try {
          const rawLegacy = localStorage.getItem(LEGACY_STORAGE_KEY);
          if (rawLegacy) {
            const legacy = JSON.parse(rawLegacy);
            if (legacy && Array.isArray(legacy.projects) && legacy.projects.length > 0 && data.projects.length === 0) {
              // Migrate legacy browser state to machine files
              await fetch('/api/state', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(legacy)
              });
              localStorage.removeItem(LEGACY_STORAGE_KEY);
              return {
                ...this.getEmptyState(),
                ...legacy,
                defaultHarness: 'opencode'
              };
            } else {
              localStorage.removeItem(LEGACY_STORAGE_KEY);
            }
          }
        } catch {
          // ignore localStorage migration errors
        }
      }

      return {
        ...this.getEmptyState(),
        ...data,
        defaultHarness: 'opencode'
      };
    } catch {
      return this.getEmptyState();
    }
  }

  async saveState(state: ConsoleState): Promise<void> {
    this.pendingState = state;

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(async () => {
      const toSave = this.pendingState;
      if (!toSave) return;

      try {
        await fetch('/api/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(toSave)
        });
      } catch (err) {
        console.error('Failed to sync state to ~/.openharness:', err);
      }
    }, 150);
  }

  async resetState(): Promise<ConsoleState> {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    this.pendingState = null;

    try {
      await fetch('/api/state', { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to reset ~/.openharness state:', err);
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch {}
    }

    return this.getEmptyState();
  }
}

export const consoleRepository = new FileSystemRepository();
