import type { TaskService } from '@/api/contracts';
import { mockTaskService } from '@/api/mock/mockTaskService';
import { useMocks } from '@/services/serviceMode';
import { unimplementedService } from '@/services/unimplementedService';

// Swap point: export a REST adapter built on '@/api/adapters/http/httpClient' when VITE_API_URL is set.
export const taskService: TaskService = useMocks() ? mockTaskService : unimplementedService<TaskService>('taskService');
