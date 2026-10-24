import { create } from 'zustand';
import { activityService } from '@/services/activityService';
import { projectService } from '@/services/projectService';
import type { Project, ProjectFile } from '@/types';

const INITIAL_PROJECT_FILES: Record<string, ProjectFile[]> = {
  'p-101': [
    {
      id: 'f-1',
      projectId: 'p-101',
      name: 'API-Specification-v2.pdf',
      size: 2_450_000,
      type: 'document',
      extension: 'pdf',
      uploadedBy: 'u-002',
      uploadedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: 'f-2',
      projectId: 'p-101',
      name: 'database-schema-diagram.png',
      size: 1_120_000,
      type: 'image',
      extension: 'png',
      uploadedBy: 'u-001',
      uploadedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 'f-3',
      projectId: 'p-101',
      name: 'auth-tokens-benchmark.json',
      size: 48_000,
      type: 'code',
      extension: 'json',
      uploadedBy: 'u-004',
      uploadedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
  ],
  'p-102': [
    {
      id: 'f-4',
      projectId: 'p-102',
      name: 'Component-Library-Audit.pdf',
      size: 3_800_000,
      type: 'document',
      extension: 'pdf',
      uploadedBy: 'u-002',
      uploadedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    },
    {
      id: 'f-5',
      projectId: 'p-102',
      name: 'TaskFlow-Web-Wireframes.fig',
      size: 12_500_000,
      type: 'design',
      extension: 'fig',
      uploadedBy: 'u-010',
      uploadedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
  ],
  'p-103': [
    {
      id: 'f-6',
      projectId: 'p-103',
      name: 'Design-Tokens-Matrix.json',
      size: 35_000,
      type: 'code',
      extension: 'json',
      uploadedBy: 'u-010',
      uploadedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    },
    {
      id: 'f-7',
      projectId: 'p-103',
      name: 'Design-System-Styleguide.pdf',
      size: 8_200_000,
      type: 'document',
      extension: 'pdf',
      uploadedBy: 'u-012',
      uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ],
};

interface ProjectState {
  projects: Project[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  selectedProject: Project | null;
  filesByProjectId: Record<string, ProjectFile[]>;
  load: (workspaceId: string) => Promise<void>;
  create: (input: Omit<Project, 'id' | 'createdAt'>, actorId: string) => Promise<Project | null>;
  update: (id: string, patch: Partial<Project>, actorId?: string) => Promise<Project | null>;
  remove: (id: string, actorId?: string) => Promise<boolean>;
  setSelectedProject: (project: Project | null) => void;
  getProject: (id: string) => Project | undefined;
  addFile: (file: ProjectFile) => void;
  removeFile: (projectId: string, fileId: string) => void;
  reset: () => void;
}

export const useProjectStore = create<ProjectState>()((set, get) => ({
  projects: [],
  status: 'idle',
  selectedProject: null,
  filesByProjectId: INITIAL_PROJECT_FILES,

  load: async (workspaceId) => {
    set({ status: 'loading' });
    try {
      const projects = await projectService.listByWorkspace(workspaceId);
      set({ projects, status: 'ready' });
    } catch {
      set({ status: 'error' });
    }
  },

  create: async (input, actorId) => {
    try {
      const project = await projectService.create(input);
      set((s) => ({ projects: [project, ...s.projects] }));
      void activityService.record({
        workspaceId: project.workspaceId,
        actorId,
        action: 'project_created',
        targetType: 'project',
        targetName: project.name,
        metadata: { projectId: project.id },
      });
      return project;
    } catch {
      return null;
    }
  },

  update: async (id, patch, actorId) => {
    const before = get().projects;
    const current = before.find((p) => p.id === id);
    if (!current) return null;

    const optimistic = { ...current, ...patch };
    set({
      projects: before.map((p) => (p.id === id ? optimistic : p)),
      selectedProject: get().selectedProject?.id === id ? optimistic : get().selectedProject,
    });

    try {
      const updated = await projectService.update(id, patch);
      if (actorId) {
        void activityService.record({
          workspaceId: updated.workspaceId,
          actorId,
          action: 'settings_changed',
          targetType: 'project',
          targetName: updated.name,
          metadata: { projectId: updated.id },
        });
      }
      return updated;
    } catch {
      set({ projects: before });
      return null;
    }
  },

  remove: async (id, actorId) => {
    const before = get().projects;
    const target = before.find((p) => p.id === id);
    if (!target) return false;

    set({
      projects: before.filter((p) => p.id !== id),
      selectedProject: get().selectedProject?.id === id ? null : get().selectedProject,
    });

    try {
      await projectService.remove(id);
      if (actorId) {
        void activityService.record({
          workspaceId: target.workspaceId,
          actorId,
          action: 'settings_changed',
          targetType: 'project',
          targetName: target.name,
          metadata: { projectId: target.id, deleted: 'true' },
        });
      }
      return true;
    } catch {
      set({ projects: before });
      return false;
    }
  },

  setSelectedProject: (selectedProject) => set({ selectedProject }),

  getProject: (id) => get().projects.find((p) => p.id === id),

  addFile: (file) => {
    set((s) => {
      const list = s.filesByProjectId[file.projectId] || [];
      return {
        filesByProjectId: {
          ...s.filesByProjectId,
          [file.projectId]: [file, ...list],
        },
      };
    });
  },

  removeFile: (projectId, fileId) => {
    set((s) => {
      const list = s.filesByProjectId[projectId] || [];
      return {
        filesByProjectId: {
          ...s.filesByProjectId,
          [projectId]: list.filter((f) => f.id !== fileId),
        },
      };
    });
  },

  reset: () => set({ projects: [], status: 'idle', selectedProject: null }),
}));
