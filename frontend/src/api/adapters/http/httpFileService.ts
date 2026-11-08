import type { FileFilter, FileType, StorageUsage, WorkspaceFile } from '@/types';

export interface FileBlobResult {
  blob: Blob;
  contentType: string;
}
import { http, HttpError } from './httpClient';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const BLOCKED_EXTENSIONS = ['.html', '.htm', '.svg', '.js', '.mjs', '.cjs', '.exe', '.bat', '.cmd', '.sh'];
const BLOCKED_MIMES = ['text/html', 'image/svg+xml', 'application/javascript', 'text/javascript', 'application/x-msdownload'];

export interface HttpPresignResponse {
  uploadUrl: string;
  token: string;
  storageKey: string;
  expiresAt: string;
}

export interface HttpFileResponse {
  id: string;
  workspaceId: string;
  projectId?: string | null;
  projectName?: string;
  folder: string;
  name: string;
  size: number;
  type: FileType;
  extension: string;
  uploadedBy: string;
  uploadedAt: string;
  url?: string;
  downloadsCount: number;
  description?: string;
}

export function toWorkspaceFile(file: HttpFileResponse): WorkspaceFile {
  return {
    id: file.id,
    workspaceId: file.workspaceId,
    projectId: file.projectId,
    projectName: file.projectName,
    folder: file.folder,
    name: file.name,
    size: file.size,
    type: file.type,
    extension: file.extension,
    uploadedBy: file.uploadedBy,
    uploadedAt: file.uploadedAt,
    url: file.url,
    downloadsCount: file.downloadsCount,
    description: file.description,
  };
}

export function mapFileError(error: unknown, fallbackKey = 'files.errors.uploadFailed'): HttpError {
  if (error instanceof HttpError) {
    const key =
      error.status === 413
        ? error.code === 'quota_exceeded'
          ? 'files.errors.quotaExceeded'
          : 'files.errors.fileTooLarge'
        : error.status === 401
          ? 'files.errors.unauthorized'
          : error.status === 403
            ? 'files.errors.forbidden'
            : error.code === 'blocked_file_type'
              ? 'files.errors.blockedType'
              : error.status === 0
                ? 'files.errors.network'
                : fallbackKey;
    return new HttpError(error.status, key, error.code, error.fieldErrors);
  }
  if (error instanceof TypeError) {
    return new HttpError(0, 'files.errors.network');
  }
  return new HttpError(0, fallbackKey);
}

