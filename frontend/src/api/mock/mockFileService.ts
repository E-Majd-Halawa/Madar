import type { FileService } from '@/api/contracts';
import { SEED_WORKSPACE_FILES } from '@/data/files';
import type { FileFilter, FileType, StorageUsage, WorkspaceFile } from '@/types';
import { createCollection, newId } from './collection';
import { delay } from './delay';

const table = createCollection<WorkspaceFile>('mock.files', SEED_WORKSPACE_FILES);

export const mockFileService: FileService = {
  async list(workspaceId: string, filter?: FileFilter) {
    await delay(160);
    let items = table.read().filter((f) => f.workspaceId === workspaceId);

    if (filter?.folder && filter.folder !== 'all') {
      items = items.filter((f) => f.folder === filter.folder);
    }
    if (filter?.type && filter.type !== 'all') {
      items = items.filter((f) => f.type === filter.type);
    }
    if (filter?.projectId && filter.projectId !== 'all') {
      items = items.filter((f) => f.projectId === filter.projectId);
    }
    if (filter?.search?.trim()) {
      const q = filter.search.toLowerCase().trim();
      items = items.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.description?.toLowerCase().includes(q) ||
          f.extension.toLowerCase().includes(q) ||
          f.folder.toLowerCase().includes(q) ||
          f.projectName?.toLowerCase().includes(q),
      );
    }

    return items.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  },

  async upload(input) {
    await delay(200);
    const file: WorkspaceFile = {
      ...input,
      id: newId('file'),
      uploadedAt: new Date().toISOString(),
      downloadsCount: 0,
    };
    table.write([file, ...table.read()]);
    return file;
  },

  async delete(id: string) {
    await delay(120);
    table.write(table.read().filter((f) => f.id !== id));
  },

  async getStorageUsage(workspaceId: string): Promise<StorageUsage> {
    await delay(80);
    const files = table.read().filter((f) => f.workspaceId === workspaceId);
    const usedBytes = files.reduce((acc, f) => acc + f.size, 0);
    // 10 GB quota
    const quotaBytes = 10 * 1024 * 1024 * 1024;
    const byType: Record<FileType, number> = {
      document: 0,
      design: 0,
      image: 0,
      archive: 0,
      code: 0,
      other: 0,
    };
    files.forEach((f) => {
      byType[f.type] = (byType[f.type] || 0) + f.size;
    });

    return { usedBytes, quotaBytes, byType };
  },
};
