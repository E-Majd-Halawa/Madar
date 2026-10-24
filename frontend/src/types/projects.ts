export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';

export interface ProjectFile {
  id: string;
  projectId: string;
  name: string;
  size: number;
  type: 'document' | 'design' | 'image' | 'archive' | 'code' | 'other';
  extension: string;
  uploadedBy: string;
  uploadedAt: string;
  url?: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  status: ProjectStatus;
  color: string;
  ownerId: string;
  memberIds: string[];
  startDate: string;
  dueDate: string | null;
  createdAt: string;
}

