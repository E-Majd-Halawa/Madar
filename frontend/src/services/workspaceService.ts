import type { WorkspaceService } from '@/api/contracts';
import { mockWorkspaceService } from '@/api/mock/mockWorkspaceService';
import { httpWorkspaceService } from '@/api/adapters/http/httpWorkspaceService';

// VITE_API_URL unset keeps the offline mock path; set it to use the backend.
export const workspaceService: WorkspaceService = import.meta.env.VITE_API_URL
  ? httpWorkspaceService
  : mockWorkspaceService;
