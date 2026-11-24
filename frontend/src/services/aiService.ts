import type { AiService } from '@/api/contracts/ai';
import { mockAiService } from '@/api/mock/mockAiService';
import { useMocks } from '@/services/serviceMode';
import { unimplementedService } from '@/services/unimplementedService';

// Swap point: replace mockAiService with OpenAI/Claude backend integration when configured.
export const aiService: AiService = useMocks() ? mockAiService : unimplementedService<AiService>('aiService');
