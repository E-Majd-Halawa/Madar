import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.js';
import { PrismaService } from '../../database/prisma.service.js';
import { FILE_STORAGE } from './storage/file-storage.interface.js';
import { DomainEvents } from '../../common/events/domain-events.js';
import * as path from 'node:path';
import { randomBytes } from 'node:crypto';
import { createId } from '@paralleldrive/cuid2';
import type { Request } from 'express';

interface UploadTokenRecord {
  token: string;
  storageKey: string;
  workspaceId: string;
  userId: string;
  maxBytes: number;
  expiresAt: Date;
  used: boolean;
}

@Injectable()
export class FilesService {
  private uploadTokens = new Map<string, UploadTokenRecord>();

  constructor(
    private readonly prisma: PrismaService,
    @Inject(FILE_STORAGE)
    private readonly storage: {
      presign: (
        storageKey: string,
        mime: string,
        maxBytes: number,
        token: string,
      ) => Promise<{ uploadUrl: string; expiresAt: Date }>;
      uploadBuffer: (
        storageKey: string,
        buffer: Buffer,
        mime: string,
      ) => Promise<void>;
      head: (storageKey: string) => Promise<any>;
      delete: (storageKey: string) => Promise<void>;
      getBuffer?: (storageKey: string) => Promise<Buffer>;
    },
    private readonly events: DomainEvents,
    private readonly configService: ConfigService<Env, true>,
  ) {}

  private validateBlockedTypes(name: string, mime: string) {
    const ext = path.extname(name).toLowerCase();
    const blockedExtensions = [
      '.html',
      '.htm',
      '.svg',
      '.js',
      '.mjs',
      '.cjs',
      '.exe',
      '.bat',
      '.cmd',
      '.sh',
    ];
    const blockedMimes = [
      'text/html',
      'image/svg+xml',
      'application/javascript',
      'text/javascript',
      'application/x-msdownload',
    ];

    if (
      blockedExtensions.includes(ext) ||
      blockedMimes.includes(mime.toLowerCase())
    ) {
      throw new BadRequestException({
        code: 'blocked_file_type',
        message: 'File type or extension is blocked for security reasons',
      });
    }
  }

  private sanitizeName(name: string): string {
    const base = path.basename(name);
    let cleaned = '';
    for (const ch of base) {
      if (ch === '\r' || ch === '\n' || ch < ' ' || ch === '\u007f') {
        continue;
      }
      cleaned += ch;
    }
    return cleaned.slice(0, 255) || 'file';
  }

