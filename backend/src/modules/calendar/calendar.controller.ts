import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { WorkspaceRoles } from '../../common/guards/workspace-roles.decorator.js';
import { WorkspaceScopeGuard } from '../../common/guards/workspace-scope.guard.js';
import { CalendarService } from './calendar.service.js';

@Controller()
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly calendar: CalendarService) {}

  @Get('workspaces/:workspaceId/calendar')
  @UseGuards(WorkspaceScopeGuard)
  @WorkspaceRoles('owner', 'admin', 'member', 'guest')
  getItems(
    @Param('workspaceId') workspaceId: string,
    @Query() query: any,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.calendar.getItems(workspaceId, user.id, query ?? {});
  }
}
