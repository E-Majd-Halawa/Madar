import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { WorkspaceRoles } from '../../common/guards/workspace-roles.decorator.js';
import { WorkspaceScopeGuard } from '../../common/guards/workspace-scope.guard.js';
import { ProjectsService } from './projects.service.js';
import { CreateProjectDto, UpdateProjectDto } from './dto/projects.dto.js';

@Controller()
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get('workspaces/:workspaceId/projects')
  @UseGuards(WorkspaceScopeGuard)
  @WorkspaceRoles('owner', 'admin', 'member', 'guest')
  list(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projects.list(workspaceId, user.id);
  }

  @Post('projects')
  create(
    @Body() body: CreateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projects.create(body as any, user.id);
  }

  @Get('projects/:id')
  getById(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.projects.getById(id, user.id);
  }

  @Patch('projects/:id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projects.update(id, body as any, user.id);
  }

  @Delete('projects/:id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.projects.remove(id, user.id);
  }
}
