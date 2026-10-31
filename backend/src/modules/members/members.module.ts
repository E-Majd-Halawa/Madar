import { Module } from '@nestjs/common';
import { WorkspaceScopeGuard } from '../../common/guards/workspace-scope.guard.js';
import { PrismaModule } from '../../database/prisma.module.js';
import { WorkspacesModule } from '../workspaces/workspaces.module.js';
import { InvitationAcceptController } from './invitation-accept.controller.js';
import { InvitationsController } from './invitations.controller.js';
import { InvitationsRepository } from './invitations.repository.js';
import { InvitationsService } from './invitations.service.js';
import { MembersController } from './members.controller.js';
import { MembersRepository } from './members.repository.js';
import { MembersService } from './members.service.js';

@Module({
  imports: [PrismaModule, WorkspacesModule],
  controllers: [
    MembersController,
    InvitationsController,
    InvitationAcceptController,
  ],
  providers: [
    MembersService,
    InvitationsService,
    MembersRepository,
    InvitationsRepository,
    WorkspaceScopeGuard,
  ],
})
export class MembersModule {}
