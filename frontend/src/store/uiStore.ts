import { create } from 'zustand';

import type { Project } from '@/types';

interface UiState {
  taskModalOpen: boolean;
  projectModalOpen: boolean;
  editingProject: Project | null;
  mobileMenuOpen: boolean;
  activeTaskId: string | null;
  commandPaletteOpen: boolean;
  setTaskModal: (open: boolean) => void;
  setProjectModal: (open: boolean, project?: Project | null) => void;
  setMobileMenu: (open: boolean) => void;
  setActiveTaskId: (id: string | null) => void;
  setCommandPalette: (open: boolean) => void;
}

/** Ephemeral UI state shared across the shell (never persisted). */
export const useUiStore = create<UiState>()((set) => ({
  taskModalOpen: false,
  projectModalOpen: false,
  editingProject: null,
  mobileMenuOpen: false,
  activeTaskId: null,
  commandPaletteOpen: false,
  setTaskModal: (taskModalOpen) => set({ taskModalOpen }),
  setProjectModal: (projectModalOpen, editingProject = null) => set({ projectModalOpen, editingProject }),
  setMobileMenu: (mobileMenuOpen) => set({ mobileMenuOpen }),
  setActiveTaskId: (activeTaskId) => set({ activeTaskId }),
  setCommandPalette: (commandPaletteOpen) => set({ commandPaletteOpen }),
}));


