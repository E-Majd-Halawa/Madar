import type { ProjectService } from '@/api/contracts';
import { mockProjectService } from '@/api/mock/mockProjectService';

// Swap point: export a REST adapter built on '@/api/adapters/http/httpClient' when VITE_API_URL is set.
export const projectService: ProjectService = mockProjectService;
