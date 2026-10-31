import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { PendingInvite } from '../../common/contracts/api.contracts.js';
import { WorkspaceScopeGuard } from '../../common/guards/workspace-scope.guard.js';
import { WorkspaceRoles } from '../../common/guards/workspace-roles.decorator.js';
import { RateLimit } from '../../common/rate-limit/rate-limit.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy.js';
import { InviteMemberDto } from './dto/invitations.dto.js';
import { InvitationsService } from './invitations.service.js';

@ApiTags('invitations')
@ApiBearerAuth()
@UseGuards(WorkspaceScopeGuard)
@Controller('workspaces/:workspaceId/invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Get()
  @WorkspaceRoles('owner', 'admin')
  @RateLimit('read')
  @ApiOperation({ summary: 'List pending invitations (owner/admin)' })
  @ApiResponse({ status: 200, description: 'PendingInvite[]' })
  @ApiResponse({ status: 403, description: 'insufficient_workspace_role' })
  list(@Param('workspaceId') workspaceId: string): Promise<PendingInvite[]> {
    return this.invitationsService.list(workspaceId);
  }

  @Post()
  @WorkspaceRoles('owner', 'admin')
  @RateLimit('write')
  @ApiOperation({ summary: 'Invite an email to the workspace (owner/admin)' })
  @ApiResponse({ status: 201, description: 'PendingInvite' })
  @ApiResponse({ status: 400, description: 'invalid_role' })
  @ApiResponse({ status: 403, description: 'insufficient_workspace_role' })
  @ApiResponse({ status: 409, description: 'already_member / already_invited' })
  create(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: InviteMemberDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PendingInvite> {
    return this.invitationsService.create(workspaceId, user, dto);
  }

  @Delete(':id')
  @WorkspaceRoles('owner', 'admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RateLimit('write')
  @ApiOperation({ summary: 'Revoke a pending invitation (owner/admin)' })
  @ApiResponse({ status: 204, description: 'Invitation revoked' })
  @ApiResponse({ status: 404, description: 'invitation_not_found' })
  async revoke(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.invitationsService.revoke(workspaceId, id, user.id);
  }

  @Post(':id/resend')
  @WorkspaceRoles('owner', 'admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RateLimit('write')
  @ApiOperation({
    summary: 'Rotate the token, extend expiry and resend (owner/admin)',
  })
  @ApiResponse({ status: 204, description: 'Invitation resent' })
  @ApiResponse({ status: 404, description: 'invitation_not_found' })
  @ApiResponse({ status: 410, description: 'invitation_expired' })
  async resend(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.invitationsService.resend(workspaceId, id, user);
  }
}
