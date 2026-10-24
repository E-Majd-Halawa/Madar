import { create } from 'zustand';
import { fileService } from '@/services/fileService';
import type { FileType, StorageUsage, WorkspaceFile } from '@/types';

interface FileState {
  files: WorkspaceFile[];
  storageUsage: StorageUsage | null;
  loading: boolean;
  activeFolder: string;
  selectedType: FileType | 'all';
  selectedProject: string | 'all';
  searchQuery: string;
  previewFile: WorkspaceFile | null;
  isUploadOpen: boolean;

  load: (workspaceId: string) => Promise<void>;
  uploadFile: (file: Omit<WorkspaceFile, 'id' | 'uploadedAt' | 'downloadsCount'>, workspaceId: string) => Promise<WorkspaceFile>;
  deleteFile: (id: string, workspaceId: string) => Promise<void>;
  setActiveFolder: (folder: string) => void;
  setSelectedType: (type: FileType | 'all') => void;
  setSelectedProject: (projectId: string | 'all') => void;
  setSearchQuery: (query: string) => void;
  setPreviewFile: (file: WorkspaceFile | null) => void;
  setIsUploadOpen: (open: boolean) => void;
}

export const useFileStore = create<FileState>()((set, get) => ({
  files: [],
  storageUsage: null,
  loading: false,
  activeFolder: 'all',
  selectedType: 'all',
  selectedProject: 'all',
  searchQuery: '',
  previewFile: null,
  isUploadOpen: false,

  load: async (workspaceId: string) => {
    set({ loading: true });
    try {
      const { activeFolder, selectedType, selectedProject, searchQuery } = get();
      const [files, storageUsage] = await Promise.all([
        fileService.list(workspaceId, {
          folder: activeFolder,
          type: selectedType,
          projectId: selectedProject,
          search: searchQuery,
        }),
        fileService.getStorageUsage(workspaceId),
      ]);
      set({ files, storageUsage, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  uploadFile: async (fileData, workspaceId) => {
    const created = await fileService.upload(fileData);
    await get().load(workspaceId);
    return created;
  },

  deleteFile: async (id, workspaceId) => {
    await fileService.delete(id);
    await get().load(workspaceId);
    if (get().previewFile?.id === id) {
      set({ previewFile: null });
    }
  },

  setActiveFolder: (activeFolder) => set({ activeFolder }),
  setSelectedType: (selectedType) => set({ selectedType }),
  setSelectedProject: (selectedProject) => set({ selectedProject }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setPreviewFile: (previewFile) => set({ previewFile }),
  setIsUploadOpen: (isUploadOpen) => set({ isUploadOpen }),
}));
