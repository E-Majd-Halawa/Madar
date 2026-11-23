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

    if (file.size > this.maxBytes) {
      throw new BadRequestException({
        code: 'file_too_large',
        message: `File exceeds the maximum allowed size of ${this.maxBytes} bytes.`,
      });
    }

    this.ensureConfigured();

    return new Promise<CloudinaryUploadResult>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'auto' },
        (error, result) => {
          if (error || !result) {
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
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        },
      );

      streamifier.createReadStream(file.buffer).pipe(stream);
    });
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