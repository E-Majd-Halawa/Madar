import { mockChatService } from '@/api/mock/mockChatService';
import { useMocks } from '@/services/serviceMode';
import { unimplementedService } from '@/services/unimplementedService';

export const chatService = useMocks() ? mockChatService : unimplementedService('chatService');
