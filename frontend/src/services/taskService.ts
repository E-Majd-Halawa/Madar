import type { TaskService } from '@/api/contracts';
import { mockTaskService } from '@/api/mock/mockTaskService';
import { httpTaskService } from '@/api/adapters/http/httpTaskService';

export const taskService: TaskService =
  import.meta.env.VITE_API_URL ? httpTaskService : mockTaskService;
