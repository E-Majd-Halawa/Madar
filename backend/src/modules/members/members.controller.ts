import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import type { WorkspaceMemberItem } from '../../common/contracts/api.contracts.js';
import { WorkspaceScopeGuard } from '../../common/guards/workspace-scope.guard.js';
import { WorkspaceRoles } from '../../common/guards/workspace-roles.decorator.js';
import { RateLimit } from '../../common/rate-limit/rate-limit.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy.js';
import { UpdateMemberRoleDto } from './dto/members.dto.js';
import { MembersService } from './members.service.js';

@ApiTags('members')
@ApiBearerAuth()
@UseGuards(WorkspaceScopeGuard)
@Controller('workspaces/:workspaceId/members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  @RateLimit('read')
  @ApiOperation({ summary: 'List workspace members (any active member)' })
  @ApiResponse({ status: 200, description: 'WorkspaceMemberItem[]' })
  @ApiResponse({ status: 403, description: 'not_a_member' })
  list(
    @Param('workspaceId') workspaceId: string,
  ): Promise<WorkspaceMemberItem[]> {
    return this.membersService.list(workspaceId);
  }

  @Patch(':userId')
  @WorkspaceRoles('owner', 'admin')
  @RateLimit('write')
  @ApiOperation({ summary: 'Change a workspace member role (owner/admin)' })
  @ApiResponse({ status: 200, description: 'WorkspaceMemberItem' })
  @ApiResponse({ status: 403, description: 'insufficient_workspace_role' })
  @ApiResponse({ status: 404, description: 'member_not_found' })
  @ApiResponse({ status: 409, description: 'cannot_remove_last_owner' })
  updateRole(
    @Param('workspaceId') workspaceId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateMemberRoleDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<WorkspaceMemberItem> {
    return this.membersService.updateRole(
      workspaceId,
      user.id,
      userId,
      dto.role,
      {
        ip: req.ip ?? req.socket.remoteAddress,
        device: req.headers['user-agent'],
      },
    );
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RateLimit('write')
  @ApiOperation({
    summary: 'Remove a member, or leave the workspace (self)',
  })
  @ApiResponse({ status: 204, description: 'Member removed' })
  @ApiResponse({ status: 403, description: 'insufficient_workspace_role' })
  @ApiResponse({ status: 404, description: 'member_not_found' })
  @ApiResponse({ status: 409, description: 'cannot_remove_last_owner' })
  async remove(
    @Param('workspaceId') workspaceId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.membersService.removeMember(workspaceId, user.id, userId);
  }
}
