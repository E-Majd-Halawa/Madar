import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module.js';
import { WorkspaceScopeGuard } from '../../common/guards/workspace-scope.guard.js';
import { WorkspacesController } from './workspaces.controller.js';
import { WorkspacesRepository } from './workspaces.repository.js';
import { WorkspacesService } from './workspaces.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [WorkspacesController],
  providers: [WorkspacesService, WorkspacesRepository, WorkspaceScopeGuard],
  exports: [WorkspacesService, WorkspacesRepository],
})
export class WorkspacesModule {}
