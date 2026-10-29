import { create } from 'zustand';
import { arrayMove } from '@dnd-kit/sortable';
import { DEFAULT_SKILLS, HARNESSES, SUPPORTED_HARNESSES } from '../domain/constants';
import { getSkillFiles } from '../domain/skill-files';
import { Harness, HarnessId, Project, Run, RunStep, Session, ChatMessage, Skill, Step, StepGroup, Workflow } from '../domain/types';
import { simulationEngine } from '../simulation/simulation-engine';
import { consoleRepository } from '../storage/fs-repo';
import { NotificationSettings } from '../storage/repository';
import { notificationService } from '../notifications/notification-service';
import { uid } from '../utils';

interface ConsoleStoreState {
  isInitialized: boolean;
  theme: 'light' | 'dark' | 'system';
  defaultHarness: HarnessId;
  simSpeed: number;
  projects: Project[];
  sessions: Session[];
  activeProjectId: string | null;
  activeSessionId: string | null;
  workflows: Workflow[];
  skills: Skill[];
  runs: Run[];
  harnesses: Harness[];

  // Harness Catalog Actions
  addHarness: (harnessId: string) => Harness | null;
  deleteHarness: (id: string) => void;
  updateSessionHarness: (sessionId: string, harnessId: string) => void;

  // Initialization & Data Migration
  initialize: () => Promise<void>;
  resetToEmpty: () => Promise<void>;

  // Settings
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setDefaultHarness: (harness: HarnessId) => void;
  setSimSpeed: (speed: number) => void;

  // Project actions
  setActiveProject: (id: string | null) => void;
  setActiveSession: (id: string | null) => void;
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  reorderProjects: (oldIndex: number, newIndex: number) => void;

  // Session actions
  createSession: (
    session: Omit<Session, 'id' | 'createdAt' | 'updatedAt' | 'runIds' | 'messages'> & {
      messages?: ChatMessage[];
    }
  ) => Session;
  updateSession: (id: string, updates: Partial<Session>) => void;
  deleteSession: (id: string) => void;
  addSessionMessage: (sessionId: string, message: ChatMessage) => void;
  updateSessionMessage: (sessionId: string, messageId: string, content: string, extra?: Partial<ChatMessage>) => void;
  reorderSessions: (projectId: string, oldIndex: number, newIndex: number) => void;

  // Workflow actions
  createWorkflow: (name: string, description?: string) => Workflow;
  updateWorkflow: (id: string, updates: Partial<Workflow>) => void;
  deleteWorkflow: (id: string) => void;
  duplicateWorkflow: (id: string) => Workflow | null;
  reorderWorkflow: (sourceId: string, targetId: string, after: boolean) => void;
  reorderWorkflows: (oldIndex: number, newIndex: number) => void;

  // Group actions
  addGroup: (wfId: string, name?: string, index?: number) => StepGroup;
  renameGroup: (wfId: string, groupId: string, name: string) => void;
  deleteGroup: (wfId: string, groupId: string) => void;
  reorderGroups: (wfId: string, oldIndex: number, newIndex: number) => void;
  toggleGroupGate: (wfId: string, groupId: string) => void;
  addSkillToGroup: (wfId: string, groupId: string, skillId: string, gate?: boolean, instructions?: string) => Step;
  reorderGroupSteps: (wfId: string, groupId: string, oldIndex: number, newIndex: number) => void;
  deleteGroupStep: (wfId: string, groupId: string, stepId: string) => void;

  // Step actions
  addStep: (wfId: string, skillId: string, gate?: boolean, instructions?: string) => void;
  updateStep: (wfId: string, stepId: string, updates: Partial<Step>) => void;
  deleteStep: (wfId: string, stepId: string) => void;
  reorderStep: (wfId: string, sourceId: string, targetId: string, after: boolean) => void;
  reorderSteps: (wfId: string, oldIndex: number, newIndex: number) => void;

  // Skill actions
  createSkill: (skill: Omit<Skill, 'id'>) => Skill;
  updateSkill: (id: string, updates: Partial<Skill>) => void;
  deleteSkill: (id: string) => { affectedWorkflowsCount: number };
  getSkillUsageCount: (skillId: string) => number;
  reorderSkills: (oldIndex: number, newIndex: number) => void;
  syncSkills: (skills: Skill[]) => void;

