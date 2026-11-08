export interface FileObjectMeta {
  size: number;
  mime: string;
  checksum?: string;
}

export interface FileStorage {
  presign(
    storageKey: string,
    mime: string,
    maxBytes: number,
  ): Promise<{ uploadUrl: string; expiresAt: Date }>;
  uploadBuffer(storageKey: string, buffer: Buffer, mime: string): Promise<void>;
  head(storageKey: string): Promise<FileObjectMeta | null>;
  delete(storageKey: string): Promise<void>;
  getDownloadUrl(storageKey: string): Promise<string>;
  getBuffer?(storageKey: string): Promise<Buffer>;
}

export const FILE_STORAGE = Symbol('FILE_STORAGE');
