import type { SettingsService } from '@/api/contracts';
import { mockSettingsService } from '@/api/mock/mockSettingsService';

// Swap point: export a REST adapter built on '@/api/adapters/http/httpClient' when VITE_API_URL is set.
export const settingsService: SettingsService = mockSettingsService;
