import type { FileService } from '@/api/contracts';
import { mockFileService } from '@/api/mock/mockFileService';
import { httpFileService } from '@/api/adapters/http/httpFileService';

// Swap point: use the REST adapter when VITE_API_URL is set, otherwise mock.
export const fileService: FileService =
  import.meta.env.VITE_API_URL ? httpFileService : mockFileService;

// Exposes download through the service seam for both adapters. In mock mode the
// caller keeps the previous toast-only behavior.
export async function downloadFile(id: string, fileName?: string): Promise<void> {
  if (import.meta.env.VITE_API_URL) {
    await httpFileService.download(id, fileName ?? 'download');
  }
}

// Exposes a raw authenticated blob for preview. The mock adapter intentionally
// returns null so the modal keeps the file-type icon.
export async function fetchFileBlob(id: string, signal?: AbortSignal): Promise<{ blob: Blob; contentType: string } | null> {
  if (!import.meta.env.VITE_API_URL) return null;
  return httpFileService.fetchFileBlob(id, signal);
}
