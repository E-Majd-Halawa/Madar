import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { createHash } from 'node:crypto';
import type { FileObjectMeta } from './file-storage.interface.js';

@Injectable()
export class LocalDiskStorageService {
  private uploadDir = path.resolve(process.cwd(), 'storage');

  private async ensureDir() {
    await fs.mkdir(this.uploadDir, { recursive: true });
  }

  private getFullPath(storageKey: string): string {
    const safeKey = path.basename(storageKey);
    return path.join(this.uploadDir, safeKey);
  }

  async presign(
    storageKey: string,
    _mime: string,
    _maxBytes: number,
    token: string,
  ) {
    await this.ensureDir();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const uploadUrl = `/api/v1/files/upload/${token}`;
    return { uploadUrl, expiresAt };
  }

  async uploadBuffer(
    storageKey: string,
    buffer: Buffer,
    _mime: string,
  ): Promise<void> {
    await this.ensureDir();
    const filePath = this.getFullPath(storageKey);
    await fs.writeFile(filePath, buffer);
  }

  async head(storageKey: string): Promise<FileObjectMeta | null> {
    try {
      const filePath = this.getFullPath(storageKey);
      const stat = await fs.stat(filePath);
      const data = await fs.readFile(filePath);
      const checksum = createHash('sha256').update(data).digest('hex');
      return {
        size: stat.size,
        mime: 'application/octet-stream',
        checksum,
      };
    } catch {
      return null;
    }
  }

  async delete(storageKey: string): Promise<void> {
    try {
      const filePath = this.getFullPath(storageKey);
      await fs.unlink(filePath);
    } catch {
      // ignore
    }
  }

  async getDownloadUrl(storageKey: string): Promise<string> {
    return `/api/v1/files/download/${storageKey}`;
  }

  async getBuffer(storageKey: string): Promise<Buffer> {
    const filePath = this.getFullPath(storageKey);
    return await fs.readFile(filePath);
  }
}
