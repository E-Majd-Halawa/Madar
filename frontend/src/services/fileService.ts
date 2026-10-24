import type { FileService } from '@/api/contracts';
import { mockFileService } from '@/api/mock/mockFileService';

// Swap point: export a REST adapter built on '@/api/adapters/http/httpClient' when VITE_API_URL is set.
export const fileService: FileService = mockFileService;
