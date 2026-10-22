import { create } from 'zustand';

export type DialogType =
  | 'launch-run'
  | 'add-skill'
  | 'edit-step'
  | 'workflow-form'
  | 'skill-form'
  | 'confirm'
  | 'project-create'
  | 'project-open'
  | 'project-clone'
  | 'session-form';

interface UIStoreState {
  activeRunId: string | null;
  drawerOpen: boolean;
  drawerExpanded: boolean;
  activeDialog: DialogType | null;
  dialogPayload: Record<string, unknown> | null;

  openRunDrawer: (runId: string) => void;
  closeRunDrawer: () => void;
  toggleDrawerExpanded: () => void;
  openDialog: (type: DialogType, payload?: Record<string, unknown> | null) => void;
  closeDialog: () => void;
}

export const useUIStore = create<UIStoreState>((set) => ({
  activeRunId: null,
  drawerOpen: false,
  drawerExpanded: false,
  activeDialog: null,
  dialogPayload: null,

  openRunDrawer: (runId: string) => {
    set({
      activeRunId: runId,
      drawerOpen: true
    });
  },

  closeRunDrawer: () => {
    set({ drawerOpen: false });
  },

  toggleDrawerExpanded: () => {
    set((state) => ({ drawerExpanded: !state.drawerExpanded }));
  },

  openDialog: (type, payload = null) => {
    set({
      activeDialog: type,
      dialogPayload: payload
    });
  },

  closeDialog: () => {
    set({
      activeDialog: null,
      dialogPayload: null
    });
  }
}));
