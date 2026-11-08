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
  uploadFile: (
    file: Omit<WorkspaceFile, 'id' | 'uploadedAt' | 'downloadsCount'> & { file?: File },
    workspaceId: string,
    onProgress?: (percent: number) => void,
  ) => Promise<WorkspaceFile>;
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

  uploadFile: async (fileData, workspaceId, onProgress) => {
    const upload = fileService.upload as (
      input: typeof fileData,
      progress?: (percent: number) => void,
    ) => Promise<WorkspaceFile>;
    const created = await upload(fileData, onProgress);
    await get().load(workspaceId);
    return created;
  },

  deleteFile: async (id, workspaceId) => {
    await fileService.delete(id);
    set((state) => ({
      files: state.files.filter((f) => f.id !== id),
      previewFile: state.previewFile?.id === id ? null : state.previewFile,
    }));
    try {
      await get().load(workspaceId);
    } catch {
      // ignore reload failures
    }
  },

  setActiveFolder: (activeFolder) => set({ activeFolder }),
  setSelectedType: (selectedType) => set({ selectedType }),
  setSelectedProject: (selectedProject) => set({ selectedProject }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setPreviewFile: (previewFile) => set({ previewFile }),
  setIsUploadOpen: (isUploadOpen) => set({ isUploadOpen }),
}));
