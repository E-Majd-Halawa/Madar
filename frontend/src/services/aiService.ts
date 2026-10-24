import type { AiService } from '@/api/contracts/ai';
import { mockAiService } from '@/api/mock/mockAiService';

// Swap point: replace mockAiService with OpenAI/Claude backend integration when configured.
export const aiService: AiService = mockAiService;
