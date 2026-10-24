import type { AiPlanResponse } from '@/api/contracts/ai';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  plan?: AiPlanResponse;
  overdueItems?: Array<{ title: string; daysLate: number; why: string }>;
  subtasks?: string[];
  type?: 'plan' | 'overdue' | 'subtasks' | 'fallback';
}

export type OrbMode = 'idle' | 'thinking' | 'answering';
