import type { ProjectService } from '@/api/contracts';
import { mockProjectService } from '@/api/mock/mockProjectService';
import { httpProjectService } from '@/api/adapters/http/httpProjectService';

export const projectService: ProjectService =
  import.meta.env.VITE_API_URL ? httpProjectService : mockProjectService;
