import { Module } from '@nestjs/common';
import { ActivityController } from './activity.controller.js';
import { ActivityRepository } from './activity.repository.js';
import { ActivityService } from './activity.service.js';
import { ActivitySubscriber } from './activity.subscriber.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { PrismaService } from '../../database/prisma.service.js';

@Module({
  imports: [NotificationsModule],
  controllers: [ActivityController],
  providers: [
    ActivityRepository,
    ActivityService,
    ActivitySubscriber,
    PrismaService,
  ],
  exports: [ActivityService, ActivityRepository],
})
export class ActivityModule {}
