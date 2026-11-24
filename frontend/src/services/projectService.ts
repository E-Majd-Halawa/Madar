import type { ProjectService } from '@/api/contracts';
import { mockProjectService } from '@/api/mock/mockProjectService';
import { useMocks } from '@/services/serviceMode';
import { unimplementedService } from '@/services/unimplementedService';

// Swap point: export a REST adapter built on '@/api/adapters/http/httpClient' when VITE_API_URL is set.
export const projectService: ProjectService = useMocks() ? mockProjectService : unimplementedService<ProjectService>('projectService');
