import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller.js';
import { ProjectsRepository } from './projects.repository.js';
import { ProjectsService } from './projects.service.js';
import { PrismaService } from '../../database/prisma.service.js';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsRepository, ProjectsService, PrismaService],
  exports: [ProjectsService, ProjectsRepository],
})
export class ProjectsModule {}
