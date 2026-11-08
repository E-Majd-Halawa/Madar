import { Global, Module } from '@nestjs/common';
import { FILE_STORAGE } from './file-storage.interface.js';
import { LocalDiskStorageService } from './local-disk-storage.service.js';
import { S3StorageService } from './s3-storage.service.js';

@Global()
@Module({
  providers: [
    LocalDiskStorageService,
    S3StorageService,
    {
      provide: FILE_STORAGE,
      useFactory: () => {
        const driver = process.env.FILE_STORAGE_DRIVER || 'local';
        if (driver === 's3') {
          return new S3StorageService();
        }
        return new LocalDiskStorageService();
      },
    },
  ],
  exports: [FILE_STORAGE, LocalDiskStorageService, S3StorageService],
})
export class StorageModule {}