  // Notification settings
  notifications: NotificationSettings;
  updateNotifications: (updates: Partial<NotificationSettings>) => void;

  // Run actions
  startRun: (wfId: string, harnessId?: HarnessId, projectId?: string, sessionId?: string) => Run | null;
  deleteRun: (runId: string) => void;
  pauseRun: () => void;
  resumeRun: () => void;
  stopRun: () => void;
  approveGate: () => void;
  rejectGate: () => void;
  reviseGate: (feedback: string) => void;
  cycleRunSpeed: () => void;
}

export const useConsoleStore = create<ConsoleStoreState>((set, get) => {
  // Bind simulation updates directly to the store
  simulationEngine.registerListener((updatedRun, eventType) => {
    const currentState = get();

    if (eventType === 'gate' && currentState.notifications?.notifyOnGate) {
      notificationService.notify({
        title: `Approval Required: ${updatedRun.workflowName}`,
        body: `Step "${updatedRun.steps[updatedRun.currentStep]?.name || 'Gate'}" requires your review.`,
        type: 'gate',
        soundEnabled: currentState.notifications.soundEnabled,
        browserEnabled: currentState.notifications.browserEnabled
      });
    } else if (eventType === 'completed' && currentState.notifications?.notifyOnComplete) {
      notificationService.notify({
        title: `Workflow Complete: ${updatedRun.workflowName}`,
        body: `All ${updatedRun.steps.length} skills finished successfully.`,
        type: 'complete',
        soundEnabled: currentState.notifications.soundEnabled,
        browserEnabled: currentState.notifications.browserEnabled
      });
    }

    set((state) => {
      const nextRuns = state.runs.map((r) => (r.id === updatedRun.id ? { ...updatedRun } : r));
      consoleRepository.saveState({
        version: 1,
        theme: state.theme,
        defaultHarness: state.defaultHarness,
        simSpeed: state.simSpeed,
        activeWorkflowId: null,
        activeProjectId: state.activeProjectId,
        activeSessionId: state.activeSessionId,
        projects: state.projects,
        sessions: state.sessions,
        skills: state.skills,
        workflows: state.workflows,
        runs: nextRuns,
        notifications: state.notifications
      });
      return { runs: nextRuns };
    });
  });

  const persistCurrentState = (partialState: Partial<ConsoleStoreState>) => {
    const current = get();
    consoleRepository.saveState({
      version: 1,
      theme: partialState.theme ?? current.theme,
      defaultHarness: partialState.defaultHarness ?? current.defaultHarness,
      simSpeed: partialState.simSpeed ?? current.simSpeed,
      activeWorkflowId: null,
      activeProjectId: partialState.activeProjectId ?? current.activeProjectId,
      activeSessionId: partialState.activeSessionId ?? current.activeSessionId,
      harnesses: partialState.harnesses ?? current.harnesses,
      projects: partialState.projects ?? current.projects,
      sessions: partialState.sessions ?? current.sessions,
      skills: partialState.skills ?? current.skills,
      workflows: partialState.workflows ?? current.workflows,
      runs: partialState.runs ?? current.runs,
      notifications: partialState.notifications ?? current.notifications
    });
  };

  return {
    isInitialized: false,
    theme: 'system',
    defaultHarness: 'opencode',
    simSpeed: 1,
    projects: [],
    sessions: [],
    activeProjectId: null,
    activeSessionId: null,
    workflows: [],
    skills: [...DEFAULT_SKILLS],
    runs: [],
    harnesses: [...HARNESSES],
    notifications: {
      browserEnabled: true,
      soundEnabled: true,
      notifyOnGate: true,
      notifyOnComplete: true
    },

    initialize: async () => {
      if (get().isInitialized) return;
      const loaded = await consoleRepository.loadState();
      set({
        isInitialized: true,
        theme: loaded.theme,
        defaultHarness: loaded.defaultHarness,
        simSpeed: loaded.simSpeed,
        activeProjectId: loaded.activeProjectId,
        activeSessionId: loaded.activeSessionId,
        harnesses: (() => {
          const valid = (loaded.harnesses || []).filter((h) =>
            SUPPORTED_HARNESSES.some((sh) => sh.id === h.id)
          );
          return valid.length > 0 ? valid : [...HARNESSES];
        })(),
        projects: loaded.projects,
        sessions: loaded.sessions,
        skills: loaded.skills,
        workflows: loaded.workflows,
        runs: loaded.runs,
        notifications: loaded.notifications || {
          browserEnabled: true,
          soundEnabled: true,
          notifyOnGate: true,
          notifyOnComplete: true
        }
      });

      // Immediately synchronize real physical skills from host system (< 5ms direct filesystem scan)
      try {
        const res = await fetch('/api/skills/list');
        const data = await res.json();
        if (data?.skills && Array.isArray(data.skills)) {
          get().syncSkills(data.skills);
        }
      } catch {}
    },

    updateNotifications: (updates) => {
      set((state) => {
        const next = { ...state.notifications, ...updates };
        persistCurrentState({ notifications: next });
        return { notifications: next };
      });
    },

    resetToEmpty: async () => {
      await consoleRepository.resetState();
      set({
        projects: [],
        sessions: [],
        activeProjectId: null,
        activeSessionId: null,
        workflows: [],
        runs: [],
        skills: [...DEFAULT_SKILLS]
      });
    },

    setTheme: (theme) => {
      set({ theme });
      persistCurrentState({ theme });
    },

    setDefaultHarness: (defaultHarness) => {
      set({ defaultHarness });
      persistCurrentState({ defaultHarness });
    },

    setSimSpeed: (simSpeed) => {
      set({ simSpeed });
      persistCurrentState({ simSpeed });
    },

    setActiveProject: (activeProjectId) => {
      set({ activeProjectId });
      persistCurrentState({ activeProjectId });
    },

    setActiveSession: (activeSessionId) => {
      set({ activeSessionId });
      persistCurrentState({ activeSessionId });
    },

    createProject: (projectData) => {
      const newProject: Project = {
        ...projectData,
        id: uid('proj'),
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      set((state) => {
        const next = [newProject, ...state.projects];
        persistCurrentState({ projects: next, activeProjectId: newProject.id });
        return { projects: next, activeProjectId: newProject.id };
      });
      return newProject;
    },

    updateProject: (id, updates) => {
      set((state) => {
        const next = state.projects.map((p) =>
          p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
        );
        persistCurrentState({ projects: next });
        return { projects: next };
      });
    },

    deleteProject: (id) => {
      // Gracefully terminate any running background terminal process for this project
      fetch('/api/terminal/kill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: id, signal: 'SIGTERM' })
      }).catch(() => {});

      set((state) => {
        const nextProjects = state.projects.filter((p) => p.id !== id);
        const nextSessions = state.sessions.filter((s) => s.projectId !== id);
        const activeProjectId = state.activeProjectId === id ? (nextProjects[0]?.id ?? null) : state.activeProjectId;
        persistCurrentState({ projects: nextProjects, sessions: nextSessions, activeProjectId });
        return { projects: nextProjects, sessions: nextSessions, activeProjectId };
      });
    },

    reorderProjects: (oldIndex, newIndex) => {
      set((state) => {
        const next = arrayMove(state.projects, oldIndex, newIndex);
        persistCurrentState({ projects: next });
        return { projects: next };
      });
    },

    createSession: (sessionData) => {
      const newSession: Session = {
        ...sessionData,
        id: uid('sess'),
        messages: sessionData.messages || [],
        runIds: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      set((state) => {
        const next = [newSession, ...state.sessions];
        persistCurrentState({ sessions: next, activeSessionId: newSession.id });
        return { sessions: next, activeSessionId: newSession.id };
      });
      return newSession;
    },

    updateSession: (id, updates) => {
      set((state) => {
        const next = state.sessions.map((s) =>
          s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s
        );
        persistCurrentState({ sessions: next });
        return { sessions: next };
      });
    },

    deleteSession: (id) => {
      set((state) => {
        const nextSessions = state.sessions.filter((s) => s.id !== id);
        const activeSessionId = state.activeSessionId === id ? null : state.activeSessionId;
        persistCurrentState({ sessions: nextSessions, activeSessionId });
        return { sessions: nextSessions, activeSessionId };
      });
    },

    addSessionMessage: (sessionId, message) => {
      set((state) => {
        const next = state.sessions.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                messages: [...(s.messages || []), message],
                updatedAt: Date.now()
              }
            : s
        );
        persistCurrentState({ sessions: next });
        return { sessions: next };
      });
    },

    updateSessionMessage: (sessionId, messageId, content, extra) => {
      set((state) => {
        const next = state.sessions.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                messages: (s.messages || []).map((m) =>
                  m.id === messageId ? { ...m, content, ...(extra || {}) } : m
                ),
                updatedAt: Date.now()
              }
            : s
        );
        persistCurrentState({ sessions: next });
        return { sessions: next };
      });
    },

    reorderSessions: (projectId, oldIndex, newIndex) => {
      set((state) => {
        const projectSessions = state.sessions.filter((s) => s.projectId === projectId);
        const otherSessions = state.sessions.filter((s) => s.projectId !== projectId);
        const reordered = arrayMove(projectSessions, oldIndex, newIndex);
        const next = [...reordered, ...otherSessions];
        persistCurrentState({ sessions: next });
        return { sessions: next };
      });
    },

    updateSessionHarness: (sessionId, harnessId) => {
      set((state) => {
        const next = state.sessions.map((s) =>
          s.id === sessionId ? { ...s, defaultHarnessId: harnessId, updatedAt: Date.now() } : s
        );
        persistCurrentState({ sessions: next });
        return { sessions: next };
      });
    },

    addHarness: (harnessId) => {
      const state = get();
      if (state.harnesses.some((h) => h.id === harnessId)) return null;
      const target = SUPPORTED_HARNESSES.find((h) => h.id === harnessId);
      if (!target) return null;
      const newHarness: Harness = {
        ...target,
        addedAt: Date.now()
      };
      set((prev) => {
        const next = [...prev.harnesses, newHarness];
        persistCurrentState({ harnesses: next });
        return { harnesses: next };
      });
      return newHarness;
    },

    deleteHarness: (id) => {
      set((state) => {
        const next = state.harnesses.filter((h) => h.id !== id);
        persistCurrentState({ harnesses: next });
        return { harnesses: next };
      });
    },

    createWorkflow: (name, description = '') => {
      const newWf: Workflow = {
        id: uid('wf'),
        name: name.trim() || 'Untitled workflow',
        steps: [],
        nodes: [],
        edges: [],
        updatedAt: Date.now()
      };
      set((state) => {
        const next = [newWf, ...state.workflows];
        persistCurrentState({ workflows: next });
        return { workflows: next };
      });
      return newWf;
    },

    updateWorkflow: (id, updates) => {
      set((state) => {
        const next = state.workflows.map((w) =>
          w.id === id ? { ...w, ...updates, updatedAt: Date.now() } : w
        );
        persistCurrentState({ workflows: next });
        return { workflows: next };
      });
    },

    deleteWorkflow: (id) => {
      set((state) => {
        const next = state.workflows.filter((w) => w.id !== id);
        persistCurrentState({ workflows: next });
        return { workflows: next };
      });
    },

    duplicateWorkflow: (id) => {
      const current = get().workflows.find((w) => w.id === id);
      if (!current) return null;
      const copy: Workflow = {
        id: uid('wf'),
        name: `${current.name} (Copy)`,
        description: current.description,
        steps: current.steps.map((s) => ({ ...s, id: uid('step') })),
        updatedAt: Date.now()
      };
      set((state) => {
        const next = [copy, ...state.workflows];
        persistCurrentState({ workflows: next });
        return { workflows: next };
      });
      return copy;
    },

    reorderWorkflow: (sourceId, targetId, after) => {
      set((state) => {
        const list = [...state.workflows];
        const from = list.findIndex((w) => w.id === sourceId);
        const target = list.findIndex((w) => w.id === targetId);
        if (from < 0 || target < 0 || from === target) return {};
        const [item] = list.splice(from, 1);
        let insert = target + (after ? 1 : 0);
        if (from < insert) insert -= 1;
        insert = Math.max(0, Math.min(list.length, insert));
        list.splice(insert, 0, item);
        persistCurrentState({ workflows: list });
        return { workflows: list };
      });
    },

    reorderWorkflows: (oldIndex, newIndex) => {
      set((state) => {
        const next = arrayMove(state.workflows, oldIndex, newIndex);
        persistCurrentState({ workflows: next });
        return { workflows: next };
      });
    },

    addGroup: (wfId, name, index) => {
      const currentWf = get().workflows.find((w) => w.id === wfId);
      const groupCount = currentWf?.groups?.length || 0;
      const newGroup: StepGroup = {
        id: uid('grp'),
        name: name?.trim() || `Group ${groupCount + 1}`,
        steps: []
      };
      set((state) => {
        const next = state.workflows.map((wf) => {
          if (wf.id !== wfId) return wf;
          const groups = [...(wf.groups || [])];
          if (index !== undefined && index >= 0 && index <= groups.length) {
            groups.splice(index, 0, newGroup);
          } else {
            groups.push(newGroup);
          }
          return {
            ...wf,
            groups,
            steps: groups.flatMap((g) => g.steps),
            updatedAt: Date.now()
          };
        });
        persistCurrentState({ workflows: next });
        return { workflows: next };
      });
      return newGroup;
    },

    renameGroup: (wfId, groupId, name) => {
      set((state) => {
        const next = state.workflows.map((wf) => {
          if (wf.id !== wfId) return wf;
          const groups = (wf.groups || []).map((g) =>
            g.id === groupId ? { ...g, name: name.trim() || g.name } : g
          );
          return { ...wf, groups, updatedAt: Date.now() };
        });
        persistCurrentState({ workflows: next });
        return { workflows: next };
      });
    },

    deleteGroup: (wfId, groupId) => {
      set((state) => {
        const next = state.workflows.map((wf) => {
          if (wf.id !== wfId) return wf;
          const groups = (wf.groups || []).filter((g) => g.id !== groupId);
          return {
            ...wf,
            groups,
            steps: groups.flatMap((g) => g.steps),
            updatedAt: Date.now()
          };
        });
        persistCurrentState({ workflows: next });
        return { workflows: next };
      });
    },

    reorderGroups: (wfId, oldIndex, newIndex) => {
      set((state) => {
        const next = state.workflows.map((wf) => {
          if (wf.id !== wfId) return wf;
          const groups = arrayMove(wf.groups || [], oldIndex, newIndex);
          return {
            ...wf,
            groups,
            steps: groups.flatMap((g) => g.steps),
            updatedAt: Date.now()
          };
        });
        persistCurrentState({ workflows: next });
        return { workflows: next };
      });
    },

    toggleGroupGate: (wfId, groupId) => {
      set((state) => {
        const next = state.workflows.map((wf) => {
          if (wf.id !== wfId) return wf;
          const groups = (wf.groups || []).map((g) =>
            g.id === groupId ? { ...g, gate: !g.gate } : g
          );
          return { ...wf, groups, updatedAt: Date.now() };
        });
        persistCurrentState({ workflows: next });
        return { workflows: next };
      });
    },

    addSkillToGroup: (wfId, groupId, skillId, gate = false, instructions = '') => {
      const targetSkill = get().skills.find((s) => s.id === skillId);
      const newStep: Step = {
        id: uid('step'),
        skillId,
        gate,
        instructions,
        groupId,
        skillName: targetSkill?.name,
        skillSource: targetSkill?.source
      };
      set((state) => {
        const next = state.workflows.map((wf) => {
          if (wf.id !== wfId) return wf;
          const existingGroups = wf.groups && wf.groups.length > 0
            ? wf.groups
            : [{ id: groupId, name: 'Group 1', steps: [] }];

          const groups = existingGroups.map((g) =>
            g.id === groupId ? { ...g, steps: [...g.steps, newStep] } : g
          );

          return {
            ...wf,
            groups,
            steps: groups.flatMap((g) => g.steps),
            updatedAt: Date.now()
          };
        });
        persistCurrentState({ workflows: next });
        return { workflows: next };
      });
      return newStep;
    },

    reorderGroupSteps: (wfId, groupId, oldIndex, newIndex) => {
      set((state) => {
        const next = state.workflows.map((wf) => {
          if (wf.id !== wfId) return wf;
          const groups = (wf.groups || []).map((g) =>
            g.id === groupId
              ? { ...g, steps: arrayMove(g.steps, oldIndex, newIndex) }
              : g
          );
          return {
            ...wf,
            groups,
            steps: groups.flatMap((g) => g.steps),
            updatedAt: Date.now()
          };
        });
        persistCurrentState({ workflows: next });
        return { workflows: next };
      });
    },

    deleteGroupStep: (wfId, groupId, stepId) => {
      set((state) => {
        const next = state.workflows.map((wf) => {
          if (wf.id !== wfId) return wf;
          const groups = (wf.groups || []).map((g) =>
            g.id === groupId
              ? { ...g, steps: g.steps.filter((st) => st.id !== stepId) }
              : g
          );
          return {
            ...wf,
            groups,
            steps: groups.flatMap((g) => g.steps),
            updatedAt: Date.now()
          };
        });
        persistCurrentState({ workflows: next });
        return { workflows: next };
      });
    },

    addStep: (wfId, skillId, gate = false, instructions = '') => {
      const targetSkill = get().skills.find((s) => s.id === skillId);
      set((state) => {
        const next = state.workflows.map((wf) => {
          if (wf.id !== wfId) return wf;
          const newStep: Step = {
            id: uid('step'),
            skillId,
            gate,
            instructions,
            skillName: targetSkill?.name,
            skillSource: targetSkill?.source
          };
          return {
            ...wf,
            steps: [...wf.steps, newStep],
            updatedAt: Date.now()
          };
        });
        persistCurrentState({ workflows: next });
        return { workflows: next };
      });
    },

    updateStep: (wfId, stepId, updates) => {
      set((state) => {
        const next = state.workflows.map((wf) => {
          if (wf.id !== wfId) return wf;
          const groups = (wf.groups || []).map((g) => ({
            ...g,
            steps: g.steps.map((st) => (st.id === stepId ? { ...st, ...updates } : st))
          }));
          return {
            ...wf,
            groups,
            steps: groups.length > 0
              ? groups.flatMap((g) => g.steps)
              : wf.steps.map((st) => (st.id === stepId ? { ...st, ...updates } : st)),
            updatedAt: Date.now()
          };
        });
        persistCurrentState({ workflows: next });
        return { workflows: next };
      });
    },

    deleteStep: (wfId, stepId) => {
      set((state) => {
        const next = state.workflows.map((wf) => {
          if (wf.id !== wfId) return wf;
          return {
            ...wf,
            steps: wf.steps.filter((st) => st.id !== stepId),
            updatedAt: Date.now()
          };
        });
        persistCurrentState({ workflows: next });
        return { workflows: next };
      });
    },

    reorderStep: (wfId, sourceId, targetId, after) => {
      set((state) => {
        const next = state.workflows.map((wf) => {
          if (wf.id !== wfId) return wf;
          const steps = [...wf.steps];
          const from = steps.findIndex((s) => s.id === sourceId);
          const target = steps.findIndex((s) => s.id === targetId);
          if (from < 0 || target < 0 || from === target) return wf;
          const [item] = steps.splice(from, 1);
          let insert = target + (after ? 1 : 0);
          if (from < insert) insert -= 1;
          insert = Math.max(0, Math.min(steps.length, insert));
          steps.splice(insert, 0, item);
          return { ...wf, steps, updatedAt: Date.now() };
        });
        persistCurrentState({ workflows: next });
        return { workflows: next };
      });
    },

    reorderSteps: (wfId, oldIndex, newIndex) => {
      set((state) => {
        const next = state.workflows.map((wf) => {
          if (wf.id !== wfId) return wf;
          return {
            ...wf,
            steps: arrayMove(wf.steps, oldIndex, newIndex),
            updatedAt: Date.now()
          };
        });
        persistCurrentState({ workflows: next });
        return { workflows: next };
      });
    },

    createSkill: (skillData) => {
      const now = Date.now();
      let result: Skill | undefined;

      set((state) => {
        const existingIdx = state.skills.findIndex(
          (s) => s.name.toLowerCase() === skillData.name.toLowerCase()
        );

        if (existingIdx >= 0) {
          const existing = state.skills[existingIdx];
          const updated: Skill = {
            ...existing,
            ...skillData,
            id: existing.id,
            files: (skillData.files && skillData.files.length > 0) ? skillData.files : existing.files,
            updatedAt: now
          };
          const next = [...state.skills];
          next[existingIdx] = updated;
          result = updated;
          persistCurrentState({ skills: next });
          return { skills: next };
        }

        const canonicalId = `skill-${skillData.name.toLowerCase().replace(/[^a-z0-9_-]+/g, '-')}`;
        const baseSkill: Skill = {
          ...skillData,
          id: canonicalId,
          createdAt: skillData.createdAt || now,
          updatedAt: skillData.updatedAt || now
        };
        const newSkill: Skill = {
          ...baseSkill,
          files: skillData.files || getSkillFiles(baseSkill)
        };
        result = newSkill;
        const next = [...state.skills, newSkill];
        persistCurrentState({ skills: next });
        return { skills: next };
      });

      return result!;
    },

    syncSkills: (diskSkills) => {
      set((state) => {
        const seenNames = new Set<string>();
        const uniqueDiskSkills: Skill[] = [];

        for (const s of diskSkills) {
          const lower = s.name.toLowerCase();
          if (!seenNames.has(lower)) {
            seenNames.add(lower);
            uniqueDiskSkills.push({
              ...s,
              id: s.id || `skill-${lower.replace(/[^a-z0-9_-]+/g, '-')}`
            });
          }
        }

        persistCurrentState({ skills: uniqueDiskSkills });
        return { skills: uniqueDiskSkills };
      });
    },

    updateSkill: (id, updates) => {
      set((state) => {
        const next = state.skills.map((s) => (s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s));
        persistCurrentState({ skills: next });
        return { skills: next };
      });
    },

    deleteSkill: (id) => {
      const current = get();
      const targetSkill = current.skills.find((s) => s.id === id);

      // Preserve workflow steps intact; snapshot metadata so missing step card can offer 1-click reinstall
      let affectedWorkflowsCount = 0;
      const nextWorkflows = current.workflows.map((wf) => {
        const matchesSkill = (s: Step) =>
          s.skillId === id ||
          (targetSkill && (
            (s.skillName && s.skillName.toLowerCase() === targetSkill.name.toLowerCase()) ||
            (s.skillId.startsWith('skill-') && s.skillId.replace(/^skill-/, '').toLowerCase() === targetSkill.name.toLowerCase()) ||
            s.skillId.toLowerCase() === targetSkill.name.toLowerCase()
          ));

        const hasSkillInSteps = wf.steps.some(matchesSkill);
        const hasSkillInGroups = (wf.groups || []).some((g) => g.steps.some(matchesSkill));

        if (hasSkillInSteps || hasSkillInGroups) {
          affectedWorkflowsCount += 1;
          const snapshotStep = (st: Step): Step => {
            if (matchesSkill(st)) {
              return {
                ...st,
                skillName: st.skillName || targetSkill?.name,
                skillSource: st.skillSource || targetSkill?.source
              };
            }
            return st;
          };

          const groups = (wf.groups || []).map((g) => ({
            ...g,
            steps: g.steps.map(snapshotStep)
          }));

          return {
            ...wf,
            groups,
            steps: groups.length > 0 ? groups.flatMap((g) => g.steps) : wf.steps.map(snapshotStep),
            updatedAt: Date.now()
          };
        }
        return wf;
      });

      const nextSkills = current.skills.filter((s) => s.id !== id);
      set({ skills: nextSkills, workflows: nextWorkflows });
      persistCurrentState({ skills: nextSkills, workflows: nextWorkflows });
      return { affectedWorkflowsCount };
    },

    getSkillUsageCount: (skillId) => {
      return get().workflows.reduce((acc, wf) => {
        const inSteps = wf.steps.filter((s) => s.skillId === skillId).length;
        if (inSteps > 0) return acc + inSteps;
        const inGroups = (wf.groups || []).reduce(
          (gAcc, g) => gAcc + g.steps.filter((s) => s.skillId === skillId).length,
          0
        );
        return acc + inGroups;
      }, 0);
    },

    reorderSkills: (oldIndex, newIndex) => {
      set((state) => {
        const next = arrayMove(state.skills, oldIndex, newIndex);
        persistCurrentState({ skills: next });
        return { skills: next };
      });
    },

    startRun: (wfId, harnessId, projectId, sessionId) => {
      const state = get();
      const wf = state.workflows.find((w) => w.id === wfId);
      if (!wf || wf.steps.length === 0) return null;

      // Stop any already running run or attach
      const selectedHarness = harnessId || state.defaultHarness;
      const targetProjectId = projectId ?? state.activeProjectId ?? undefined;
      const targetSessionId = sessionId ?? state.activeSessionId ?? undefined;
      const now = Date.now();

      // Snapshot steps per ADR 0001, ADR 0002 & ADR 0089: Flow/Group-level Gate Checkpoints
      // If a group has gate: true, the LAST step in that group triggers the gate checkpoint
      // after executing its skills before continuing to the subsequent group.
      const groups = (wf.groups && wf.groups.length > 0)
        ? wf.groups
        : [{ id: 'default', name: 'Main', gate: false, steps: wf.steps }];

      const stepsSnapshot: RunStep[] = [];
      for (const group of groups) {
        group.steps.forEach((s, sIdx) => {
          const isGated = !!group.gate && sIdx === group.steps.length - 1;
          const skill = state.skills.find((sk) => sk.id === s.skillId);
          stepsSnapshot.push({
            id: uid('rst'),
            stepId: s.id,
            skillId: s.skillId,
            name: skill ? skill.name : (s.skillName || 'Unknown skill'),
            groupId: group.id,
            groupName: group.name,
            gate: isGated,
            instructions: s.instructions || '',
            status: 'pending' as const,
            activities: [],
            startedAt: null,
            endedAt: null
          });
        });
      }

      const run: Run = {
        id: uid('run'),
        projectId: targetProjectId,
        sessionId: targetSessionId,
        workflowId: wf.id,
        workflowName: wf.name,
        harnessId: selectedHarness,
        status: 'running',
        startedAt: now,
        endedAt: null,
        pausedMs: 0,
        pausedAt: null,
        currentStep: 0,
        speed: state.simSpeed || 1,
        steps: stepsSnapshot
      };

      const nextRuns = [run, ...state.runs].slice(0, 50);
      let nextSessions = state.sessions;
      if (targetSessionId) {
        nextSessions = state.sessions.map((sess) =>
          sess.id === targetSessionId
            ? { ...sess, runIds: [run.id, ...sess.runIds], updatedAt: Date.now() }
            : sess
        );
      }

      set({ runs: nextRuns, sessions: nextSessions });
      persistCurrentState({ runs: nextRuns, sessions: nextSessions });

      simulationEngine.attachRun(run);
      return run;
    },

    deleteRun: (runId) => {
      set((state) => {
        const next = state.runs.filter((r) => r.id !== runId);
        persistCurrentState({ runs: next });
        return { runs: next };
      });
    },

    pauseRun: () => simulationEngine.pause(),
    resumeRun: () => simulationEngine.resume(),
    stopRun: () => simulationEngine.stop(),
    approveGate: () => simulationEngine.approveGate(),
    rejectGate: () => simulationEngine.rejectGate(),
    reviseGate: (feedback) => simulationEngine.reviseGate(feedback),
    cycleRunSpeed: () => {
      const current = get();
      const active = current.runs.find((r) => ['running', 'waiting', 'paused'].includes(r.status));
      if (!active) return;
      const nextSpeed = active.speed === 1 ? 2 : active.speed === 2 ? 4 : 1;
      simulationEngine.setSpeed(nextSpeed);
    }
  };
});