function validateClientFile(file: File): void {
  const ext = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`;
  if (file.size > MAX_UPLOAD_BYTES) {
    throw mapFileError(new HttpError(413, 'File size exceeds maximum allowed upload size of 5MB', 'payload_too_large'));
  }
  if (BLOCKED_EXTENSIONS.includes(ext) || BLOCKED_MIMES.includes(file.type.toLowerCase())) {
    throw mapFileError(new HttpError(400, 'File type or extension is blocked for security reasons', 'blocked_file_type'));
  }
}

async function sha256File(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function uploadWithProgress(url: string, file: File, mime: string, onProgress?: (percent: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url, true);
    xhr.setRequestHeader('Content-Type', mime);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      let message = xhr.statusText || 'Upload failed';
      let code: string | undefined;
      try {
        const data = JSON.parse(xhr.responseText);
        message = data?.message || message;
        code = data?.code;
      } catch {
        // ignore non-JSON responses
      }
      reject(mapFileError(new HttpError(xhr.status, message, code)));
    };
    xhr.onerror = () => reject(mapFileError(new HttpError(0, 'Network error while uploading file')));
    xhr.send(file);
  });
}

async function authenticatedFetch(path: string, signal?: AbortSignal): Promise<Response> {
  const session = useAuthStore.getState().session;
  let token = session?.tokens?.accessToken ?? null;

  const send = (accessToken: string | null) =>
    fetch(`${BASE_URL}${path}`, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      signal,
    });

  let response = await send(token);
  if (response.status === 401) {
    const refreshToken = session?.tokens?.refreshToken;
    if (refreshToken) {
      try {
        const tokens = await authService.refresh(refreshToken);
        if (tokens?.accessToken) {
          const currentSession = useAuthStore.getState().session;
          if (currentSession) {
            useAuthStore.setState({
              session: {
                ...currentSession,
                tokens,
              },
            });
          }
          token = tokens.accessToken;
          response = await send(token);
        }
      } catch {
        await useAuthStore.getState().logout();
      }
    }
  }

  return response;
}

export const httpFileService = {
  async list(workspaceId: string, filter?: FileFilter): Promise<WorkspaceFile[]> {
    try {
      const files = await http<HttpFileResponse[]>(
        `/workspaces/${workspaceId}/files${(() => {
          const params = new URLSearchParams();
          if (filter?.search?.trim()) params.set('search', filter.search.trim());
          if (filter?.folder && filter.folder !== 'all') params.set('folder', filter.folder);
          if (filter?.type && filter.type !== 'all') params.set('type', filter.type);
          if (filter?.projectId && filter.projectId !== 'all') params.set('projectId', filter.projectId);
          const query = params.toString();
          return query ? `?${query}` : '';
        })()}`,
      );
      return files.map(toWorkspaceFile);
    } catch (error) {
      throw mapFileError(error);
    }
  },

  async upload(input: any, onProgress?: (percent: number) => void): Promise<WorkspaceFile> {
    const file = input.file as File | undefined;
    if (!file) {
      throw mapFileError(new HttpError(400, 'No file selected', 'validation_error'));
    }
    validateClientFile(file);

    const workspaceId = input.workspaceId as string;
    let presign: HttpPresignResponse;
    try {
      presign = await http<HttpPresignResponse>(`/workspaces/${workspaceId}/files/presign`, {
        method: 'POST',
        body: JSON.stringify({
          name: input.name,
          size: file.size,
          type: input.type,
          mime: file.type || 'application/octet-stream',
          projectId: input.projectId ?? null,
          folder: input.folder ?? 'General',
          description: input.description,
        }),
      });
    } catch (error) {
      throw mapFileError(error);
    }

    const uploadUrl = new URL(presign.uploadUrl, new URL(BASE_URL).origin).toString();
    try {
      await uploadWithProgress(
        uploadUrl,
        file,
        file.type || 'application/octet-stream',
        onProgress,
      );
    } catch (error) {
      throw mapFileError(error);
    }

    const checksum = await sha256File(file);
    let created: HttpFileResponse;
    try {
      created = await http<HttpFileResponse>(`/workspaces/${workspaceId}/files`, {
        method: 'POST',
        body: JSON.stringify({
          storageKey: presign.storageKey,
          name: input.name,
          size: file.size,
          type: input.type,
          mime: file.type || 'application/octet-stream',
          projectId: input.projectId ?? null,
          folder: input.folder ?? 'General',
          description: input.description,
          checksum,
        }),
      });
    } catch (error) {
      throw mapFileError(error);
    }

    return toWorkspaceFile(created);
  },

  async delete(id: string): Promise<void> {
    try {
      await http<void>(`/files/${id}`, { method: 'DELETE' });
    } catch (error) {
      throw mapFileError(error, 'files.errors.deleteFailed');
    }
  },

  async getStorageUsage(workspaceId: string): Promise<StorageUsage> {
    try {
      return await http<StorageUsage>(`/workspaces/${workspaceId}/files/storage`);
    } catch (error) {
      throw mapFileError(error);
    }
  },

  async fetchFileBlob(id: string, signal?: AbortSignal): Promise<FileBlobResult> {
    try {
      const response = await authenticatedFetch(`/files/${id}/download`, signal);
      if (!response.ok) {
        let message = response.statusText || 'Download failed';
        let code: string | undefined;
        try {
          const data = await response.json();
          message = data?.message || message;
          code = data?.code;
        } catch {
          // ignore non-JSON responses
        }
        throw mapFileError(new HttpError(response.status, message, code));
      }
      const blob = await response.blob();
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      return { blob, contentType };
    } catch (error) {
      throw mapFileError(error);
    }
  },

  async download(id: string, fileName = 'download'): Promise<void> {
    try {
      const response = await authenticatedFetch(`/files/${id}/download`);
      if (!response.ok) {
        let message = response.statusText || 'Download failed';
        let code: string | undefined;
        try {
          const data = await response.json();
          message = data?.message || message;
          code = data?.code;
        } catch {
          // ignore non-JSON responses
        }
        throw mapFileError(new HttpError(response.status, message, code));
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      throw mapFileError(error);
    }
  },
};