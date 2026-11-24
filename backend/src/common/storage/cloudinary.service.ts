import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

interface UploadedFile {
  buffer: Buffer;
  size: number;
  originalname: string;
  mimetype: string;
}

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}

const ALLOWED_MIME_TYPES = new Set<string>([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'text/plain',
  'application/json',
  'application/zip',
  'application/x-zip-compressed',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

/**
 * Buffer-based Cloudinary uploader. No local disk storage is used: files are
 * received by multer in memory (memoryStorage) and streamed straight to
 * Cloudinary. Only the resulting HTTPS URL is meant to be persisted.
 */
@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly maxBytes: number;

  constructor(config: ConfigService) {
    cloudinary.config({
      cloud_name: config.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: config.get<string>('CLOUDINARY_API_KEY'),
      api_secret: config.get<string>('CLOUDINARY_API_SECRET'),
    });

    const maxMb = config.get<number>('MAX_UPLOAD_MB') ?? 25;
    this.maxBytes = maxMb * 1024 * 1024;
  }

  private ensureConfigured(): void {
    const cfg = cloudinary.config();
    if (!cfg.cloud_name || !cfg.api_key || !cfg.api_secret) {
      throw new InternalServerErrorException({
        code: 'cloudinary_not_configured',
        message: 'Cloudinary is not configured on the server.',
      });
    }
  }

  private sanitizeFolder(folder: string): string {
    const trimmed = (folder || 'madar').trim();
    if (!/^[a-zA-Z0-9/_-]+$/.test(trimmed) || trimmed.includes('..')) {
      throw new BadRequestException({
        code: 'invalid_folder',
        message: 'Invalid upload folder.',
      });
    }
    return trimmed.replace(/^\/+|\/+$/g, '') || 'madar';
  }

  async uploadFile(
    file: UploadedFile,
    folder = 'madar',
  ): Promise<CloudinaryUploadResult> {
    if (!file) {
      throw new BadRequestException({
        code: 'file_missing',
        message: 'No file was provided.',
      });
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException({
        code: 'file_empty',
        message: 'Uploaded file is empty.',
      });
    }

    // Trust the actual buffer size, not the client-reported size.
    if (file.buffer.length > this.maxBytes) {
      throw new BadRequestException({
        code: 'file_too_large',
        message: `File exceeds the maximum allowed size of ${this.maxBytes} bytes.`,
      });
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException({
        code: 'unsupported_file_type',
        message: 'This file type is not allowed.',
      });
    }

    this.ensureConfigured();
    const safeFolder = this.sanitizeFolder(folder);

    let publicId: string | undefined;
    try {
      const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: safeFolder, resource_type: 'auto' },
          (error, uploaded) => {
            if (error || !uploaded) {
              this.logger.error(
                `Cloudinary upload failed: ${error?.message ?? 'unknown error'}`,
              );
              reject(
                new InternalServerErrorException({
                  code: 'upload_failed',
                  message: 'Failed to upload file to cloud storage.',
                }),
              );
              return;
            }
            publicId = uploaded.public_id;
            resolve({
              url: uploaded.secure_url,
              publicId: uploaded.public_id,
            });
          },
        );

        streamifier.createReadStream(file.buffer).pipe(stream);
      });

      return result;
    } catch (error) {
      if (publicId) {
        await this.deleteFile(publicId);
      }
      throw error;
    }
  }

  async deleteFile(publicId: string): Promise<void> {
    if (!publicId) return;
    this.ensureConfigured();
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'auto' });
    } catch (error) {
      this.logger.warn(
        `Cloudinary delete failed for ${publicId}: ${(error as Error)?.message}`,
      );
    }
  }
}