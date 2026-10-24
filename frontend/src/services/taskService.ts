import type { TaskService } from '@/api/contracts';
import { mockTaskService } from '@/api/mock/mockTaskService';

// Swap point: export a REST adapter built on '@/api/adapters/http/httpClient' when VITE_API_URL is set.
export const taskService: TaskService = mockTaskService;
