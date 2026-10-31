import { Controller, Get, Param, Post, Body, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { WorkspaceRoles } from '../../common/guards/workspace-roles.decorator.js';
import { WorkspaceScopeGuard } from '../../common/guards/workspace-scope.guard.js';
import { ActivityService } from './activity.service.js';
import { CreateActivityDto, FocusSessionDto } from './dto/activity.dto.js';

@Controller()
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private readonly activity: ActivityService) {}

  @Get('workspaces/:workspaceId/activity')
  @UseGuards(WorkspaceScopeGuard)
  @WorkspaceRoles('owner', 'admin', 'member', 'guest')
  list(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.activity.listByWorkspace(workspaceId, user.id);
  }

  @Post('workspaces/:workspaceId/activity')
  @UseGuards(WorkspaceScopeGuard)
  @WorkspaceRoles('owner', 'admin', 'member')
  record(
    @Param('workspaceId') workspaceId: string,
    @Body() body: CreateActivityDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.activity.record(workspaceId, user.id, body as any);
  }

  @Get('users/:id/focus-sessions')
  focusSessions(@Param('id') id: string) {
    return this.activity.listFocusSessions(id);
  }

  @Post('users/:id/focus-sessions')
  focusLog(@Param('id') id: string, @Body() body: FocusSessionDto) {
    return this.activity.logFocusSession(body as any);
  }
}