  async ensureWorkspaceAccess(workspaceId: string, userId: string) {
    const ws = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: true },
    });
    if (!ws) {
      throw new NotFoundException({
        code: 'not_found',
        message: 'Workspace not found',
      });
    }
    const member = ws.members.find((m) => m.userId === userId);
    if (!member) {
      throw new NotFoundException({
        code: 'not_found',
        message: 'Workspace not found',
      });
    }
    return { workspace: ws, member };
  }

  async list(
    workspaceId: string,
    userId: string,
    filter?: {
      search?: string;
      folder?: string;
      type?: string;
      projectId?: string;
    },
  ) {
    await this.ensureWorkspaceAccess(workspaceId, userId);

    const where: any = {
      workspaceId,
      deletedAt: null,
    };

    if (filter?.folder && filter.folder !== 'all') {
      where.folder = filter.folder;
    }
    if (filter?.type && filter.type !== 'all') {
      where.type = filter.type;
    }
    if (filter?.projectId && filter.projectId !== 'all') {
      where.projectId = filter.projectId;
    }

    const files = await this.prisma.file.findMany({
      where,
      include: {
        uploadedBy: { select: { fullName: true, username: true } },
        project: { select: { name: true } },
      },
      orderBy: { uploadedAt: 'desc' },
    });

    let result = files.map((f) => ({
      id: f.id,
      workspaceId: f.workspaceId,
      projectId: f.projectId,
      projectName: f.project?.name,
      folder: f.folder,
      name: f.name,
      size: Number(f.sizeBytes),
      type: f.type,
      extension: f.extension,
      uploadedBy: f.uploadedBy.fullName || f.uploadedBy.username,
      uploadedAt: f.uploadedAt.toISOString(),
      url: `/api/v1/files/${f.id}/download`,
      downloadsCount: f.downloadsCount,
      description: f.description || undefined,
    }));

    if (filter?.search?.trim()) {
      const q = filter.search.toLowerCase().trim();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.description?.toLowerCase().includes(q) ||
          f.extension.toLowerCase().includes(q) ||
          f.folder.toLowerCase().includes(q) ||
          f.projectName?.toLowerCase().includes(q),
      );
    }

    return result;
  }

  async getStorageUsage(workspaceId: string, userId: string) {
    await this.ensureWorkspaceAccess(workspaceId, userId);

    const files = await this.prisma.file.findMany({
      where: { workspaceId, deletedAt: null },
    });

    const usedBytes = files.reduce((acc, f) => acc + Number(f.sizeBytes), 0);
    const quotaMb = this.configService.get<number>('WORKSPACE_QUOTA_MB') ?? 100;
    const quotaBytes = quotaMb * 1024 * 1024;

    const byType: Record<string, number> = {
      document: 0,
      design: 0,
      image: 0,
      archive: 0,
      code: 0,
      other: 0,
    };

    files.forEach((f) => {
      byType[f.type] = (byType[f.type] || 0) + Number(f.sizeBytes);
    });

    return {
      usedBytes,
      quotaBytes,
      byType,
    };
  }

  async presign(
    workspaceId: string,
    userId: string,
    dto: {
      name: string;
      size: number;
      type: any;
      mime: string;
      projectId?: string | null;
      folder?: string;
      description?: string;
    },
  ) {
    const { member } = await this.ensureWorkspaceAccess(workspaceId, userId);

    // Guest check: guests cannot upload
    if (member.role === 'guest') {
      throw new ForbiddenException({
        code: 'forbidden',
        message: 'Guests are not allowed to upload files',
      });
    }

    // Size limit check vs MAX_UPLOAD_MB
    const maxUploadMb = this.configService.get<number>('MAX_UPLOAD_MB') ?? 5;
    const maxBytes = maxUploadMb * 1024 * 1024;
    if (dto.size > maxBytes) {
      throw new PayloadTooLargeException({
        code: 'payload_too_large',
        message: `File size exceeds maximum allowed upload size of ${maxUploadMb}MB`,
      });
    }

    this.validateBlockedTypes(dto.name, dto.mime);

    // Quota check
    const files = await this.prisma.file.findMany({
      where: { workspaceId, deletedAt: null },
    });
    const usedBytes = files.reduce((acc, f) => acc + Number(f.sizeBytes), 0);
    const quotaMb = this.configService.get<number>('WORKSPACE_QUOTA_MB') ?? 100;
    const quotaBytes = quotaMb * 1024 * 1024;
    if (usedBytes + dto.size > quotaBytes) {
      throw new PayloadTooLargeException({
        code: 'quota_exceeded',
        message: 'Workspace storage quota exceeded',
      });
    }

    const storageKey = `file_${createId()}`;
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    this.uploadTokens.set(token, {
      token,
      storageKey,
      workspaceId,
      userId,
      maxBytes: dto.size,
      expiresAt,
      used: false,
    });

    const presigned = await this.storage.presign(
      storageKey,
      dto.mime,
      dto.size,
      token,
    );

    return {
      uploadUrl: presigned.uploadUrl,
      token,
      storageKey,
      expiresAt: presigned.expiresAt.toISOString(),
    };
  }

  async uploadViaToken(
    token: string,
    reqOrBuffer: any,
    mime: string = 'application/octet-stream',
  ) {
    const record = this.uploadTokens.get(token);
    if (!record || record.used || record.expiresAt < new Date()) {
      throw new BadRequestException({
        code: 'validation_error',
        message: 'Invalid or expired upload token',
      });
    }

    const req = reqOrBuffer as Request;
    const maxUploadBytes =
      (this.configService.get<number>('MAX_UPLOAD_MB') ?? 5) * 1024 * 1024;
    const maxBytes = Math.min(record.maxBytes, maxUploadBytes);
    const contentLength = req?.headers?.['content-length']
      ? Number(req.headers['content-length'])
      : undefined;
    if (contentLength && contentLength > maxBytes) {
      await this.storage.delete(record.storageKey).catch(() => {});
      throw new PayloadTooLargeException({
        code: 'payload_too_large',
        message: 'Uploaded file size exceeds authorized maximum',
      });
    }

    let buffer: Buffer;
    if (Buffer.isBuffer(reqOrBuffer)) {
      buffer = reqOrBuffer;
    } else if (req && req.body && Buffer.isBuffer(req.body)) {
      buffer = req.body;
    } else if (
      req &&
      req.body &&
      typeof req.body === 'object' &&
      !Buffer.isBuffer(req.body)
    ) {
      buffer = Buffer.from(JSON.stringify(req.body));
    } else if (req && typeof req.on === 'function') {
      const chunks: Buffer[] = [];
      let totalBytes = 0;
      try {
        for await (const chunk of req) {
          const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
          totalBytes += buf.length;
          if (totalBytes > maxBytes) {
            (req as any).destroy?.();
            await this.storage.delete(record.storageKey).catch(() => {});
            throw new PayloadTooLargeException({
              code: 'payload_too_large',
              message: 'Uploaded file size exceeds authorized maximum',
            });
          }
          chunks.push(buf);
        }
        buffer = Buffer.concat(chunks);
      } catch (err) {
        await this.storage.delete(record.storageKey).catch(() => {});
        throw err;
      }
    } else {
      buffer = Buffer.isBuffer(reqOrBuffer)
        ? reqOrBuffer
        : Buffer.from(reqOrBuffer || '');
    }

    if (buffer.length > maxBytes) {
      await this.storage.delete(record.storageKey).catch(() => {});
      throw new PayloadTooLargeException({
        code: 'payload_too_large',
        message: 'Uploaded file size exceeds authorized maximum',
      });
    }

    await this.storage.uploadBuffer(record.storageKey, buffer, mime);
    record.used = true;
    return { success: true, storageKey: record.storageKey };
  }

  async confirm(
    workspaceId: string,
    userId: string,
    dto: {
      storageKey: string;
      name: string;
      size: number;
      type: any;
      mime: string;
      projectId?: string | null;
      folder?: string;
      description?: string;
      checksum?: string;
    },
  ) {
    await this.ensureWorkspaceAccess(workspaceId, userId);

    const tokenRecord = Array.from(this.uploadTokens.values()).find(
      (r) => r.storageKey === dto.storageKey,
    );
    if (
      !tokenRecord ||
      tokenRecord.workspaceId !== workspaceId ||
      tokenRecord.userId !== userId
    ) {
      await this.storage.delete(dto.storageKey).catch(() => {});
      throw new BadRequestException({
        code: 'validation_error',
        message: 'Storage key not issued to this workspace',
      });
    }
    if (!tokenRecord.used) {
      await this.storage.delete(dto.storageKey).catch(() => {});
      throw new BadRequestException({
        code: 'validation_error',
        message: 'File upload not completed via upload token',
      });
    }

    // Verify object exists in storage via head()
    const meta = await this.storage.head(dto.storageKey);
    if (!meta) {
      throw new BadRequestException({
        code: 'validation_error',
        message: 'Uploaded file not found in storage',
      });
    }

    // Verify size match
    if (meta.size !== undefined && Number(meta.size) !== Number(dto.size)) {
      await this.storage.delete(dto.storageKey).catch(() => {});
      throw new BadRequestException({
        code: 'size_mismatch',
        message: 'File size does not match stored object size',
      });
    }

    // Verify checksum if needed
    if (dto.checksum && meta.checksum && dto.checksum !== meta.checksum) {
      await this.storage.delete(dto.storageKey).catch(() => {});
      throw new BadRequestException({
        code: 'checksum_mismatch',
        message: 'File checksum verification failed',
      });
    }

    const sanitizedName = this.sanitizeName(dto.name);
    const extension = path.extname(sanitizedName).replace('.', '');

    // Quota check + transaction insert with Serializable isolation level
    let fileRecord: any;
    try {
      fileRecord = await this.prisma.$transaction(
        async (tx) => {
          const files = await tx.file.findMany({
            where: { workspaceId, deletedAt: null },
          });
          const usedBytes = files.reduce(
            (acc, f) => acc + Number(f.sizeBytes),
            0,
          );
          const quotaMb =
            this.configService.get<number>('WORKSPACE_QUOTA_MB') ?? 100;
          const quotaBytes = quotaMb * 1024 * 1024;
          if (usedBytes + dto.size > quotaBytes) {
            throw new PayloadTooLargeException({
              code: 'quota_exceeded',
              message: 'Workspace storage quota exceeded',
            });
          }

          const created = await tx.file.create({
            data: {
              id: `file_${createId()}`,
              workspaceId,
              projectId: dto.projectId || null,
              folder: dto.folder || 'General',
              name: sanitizedName,
              extension,
              sizeBytes: BigInt(dto.size),
              type: dto.type,
              mimeType: dto.mime,
              storageKey: dto.storageKey,
              checksum: dto.checksum || meta.checksum || null,
              uploadedById: userId,
              description: dto.description || null,
            },
            include: {
              uploadedBy: { select: { fullName: true, username: true } },
              project: { select: { name: true } },
            },
          });
          return created;
        },
        { isolationLevel: 'Serializable' },
      );
    } catch (err) {
      await this.storage.delete(dto.storageKey).catch(() => {});
      const errMessage = (err as any)?.message ?? '';
      if (
        /TransactionWriteConflict|write conflict|deadlock|40001/i.test(
          errMessage,
        ) ||
        (err as any)?.code === 'P2034'
      ) {
        throw new PayloadTooLargeException({
          code: 'quota_exceeded',
          message: 'Workspace storage quota exceeded',
        });
      }
      throw err;
    }

    this.events.emit('file.uploaded', {
      workspaceId,
      projectId: fileRecord.projectId ?? undefined,
      actorId: userId,
      name: fileRecord.name,
    });

    return {
      id: fileRecord.id,
      workspaceId: fileRecord.workspaceId,
      projectId: fileRecord.projectId,
      projectName: fileRecord.project?.name,
      folder: fileRecord.folder,
      name: fileRecord.name,
      size: Number(fileRecord.sizeBytes),
      type: fileRecord.type,
      extension: fileRecord.extension,
      uploadedBy:
        fileRecord.uploadedBy.fullName || fileRecord.uploadedBy.username,
      uploadedAt: fileRecord.uploadedAt.toISOString(),
      url: `/api/v1/files/${fileRecord.id}/download`,
      downloadsCount: fileRecord.downloadsCount,
      description: fileRecord.description || undefined,
    };
  }

  async download(fileId: string, userId: string) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
      include: { workspace: { include: { members: true } } },
    });

    if (!file || file.deletedAt) {
      throw new NotFoundException({
        code: 'not_found',
        message: 'File not found',
      });
    }

    const member = file.workspace.members.find((m) => m.userId === userId);
    if (!member) {
      throw new NotFoundException({
        code: 'not_found',
        message: 'File not found',
      });
    }

    // Atomic increment downloadsCount
    await this.prisma.file.update({
      where: { id: fileId },
      data: { downloadsCount: { increment: 1 } },
    });

    const buffer = this.storage.getBuffer
      ? await this.storage.getBuffer(file.storageKey)
      : Buffer.from('');

    return {
      buffer,
      name: file.name,
      mimeType: file.mimeType,
      size: Number(file.sizeBytes),
    };
  }

  async remove(fileId: string, userId: string) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
      include: { workspace: { include: { members: true } } },
    });

    if (!file || file.deletedAt) {
      throw new NotFoundException({
        code: 'not_found',
        message: 'File not found',
      });
    }

    const member = file.workspace.members.find((m) => m.userId === userId);
    if (!member) {
      throw new NotFoundException({
        code: 'not_found',
        message: 'File not found',
      });
    }

    // Permission check: delete by uploader or workspace admin/owner
    const isUploader = file.uploadedById === userId;
    const isAdminOrOwner = ['owner', 'admin'].includes(member.role);

    if (!isUploader && !isAdminOrOwner) {
      throw new ForbiddenException({
        code: 'forbidden',
        message: 'You do not have permission to delete this file',
      });
    }

    await this.prisma.file.delete({
      where: { id: fileId },
    });

    await this.storage.delete(file.storageKey).catch(() => {});

    this.events.emit('file.deleted', {
      workspaceId: file.workspaceId,
      projectId: file.projectId ?? undefined,
      actorId: userId,
      name: file.name,
    });
  }
}
