import { Injectable } from '@nestjs/common';
import type { FileStorage, FileObjectMeta } from './file-storage.interface.js';

@Injectable()
export class S3StorageService implements FileStorage {
  async presign(storageKey: string, _mime: string, _maxBytes: number) {
    return {
      uploadUrl: `https://s3.amazonaws.com/stub-bucket/${storageKey}`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    };
  }

  async uploadBuffer(
    _storageKey: string,
    _buffer: Buffer,
    _mime: string,
  ): Promise<void> {
    // S3 stub
  }

  async head(_storageKey: string): Promise<FileObjectMeta | null> {
    return { size: 0, mime: 'application/octet-stream' };
  }

  async delete(_storageKey: string): Promise<void> {
    // S3 stub
  }

  async getDownloadUrl(_storageKey: string): Promise<string> {
    return `https://s3.amazonaws.com/stub-bucket/${_storageKey}`;
  }
}
