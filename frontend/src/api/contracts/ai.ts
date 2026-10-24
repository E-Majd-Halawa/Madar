export interface AiPlanItem {
  title: string;
  durationMinutes: number;
  description: string;
  why?: string;
}

export interface OverdueItem {
  title: string;
  daysLate: number;
  why: string;
}

export interface AiPlanResponse {
  summary: string;
  totalMinutes: number;
  items: AiPlanItem[];
  type?: 'plan' | 'overdue' | 'subtasks' | 'fallback';
  overdueItems?: OverdueItem[];
  subtasks?: string[];
  suggestionKeys?: string[];
}

export interface AiPromptContext {
  userId: string;
  workspaceId: string;
  tasksSummary: string;
  allTasks?: Array<{ id: string; title: string; status: string; dueDate?: string | null; estimateMinutes?: number }>;
}

export interface AiService {
  streamPrompt(
    prompt: string,
    context: AiPromptContext,
    onToken?: (token: string) => void
  ): Promise<AiPlanResponse>;
  getHistory(userId: string, workspaceId: string): Array<{ id: string; role: 'user' | 'assistant'; content: string; plan?: AiPlanResponse; type?: string }>;
  saveHistory(userId: string, workspaceId: string, messages: Array<{ id: string; role: 'user' | 'assistant'; content: string; plan?: AiPlanResponse; type?: string }>): void;
  clearHistory(userId: string, workspaceId: string): void;
}
