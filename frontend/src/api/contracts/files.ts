import type { FileFilter, StorageUsage, WorkspaceFile } from '@/types';

/** GET /workspaces/:id/files  ·  POST /workspaces/:id/files  ·  DELETE /files/:id */
export interface FileService {
  list(workspaceId: string, filter?: FileFilter): Promise<WorkspaceFile[]>;
  upload(file: Omit<WorkspaceFile, 'id' | 'uploadedAt' | 'downloadsCount'>): Promise<WorkspaceFile>;
  delete(id: string): Promise<void>;
  getStorageUsage(workspaceId: string): Promise<StorageUsage>;
}
