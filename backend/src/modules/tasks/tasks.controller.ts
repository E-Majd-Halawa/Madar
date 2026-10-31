import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { WorkspaceRoles } from '../../common/guards/workspace-roles.decorator.js';
import { WorkspaceScopeGuard } from '../../common/guards/workspace-scope.guard.js';
import { TasksService } from './tasks.service.js';
import {
  BulkDeleteDto,
  BulkStatusDto,
  CreateTaskDto,
  TimeEntryDto,
  UpdateTaskDto,
} from './dto/tasks.dto.js';

@Controller()
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get('workspaces/:workspaceId/tasks')
  @UseGuards(WorkspaceScopeGuard)
  @WorkspaceRoles('owner', 'admin', 'member', 'guest')
  list(
    @Param('workspaceId') workspaceId: string,
    @Query() query: any,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasks.listByWorkspace(workspaceId, user.id, query ?? {});
  }

  @Post('tasks')
  create(@Body() body: CreateTaskDto, @CurrentUser() user: AuthenticatedUser) {
    return this.tasks.create(body as any, user.id);
  }

  @Get('tasks/:id')
  getById(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.tasks.getById(id, user.id);
  }

  @Patch('tasks/:id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasks.update(id, body as any, user.id);
  }

  @Delete('tasks/:id')
  @HttpCode(204)
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.tasks.softDelete(id, user.id);
  }

  @Post('tasks/:id/restore')
  @HttpCode(204)
  restore(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.tasks.restore(id, user.id);
  }

  @Post('tasks/bulk-status')
  bulkStatus(
    @Body() body: BulkStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasks.bulkStatus(
      (body as any).ids,
      (body as any).status,
      user.id,
    );
  }

  @Post('tasks/bulk-delete')
  bulkDelete(
    @Body() body: BulkDeleteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasks.bulkDelete((body as any).ids, user.id);
  }

  @Post('tasks/:id/time-entries')
  @HttpCode(200)
  timeEntry(
    @Param('id') id: string,
    @Body() body: TimeEntryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasks.addTimeEntry(
      id,
      (body as any).minutes,
      (body as any).note,
      user.id,
    );
  }

  @Post('tasks/:id/comments')
  @HttpCode(200)
  comment(
    @Param('id') id: string,
    @Body('authorId') authorId: string,
    @Body('content') content: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasks.addComment(id, user.id, content, user.id);
  }
}
