export type FileType = 'document' | 'design' | 'image' | 'archive' | 'code' | 'other';

export interface WorkspaceFile {
  id: string;
  workspaceId: string;
  projectId?: string | null;
  projectName?: string;
  folder: string;
  name: string;
  size: number; // in bytes
  type: FileType;
  extension: string;
  uploadedBy: string;
  uploadedAt: string;
  url?: string;
  downloadsCount: number;
  description?: string;
}

export interface FileFilter {
  search?: string;
  folder?: string;
  type?: FileType | 'all';
  projectId?: string | 'all';
}

export interface StorageUsage {
  usedBytes: number;
  quotaBytes: number;
  byType: Record<FileType, number>;
}
