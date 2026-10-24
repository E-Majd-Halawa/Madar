import type { WorkspaceService } from '@/api/contracts';
import { mockWorkspaceService } from '@/api/mock/mockWorkspaceService';

// Swap point: when VITE_API_URL is set, export a REST adapter built on
// '@/api/adapters/http/httpClient' instead. UI code never changes.
export const workspaceService: WorkspaceService = mockWorkspaceService;
