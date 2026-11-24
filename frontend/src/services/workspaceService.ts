import type { WorkspaceService } from '@/api/contracts';
import { mockWorkspaceService } from '@/api/mock/mockWorkspaceService';
import { httpWorkspaceService } from '@/api/adapters/http/httpWorkspaceService';
import { useMocks } from '@/services/serviceMode';

export const workspaceService: WorkspaceService = useMocks()
  ? mockWorkspaceService
  : httpWorkspaceService;
