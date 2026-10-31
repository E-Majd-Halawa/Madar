import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationStreamService } from './notifications-stream.service.js';
import { NotificationsRepository } from './notifications.repository.js';
import { NotificationsService } from './notifications.service.js';
import { PrismaService } from '../../database/prisma.service.js';

@Module({
  imports: [AuthModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsRepository,
    NotificationStreamService,
    NotificationsService,
    PrismaService,
  ],
  exports: [
    NotificationsService,
    NotificationsRepository,
    NotificationStreamService,
  ],
})
export class NotificationsModule {}
