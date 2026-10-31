import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Workspace } from '../../common/contracts/api.contracts.js';
import { WorkspaceScopeGuard } from '../../common/guards/workspace-scope.guard.js';
import { RateLimit } from '../../common/rate-limit/rate-limit.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy.js';
import { WorkspacesService } from './workspaces.service.js';

@ApiTags('workspaces')
@ApiBearerAuth()
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  @RateLimit('read')
  @ApiOperation({
    summary: 'List the current user workspaces (personal workspace ensured)',
  })
  @ApiResponse({ status: 200, description: 'Workspace[]' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  list(@CurrentUser() user: AuthenticatedUser): Promise<Workspace[]> {
    return this.workspacesService.list(user.id);
  }

  @Get(':id')
  @UseGuards(WorkspaceScopeGuard)
  @RateLimit('read')
  @ApiOperation({ summary: 'Get one workspace (active members only)' })
  @ApiResponse({ status: 200, description: 'Workspace' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'not_a_member' })
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<Workspace> {
    return this.workspacesService.getById(user.id, id);
  }
}
