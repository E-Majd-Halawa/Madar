import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller.js';
import { TasksRepository } from './tasks.repository.js';
import { TasksService } from './tasks.service.js';
import { PrismaService } from '../../database/prisma.service.js';
import { ProjectsModule } from '../projects/projects.module.js';

@Module({
  imports: [ProjectsModule],
  controllers: [TasksController],
  providers: [TasksRepository, TasksService, PrismaService],
  exports: [TasksService, TasksRepository],
})
export class TasksModule {}
